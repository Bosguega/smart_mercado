import { supabase } from '../lib/supabase'
import { normalizeProductName } from '../utils/normalize'
import type { DicionarioProduto, CategorizeResponse } from '../types'

/**
 * Busca um produto no dicionário pelo nome normalizado
 */
export async function buscarNoDicionario(
  nomeOriginal: string
): Promise<DicionarioProduto | null> {
  const nomeNormalizado = normalizeProductName(nomeOriginal)

  const { data, error } = await supabase
    .from('dicionario_produtos')
    .select('*')
    .eq('nome_normalizado', nomeNormalizado)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // Não encontrado
      return null
    }
    console.error('Erro ao buscar no dicionário:', error)
    return null
  }

  return data
}

/**
 * Busca um produto no dicionário pelo código do produto
 */
export async function buscarPorCodigo(
  codigoProduto: string
): Promise<DicionarioProduto | null> {
  const { data, error } = await supabase
    .from('dicionario_produtos')
    .select('*')
    .eq('codigo_produto', codigoProduto)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('Erro ao buscar por código:', error)
    return null
  }

  return data
}

/**
 * Salva um produto no dicionário
 */
export async function salvarNoDicionario(
  nomeOriginal: string,
  nomeAmigavel: string,
  categoria: string,
  subcategoria?: string,
  codigoProduto?: string
): Promise<DicionarioProduto | null> {
  const nomeNormalizado = normalizeProductName(nomeOriginal)

  const { data, error } = await supabase
    .from('dicionario_produtos')
    .upsert({
      codigo_produto: codigoProduto,
      nome_original: nomeOriginal,
      nome_normalizado: nomeNormalizado,
      nome_amigavel: nomeAmigavel,
      categoria,
      subcategoria,
    })
    .select()
    .single()

  if (error) {
    console.error('Erro ao salvar no dicionário:', error)
    return null
  }

  return data
}

/**
 * Categoriza um produto, buscando no dicionário ou chamando a API
 */
export async function categorizarProduto(
  nomeOriginal: string,
  codigoProduto?: string
): Promise<CategorizeResponse> {
  // 1. Tenta buscar pelo código do produto
  if (codigoProduto) {
    const porCodigo = await buscarPorCodigo(codigoProduto)
    if (porCodigo) {
      return {
        nome_amigavel: porCodigo.nome_amigavel,
        categoria: porCodigo.categoria,
        subcategoria: porCodigo.subcategoria || undefined,
      }
    }
  }

  // 2. Tenta buscar pelo nome normalizado
  const porNome = await buscarNoDicionario(nomeOriginal)
  if (porNome) {
    return {
      nome_amigavel: porNome.nome_amigavel,
      categoria: porNome.categoria,
      subcategoria: porNome.subcategoria || undefined,
    }
  }

  // 3. Chama a Edge Function do Gemini para categorizar
  try {
    const { data, error } = await supabase.functions.invoke('categorize', {
      body: { nomeProduto: nomeOriginal },
    })

    if (error) {
      console.error('Erro ao chamar Edge Function:', error)
      // Retorna categoria padrão em caso de erro
      return {
        nome_amigavel: nomeOriginal,
        categoria: 'Outros',
      }
    }

    const resposta = data as CategorizeResponse

    // Salva no dicionário para futuras consultas
    await salvarNoDicionario(
      nomeOriginal,
      resposta.nome_amigavel,
      resposta.categoria,
      resposta.subcategoria,
      codigoProduto
    )

    return resposta
  } catch (error) {
    console.error('Erro ao categorizar produto:', error)
    return {
      nome_amigavel: nomeOriginal,
      categoria: 'Outros',
    }
  }
}

/**
 * Lista todos os produtos do dicionário (para debug/admin)
 */
export async function listarDicionario(): Promise<DicionarioProduto[]> {
  const { data, error } = await supabase
    .from('dicionario_produtos')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao listar dicionário:', error)
    return []
  }

  return data || []
}