import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useNotas } from '../hooks/useNotas'
import { Button } from '../components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Loading } from '../components/ui/Loading'
import { formatCurrency, formatDate } from '../utils/normalize'

export function Home() {
  const { user, signOut } = useAuth()
  const { data: notas, isLoading } = useNotas()

  const totalGasto = notas?.reduce((acc, nota) => acc + nota.valor_total, 0) || 0
  const totalNotas = notas?.length || 0

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/60 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between px-6 mx-auto">
          <div className="flex items-center gap-2">
            <span className="text-2xl filter drop-shadow">🛒</span>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary-700 to-primary-500 bg-clip-text text-transparent">
              Smart Mercado
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-sm font-medium text-muted-foreground">
              {user?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={signOut} className="hover:bg-red-500/10 hover:text-red-600">
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-4xl mx-auto px-6 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-1">Olá, Bem-vindo!</h2>
          <p className="text-muted-foreground">Aqui está o resumo das suas compras.</p>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 grid-cols-2 md:grid-cols-3">
          <Card className="border-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total de Notas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                {totalNotas}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Gasto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-br from-primary-600 to-primary-400 bg-clip-text text-transparent">
                {formatCurrency(totalGasto)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none col-span-2 md:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Média por Nota
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                {totalNotas > 0 ? formatCurrency(totalGasto / totalNotas) : formatCurrency(0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link to="/scanner" className="block">
            <Button className="w-full h-16 text-lg gap-3" size="lg">
              <span className="text-2xl">📷</span> Escanear Nota
            </Button>
          </Link>
          <Link to="/notas" className="block">
            <Button variant="outline" className="w-full h-16 text-lg gap-3 border-none shadow-lg shadow-black/5" size="lg">
              <span className="text-2xl">📋</span> Histórico de Notas
            </Button>
          </Link>
        </div>

        {/* Recent Notes */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Notas Recentes</h3>
            <Link to="/notas" className="text-sm font-medium text-primary-600 hover:underline">
              Ver todas
            </Link>
          </div>
          
          <Card className="border-none">
            <CardContent className="pt-6">
              {isLoading ? (
                <Loading />
              ) : notas && notas.length > 0 ? (
                <div className="space-y-4">
                  {notas.slice(0, 5).map((nota) => (
                    <Link
                      key={nota.id}
                      to={`/notas/${nota.id}`}
                      className="group flex items-center justify-between rounded-2xl border border-transparent p-4 transition-all duration-300 hover:bg-white/50 dark:hover:bg-black/20 hover:border-white/20 hover:shadow-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 dark:bg-primary-900/40 text-primary-600 text-xl group-hover:scale-110 transition-transform">
                          🏪
                        </div>
                        <div>
                          <p className="font-bold text-foreground">
                            {nota.estabelecimento || 'Novo Mercado'}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <span>📅</span> {nota.data_emissao ? formatDate(nota.data_emissao) : formatDate(nota.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-primary-600">
                          {formatCurrency(nota.valor_total)}
                        </p>
                        <p className="text-xs font-semibold uppercase tracking-tighter text-muted-foreground">
                          {nota.produtos?.length || 0} produtos
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="mb-6 text-6xl opacity-20">🧾</div>
                  <h4 className="text-xl font-bold mb-2">Tudo limpo por aqui</h4>
                  <p className="text-muted-foreground max-w-xs mx-auto">
                    Você ainda não tem notas cadastradas. Vamos começar?
                  </p>
                  <Link to="/scanner">
                    <Button variant="primary" className="mt-8 px-10">
                      Escanear Primeira Nota
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md">
        <div className="glass shadow-2xl rounded-full px-8 py-3 flex items-center justify-between border border-white/30">
          <Link to="/" className="flex flex-col items-center gap-1 group">
            <div className="p-2 rounded-xl bg-primary-500/10 text-primary-600 group-hover:scale-110 transition-transform leading-none shadow-inner">
              🏠
            </div>
            <span className="text-[10px] uppercase font-bold tracking-tighter text-primary-600">Início</span>
          </Link>
          <Link to="/scanner" className="flex flex-col items-center gap-1 group scale-125 -translate-y-4">
            <div className="p-4 rounded-full bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-xl shadow-primary-500/40 group-hover:scale-110 transition-all active:scale-95 leading-none">
              📷
            </div>
          </Link>
          <Link to="/notas" className="flex flex-col items-center gap-1 group">
            <div className="p-2 rounded-xl bg-transparent text-muted-foreground group-hover:scale-110 group-hover:text-primary-600 transition-all leading-none">
              📋
            </div>
            <span className="text-[10px] uppercase font-bold tracking-tighter text-muted-foreground group-hover:text-primary-600">Notas</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}