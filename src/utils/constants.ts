import type { Categoria } from '../types'

export const CATEGORIAS_PADRAO: Omit<Categoria, 'id'>[] = [
  { nome: 'Hortifruti', icone: '🥬', cor: '#22c55e', ordem: 1 },
  { nome: 'Açougue', icone: '🥩', cor: '#ef4444', ordem: 2 },
  { nome: 'Laticínios', icone: '🥛', cor: '#f59e0b', ordem: 3 },
  { nome: 'Padaria', icone: '🍞', cor: '#d97706', ordem: 4 },
  { nome: 'Bebidas', icone: '🥤', cor: '#3b82f6', ordem: 5 },
  { nome: 'Limpeza', icone: '🧹', cor: '#8b5cf6', ordem: 6 },
  { nome: 'Higiene', icone: '🧴', cor: '#ec4899', ordem: 7 },
  { nome: 'Mercearia', icone: '🛒', cor: '#6366f1', ordem: 8 },
  { nome: 'Congelados', icone: '🧊', cor: '#06b6d4', ordem: 9 },
  { nome: 'Pet', icone: '🐾', cor: '#84cc16', ordem: 10 },
  { nome: 'Outros', icone: '📦', cor: '#6b7280', ordem: 99 },
]

export const UNIDADES_MEDIDA = [
  'UN',
  'KG',
  'G',
  'L',
  'ML',
  'CX',
  'PC',
  'FD',
  'LT',
  'PCT',
] as const

export type UnidadeMedida = typeof UNIDADES_MEDIDA[number]