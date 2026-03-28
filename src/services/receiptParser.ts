import { supabase } from '../lib/supabase'
import type { CategorizeResponse } from '../types'

const PROXIES = [
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
]

const PROXY_TIMEOUT_MS = 15000

interface ScrapedItem {
  name: string
  qty: number
  unit: string
  unitPrice: number
  total: number
}

interface ScrapedReceipt {
  establishment: string
  date: string
  items: ScrapedItem[]
  total: number
  accessKey?: string
}

function parseNumber(value: string | null | undefined): number {
  if (!value) return 0
  const cleaned = value.replace(/[^\d,.-]/g, "").replace(",", ".").trim()
  return parseFloat(cleaned) || 0
}

const NOISE_KEYWORDS = [
  'TOTAL', 'VALOR', 'TRIBUTO', 'IMPOSTO', 'SAC', 'PAGAMENTO', 'TROCO', 'DESCONTO', 
  'SUBTOTAL', 'CREDITO', 'DEBITO', 'DINHEIRO', 'CARTAO', 'TICKET', 'VALE', 'CUPOM',
  'PAGO', 'LIQUIDO', 'VLTRIB', 'BASE CALC', 'CHAVE DE ACESSO', 'PROTOCOL'
]

function cleanProductName(name: string | null | undefined): string {
  if (!name) return ""
  return name
    .replace(/\(C[óo]digo:.*?\)/i, "") // Remove código entre parênteses
    .replace(/^\d{3,}\b/g, "") // Remove códigos numéricos no início
    .replace(/(?<!\d)\s+(KG|G|ML|L|UN|PC|CX)\b$/i, "") // Remove unidade no final
    .replace(/[^a-zA-Z0-9\s.,]/g, " ") // Remove caracteres especiais estranhos
    .replace(/\s+/g, " ")
    .trim()
}

function isNoise(name: string): boolean {
  const upper = name.toUpperCase()
  return NOISE_KEYWORDS.some(keyword => upper.includes(keyword)) || name.length < 2
}

/**
 * Chama a Edge Function para categorizar o produto usando IA, mas antes verifica o dicionário
 */
export async function categorizeProduct(productName: string): Promise<CategorizeResponse> {
  try {
    // 1. Verificar se já existe no dicionário (case-insensitive)
    const { data: existing, error: dictError } = await supabase
      .from('dicionario_produtos')
      .select('*')
      .eq('nome_original', productName)
      .maybeSingle()

    if (!dictError && existing) {
      return {
        nome_amigavel: existing.nome_amigavel,
        categoria: existing.categoria,
        subcategoria: existing.subcategoria
      }
    }

    // 2. Se não existir, chama a Edge Function (IA)
    const { data, error } = await supabase.functions.invoke('categorize', {
      body: { nomeProduto: productName }
    })

    if (error) throw error
    const result = data as CategorizeResponse

    // 3. Salva no dicionário para a próxima vez (persistência inteligente)
    await supabase.from('dicionario_produtos').insert({
      nome_original: productName,
      nome_amigavel: result.nome_amigavel,
      categoria: result.categoria,
      subcategoria: result.subcategoria,
      nome_normalizado: productName.toUpperCase().trim()
    })

    return result
  } catch (err) {
    console.error('Erro ao categorizar produto:', productName, err)
    return {
      nome_amigavel: productName,
      categoria: 'Outros'
    }
  }
}

export async function parseNFCe(url: string): Promise<ScrapedReceipt> {
  let html: string | null = null
  const attemptErrors: string[] = []

  for (let i = 0; i < PROXIES.length; i++) {
    const getProxyUrl = PROXIES[i]
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS)
      
      const response = await fetch(getProxyUrl(url), {
        signal: controller.signal,
        cache: "no-store",
      })
      clearTimeout(timeout)

      if (response.ok) {
        const text = await response.text()
        if (text && (text.includes("tabResult") || text.includes("txtTopo") || text.includes("NFCE-COM"))) {
          html = text
          break
        }
      }
    } catch (err) {
      attemptErrors.push(`Proxy ${i + 1} falhou`)
    }
  }

  if (!html) {
    throw new Error("Falha ao comunicar com a SEFAZ. Tente novamente ou use outra forma.")
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, "text/html")
  
  let establishment = "Estabelecimento Desconhecido"
  let date = new Date().toISOString()
  let totalValue = 0
  const items: ScrapedItem[] = []

  // Extrair Estabelecimento (Padrao SP/Outros)
  const companyEl = doc.querySelector(".txtTopo, .txtNome, #u20")
  if (companyEl) establishment = companyEl.textContent?.trim() || establishment

  // Extrair Itens
  const rows = doc.querySelectorAll("table#tabResult tr, .table tr, #tabResult tr")
  rows.forEach(row => {
    const nameEl = row.querySelector(".txtTit, .txtNome")
    if (!nameEl) return

    const rawName = nameEl.textContent?.trim() || ""
    const cleanName = cleanProductName(rawName)
    
    // Filtra ruido e itens irrelevantes
    if (isNoise(cleanName)) return

    const fullText = row.textContent || ""
    
    // Regex para extrair quantidade, unidade e valor unitario
    const qtyMatch = fullText.match(/Qtde\.?:\s*([\d.,]+)/i)
    const unitMatch = fullText.match(/UN:\s*([A-Z]+)/i)
    const unitPriceMatch = fullText.match(/Vl\.?\s*Unit\.?:\s*([\d.,]+)/i)
    const totalEl = row.querySelector(".valor, .txtVal")

    const qty = parseNumber(qtyMatch ? qtyMatch[1] : "1")
    const unit = unitMatch ? unitMatch[1].toUpperCase() : "UN"
    const unitPrice = parseNumber(unitPriceMatch ? unitPriceMatch[1] : "0")
    const total = parseNumber(totalEl?.textContent) || (qty * unitPrice)

    // Pular itens com valor zerado ou que parecem ser taxas/descontos
    if (total <= 0) return

    items.push({
      name: cleanName,
      qty,
      unit,
      unitPrice,
      total
    })
  })

  // Extrair Valor Total da Nota
  const totalEl = doc.querySelector(".txtMax, .totalNFe, .txtValTotal")
  if (totalEl) totalValue = parseNumber(totalEl.textContent)
  if (totalValue === 0 && items.length > 0) {
    totalValue = items.reduce((sum, item) => sum + item.total, 0)
  }

  // Chave de Acesso
  let accessKey = ""
  try {
    const urlObj = new URL(url)
    accessKey = urlObj.searchParams.get("p")?.split("|")[0] || urlObj.searchParams.get("chNFe") || ""
  } catch { /* ignore */ }

  return {
    establishment,
    date,
    items,
    total: totalValue,
    accessKey
  }
}
