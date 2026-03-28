import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { NotaFiscal, Produto } from '../types'

// Chaves de query
export const notasKeys = {
  all: ['notas'] as const,
  lists: () => [...notasKeys.all, 'list'] as const,
  list: (userId: string) => [...notasKeys.lists(), userId] as const,
  details: () => [...notasKeys.all, 'detail'] as const,
  detail: (id: string) => [...notasKeys.details(), id] as const,
}

// Buscar todas as notas do usuário
export function useNotas() {
  const { user } = useAuth()

  return useQuery({
    queryKey: notasKeys.list(user?.id || ''),
    queryFn: async () => {
      if (!user) return []

      const { data, error } = await supabase
        .from('notas_fiscais')
        .select(`
          *,
          produtos (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao buscar notas:', error)
        throw error
      }

      return data as (NotaFiscal & { produtos: Produto[] })[]
    },
    enabled: !!user,
  })
}

// Buscar uma nota específica
export function useNota(id: string) {
  return useQuery({
    queryKey: notasKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notas_fiscais')
        .select(`
          *,
          produtos (*)
        `)
        .eq('id', id)
        .single()

      if (error) {
        console.error('Erro ao buscar nota:', error)
        throw error
      }

      return data as NotaFiscal & { produtos: Produto[] }
    },
    enabled: !!id,
  })
}

// Criar uma nova nota
export function useCriarNota() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (nota: Omit<NotaFiscal, 'id' | 'user_id' | 'created_at'>) => {
      if (!user) throw new Error('Usuário não autenticado')

      const { data, error } = await supabase
        .from('notas_fiscais')
        .insert({
          ...nota,
          user_id: user.id,
        })
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar nota:', error)
        throw error
      }

      return data as NotaFiscal
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notasKeys.lists() })
    },
  })
}

// Atualizar uma nota
export function useAtualizarNota() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<NotaFiscal> & { id: string }) => {
      const { data, error } = await supabase
        .from('notas_fiscais')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Erro ao atualizar nota:', error)
        throw error
      }

      return data as NotaFiscal
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: notasKeys.lists() })
      queryClient.invalidateQueries({ queryKey: notasKeys.detail(data.id) })
    },
  })
}

// Deletar uma nota
export function useDeletarNota() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notas_fiscais')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Erro ao deletar nota:', error)
        throw error
      }

      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notasKeys.lists() })
    },
  })
}

// Adicionar produtos a uma nota
export function useAdicionarProdutos() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ notaId, produtos }: { notaId: string; produtos: Omit<Produto, 'id' | 'nota_id' | 'created_at'>[] }) => {
      const produtosComNotaId = produtos.map(produto => ({
        ...produto,
        nota_id: notaId,
      }))

      const { data, error } = await supabase
        .from('produtos')
        .insert(produtosComNotaId)
        .select()

      if (error) {
        console.error('Erro ao adicionar produtos:', error)
        throw error
      }

      return data as Produto[]
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: notasKeys.detail(variables.notaId) })
      queryClient.invalidateQueries({ queryKey: notasKeys.lists() })
    },
  })
}

// Deletar um produto
export function useDeletarProduto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, notaId }: { id: string; notaId: string }) => {
      const { error } = await supabase
        .from('produtos')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Erro ao deletar produto:', error)
        throw error
      }

      return { id, notaId }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: notasKeys.detail(data.notaId) })
      queryClient.invalidateQueries({ queryKey: notasKeys.lists() })
    },
  })
}