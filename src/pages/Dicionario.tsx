import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDicionario, useAtualizarDicionario, useDeletarDicionario } from '../hooks/useDicionario'
import { Button } from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Loading } from '../components/ui/Loading'

export function Dicionario() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { data: entries, isLoading } = useDicionario(search)
  const atualizarDicionario = useAtualizarDicionario()
  const deletarDicionario = useDeletarDicionario()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ nome_amigavel: '', categoria: '' })

  const handleEdit = (entry: any) => {
    setEditingId(entry.id)
    setEditForm({ 
      nome_amigavel: entry.nome_amigavel || entry.nome_original, 
      categoria: entry.categoria || 'Outros' 
    })
  }

  const handleSave = async (id: string) => {
    await atualizarDicionario.mutateAsync({ id, ...editForm })
    setEditingId(null)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Deletar esta entrada? O app terá que recategorizar via IA.')) {
      await deletarDicionario.mutateAsync(id)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 border-b bg-background/60 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between px-6 mx-auto">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="rounded-full w-10 h-10 p-0 hover:bg-white/20">
              <span className="text-xl">←</span>
            </Button>
            <h1 className="text-xl font-bold tracking-tight text-gradient">Dicionário</h1>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600">
            📚
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-6 py-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-8 p-4 glass-card border-none">
          <input
            type="text"
            placeholder="Pesquisar no dicionário..."
            className="w-full rounded-xl bg-black/5 dark:bg-white/5 border border-white/20 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all shadow-inner"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <Loading className="py-24" />
        ) : (
          <div className="grid gap-4">
            {entries?.map((entry) => (
              <Card key={entry.id} className="border-none glass-card group hover:scale-[1.01] transition-transform">
                <CardContent className="p-4">
                  {editingId === entry.id ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Nome Original</p>
                        <p className="text-xs font-mono opacity-50">{entry.nome_original}</p>
                      </div>
                      <div className="grid gap-3">
                        <input
                          type="text"
                          className="w-full rounded-lg bg-black/5 dark:bg-white/5 border border-white/20 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                          value={editForm.nome_amigavel}
                          onChange={(e) => setEditForm(prev => ({ ...prev, nome_amigavel: e.target.value }))}
                          placeholder="Nome Amigável"
                        />
                        <select
                          className="w-full rounded-lg bg-black/5 dark:bg-white/5 border border-white/20 px-3 py-2 text-sm focus:outline-none"
                          value={editForm.categoria}
                          onChange={(e) => setEditForm(prev => ({ ...prev, categoria: e.target.value }))}
                        >
                          <option value="Hortifruti">Hortifruti</option>
                          <option value="Açougue">Açougue</option>
                          <option value="Laticínios">Laticínios</option>
                          <option value="Padaria">Padaria</option>
                          <option value="Bebidas">Bebidas</option>
                          <option value="Limpeza">Limpeza</option>
                          <option value="Higiene">Higiene</option>
                          <option value="Mercearia">Mercearia</option>
                          <option value="Congelados">Congelados</option>
                          <option value="Pet">Pet</option>
                          <option value="Outros">Outros</option>
                        </select>
                      </div>
                      <div className="flex gap-2 justify-end pt-2">
                        <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>Cancelar</Button>
                        <Button size="sm" onClick={() => handleSave(entry.id)}>Salvar Alterações</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="font-bold text-sm">{entry.nome_amigavel || entry.nome_original}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px] py-0">{entry.categoria || 'Outros'}</Badge>
                          <p className="text-[10px] font-mono text-muted-foreground opacity-50 truncate max-w-[200px]">{entry.nome_original}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEdit(entry)}>✏️</Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500" onClick={() => handleDelete(entry.id)}>🗑️</Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {!entries?.length && (
              <div className="text-center py-24 glass-card border-none opacity-50">
                <p>Nenhuma entrada encontrada no dicionário.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
