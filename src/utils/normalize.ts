/**
 * Normaliza o nome de um produto para busca no dicionário
 * Remove acentos, converte para lowercase, remove caracteres especiais
 */
export function normalizeProductName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, ' ') // Normaliza espaços
    .trim()
}

/**
 * Formata valor monetário para exibição
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/**
 * Formata data para exibição
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/**
 * Formata CNPJ
 */
export function formatCNPJ(cnpj: string): string {
  const cleaned = cnpj.replace(/\D/g, '')
  if (cleaned.length !== 14) return cnpj
  
  return cleaned.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  )
}

/**
 * Extrai URL de consulta do QR Code da NFC-e
 * Formato típico: https://www.sefaz.rs.gov.br/NFCE/NFCE-COM.aspx?p=...
 */
export function extractNFCeUrl(qrCodeContent: string): string | null {
  // Tenta extrair URL de consulta da NFC-e
  const urlMatch = qrCodeContent.match(/https?:\/\/[^\s]+/i)
  if (urlMatch) {
    return urlMatch[0]
  }
  
  // Se não encontrou URL, pode ser apenas o código
  return null
}

/**
 * Verifica se o código é um QR Code de NFC-e válido
 */
export function isValidNFCeCode(code: string): boolean {
  // NFC-e geralmente contém URL da SEFAZ ou código numérico longo
  const hasUrl = /sefaz|nfce|fazenda/i.test(code)
  const isLongNumeric = /^\d{44}$/.test(code.replace(/\D/g, ''))
  
  return hasUrl || isLongNumeric
}

/**
 * Extrai informações básicas do código da nota
 */
export function parseNotaCode(code: string): {
  url?: string
  codigoNumerico?: string
} {
  const url = extractNFCeUrl(code)
  const codigoNumerico = code.replace(/\D/g, '')
  
  return {
    url: url || undefined,
    codigoNumerico: codigoNumerico.length >= 44 ? codigoNumerico : undefined,
  }
}