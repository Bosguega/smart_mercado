import { Link, useNavigate } from 'react-router-dom'
import { useNotas, useDeletarNota, useLimparNotas } from '../hooks/useNotas'
import { Button } from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'
import { Loading } from '../components/ui/Loading'
import { formatCurrency, formatDate } from '../utils/normalize'

export function Notas() {
  const navigate = useNavigate()
  const { data: notas, isLoading } = useNotas()
  const deletarNota = useDeletarNota()
  const limparNotas = useLimparNotas()

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja deletar esta nota?')) {
      await deletarNota.mutateAsync(id)
    }
  }

  const handleLimparTudo = async () => {
    if (confirm('ATENÇÃO: Isso apagará TODO o seu histórico de compras. Deseja continuar?')) {
      await limparNotas.mutateAsync()
    }
  }

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-40 border-b bg-background/60 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between px-6 mx-auto">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="rounded-full w-10 h-10 p-0 hover:bg-white/20">
              <span className="text-xl">←</span>
            </Button>
            <h1 className="text-xl font-bold tracking-tight">Histórico</h1>
          </div>
          <div className="flex items-center gap-2">
            {notas && notas.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLimparTudo}
                className="text-red-500 hover:bg-red-500/10 h-10 w-10 p-0 rounded-full"
                title="Limpar Tudo"
              >
                🗑️
              </Button>
            )}
            <Link to="/scanner">
              <Button size="sm" className="rounded-full px-4 text-xs font-bold uppercase tracking-widest">
                📷 Escanear
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container max-w-2xl mx-auto px-6 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {isLoading ? (
          <Loading className="py-24" />
        ) : notas && notas.length > 0 ? (
          <div className="space-y-4">
            {notas.map((nota) => (
              <Card key={nota.id} className="border-none group overflow-hidden">
                <CardContent className="p-0">
                  <Link to={`/notas/${nota.id}`} className="block p-5 transition-all hover:bg-white/40 dark:hover:bg-black/20">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/50 dark:bg-black/20 text-2xl shadow-sm group-hover:scale-110 transition-transform">
                          🛒
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-foreground leading-tight">
                            {nota.estabelecimento || 'Novo Mercado'}
                          </h3>
                          <div className="flex flex-col gap-1 mt-1">
                            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                              📅 {nota.data_emissao ? formatDate(nota.data_emissao) : formatDate(nota.created_at)}
                            </p>
                            <span className="inline-flex w-fit items-center rounded-md bg-primary-500/10 px-2 py-0.5 text-[10px] font-bold text-primary-700 uppercase tracking-tighter shadow-sm">
                              {nota.produtos?.length || 0} PROUDTOS
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black text-primary-600">
                          {formatCurrency(nota.valor_total)}
                        </p>
                      </div>
                    </div>
                  </Link>
                  <div className="flex border-t border-white/10 dark:border-black/10">
                    <Link to={`/notas/${nota.id}`} className="flex-1">
                      <button className="w-full py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary-600 hover:bg-white/50 dark:hover:bg-black/20 transition-all">
                        Detalhes
                      </button>
                    </Link>
                    <button
                      onClick={() => handleDelete(nota.id)}
                      className="px-6 py-3 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all border-l border-white/10 dark:border-black/10"
                    >
                      🗑️
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="py-24 text-center">
            <div className="mb-8 text-7xl opacity-20">🧾</div>
            <h2 className="mb-2 text-2xl font-black">Histórico Vazio</h2>
            <p className="mb-10 text-muted-foreground max-w-[240px] mx-auto text-sm">
              Você ainda não escaneou nenhuma nota fiscal. Suas compras aparecerão aqui.
            </p>
            <Link to="/scanner">
              <Button size="lg" className="px-10 h-14 text-base font-bold shadow-2xl">
                Escanear Agora
              </Button>
            </Link>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-lg">
        <div className="glass shadow-2xl rounded-full px-6 py-3 flex items-center justify-between border border-white/30">
          <Link to="/" className="flex flex-col items-center gap-1 group">
            <div className="p-2 rounded-xl text-muted-foreground group-hover:scale-110 group-hover:text-primary-600 transition-all leading-none">
              🏠
            </div>
            <span className="text-[9px] uppercase font-bold tracking-tighter text-muted-foreground group-hover:text-primary-600">Início</span>
          </Link>
          <Link to="/notas" className="flex flex-col items-center gap-1 group">
            <div className="p-2 rounded-xl bg-primary-500/10 text-primary-600 group-hover:scale-110 transition-transform leading-none shadow-inner">
              📋
            </div>
            <span className="text-[9px] uppercase font-bold tracking-tighter text-primary-600">Histórico</span>
          </Link>
          <Link to="/scanner" className="flex flex-col items-center gap-1 group scale-110 -translate-y-4">
            <div className="p-4 rounded-full bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-xl shadow-primary-500/40 group-hover:scale-110 transition-all active:scale-95 leading-none">
              📷
            </div>
          </Link>
          <Link to="/dicionario" className="flex flex-col items-center gap-1 group">
            <div className="p-2 rounded-xl text-muted-foreground group-hover:scale-110 group-hover:text-primary-600 transition-all leading-none">
              📚
            </div>
            <span className="text-[9px] uppercase font-bold tracking-tighter text-muted-foreground group-hover:text-primary-600">Dicionário</span>
          </Link>
          <div className="flex flex-col items-center gap-1 opacity-40 cursor-not-allowed">
            <div className="p-2 rounded-xl text-muted-foreground leading-none">
              ⚙️
            </div>
            <span className="text-[9px] uppercase font-bold tracking-tighter text-muted-foreground">Ajustes</span>
          </div>
        </div>
      </nav>
    </div>
  )
}