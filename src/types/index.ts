export interface NotaFiscal {
  id: string
  user_id: string
  codigo_barras: string
  url_consulta?: string
  estabelecimento?: string
  cnpj?: string
  data_emissao?: string
  valor_total: number
  created_at: string
  produtos?: Produto[]
}

export interface Produto {
  id: string
  nota_id: string
  codigo_produto?: string
  descricao_original: string
  descricao_amigavel?: string
  categoria?: string
  subcategoria?: string
  quantidade: number
  unidade?: string
  valor_unitario: number
  valor_total: number
  created_at: string
}

export interface Categoria {
  id: string
  nome: string
  icone?: string
  cor?: string
  ordem: number
}

export interface DicionarioProduto {
  id: string
  codigo_produto?: string
  nome_original: string
  nome_normalizado: string
  nome_amigavel: string
  categoria: string
  subcategoria?: string
  created_at: string
  updated_at: string
}

export interface CategorizeResponse {
  nome_amigavel: string
  categoria: string
  subcategoria?: string
}

export type RootStackParamList = {
  Home: undefined
  Login: undefined
  Scanner: undefined
  Notas: undefined
  NotaDetalhe: { id: string }
}