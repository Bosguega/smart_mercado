import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { DicionarioProduto } from '../types'

export const dicionarioKeys = {
  all: ['dicionario'] as const,
  lists: () => [...dicionarioKeys.all, 'list'] as const,
  list: (search: string) => [...dicionarioKeys.lists(), { search }] as const,
}

export function useDicionario(search = '') {
  return useQuery({
    queryKey: dicionarioKeys.list(search),
    queryFn: async () => {
      let query = supabase
        .from('dicionario_produtos')
        .select('*')
        .order('nome_amigavel', { ascending: true })

      if (search) {
        query = query.or(`nome_original.ilike.%${search}%,nome_amigavel.ilike.%${search}%`)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro ao buscar dicionário:', error)
        throw error
      }

      return data as DicionarioProduto[]
    },
  })
}

export function useAtualizarDicionario() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (entry: Partial<DicionarioProduto> & { id: string }) => {
      const { data, error } = await supabase
        .from('dicionario_produtos')
        .update(entry)
        .eq('id', entry.id)
        .select()
        .single()

      if (error) {
        console.error('Erro ao atualizar dicionário:', error)
        throw error
      }

      return data as DicionarioProduto
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dicionarioKeys.all })
    },
  })
}

export function useDeletarDicionario() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('dicionario_produtos')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Erro ao deletar dicionário:', error)
        throw error
      }

      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dicionarioKeys.all })
    },
  })
}
