import { useParams, useNavigate, Link } from 'react-router-dom'
import { useNota, useDeletarProduto } from '../hooks/useNotas'
import { Button } from '../components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Loading } from '../components/ui/Loading'
import { formatCurrency, formatDate, formatCNPJ } from '../utils/normalize'

export function NotaDetalhe() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: nota, isLoading } = useNota(id || '')
  const deletarProduto = useDeletarProduto()

  const handleDeleteProduto = async (produtoId: string) => {
    if (confirm('Tem certeza que deseja deletar este produto?')) {
      await deletarProduto.mutateAsync({ id: produtoId, notaId: id || '' })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Loading className="py-24" />
      </div>
    )
  }

  if (!nota) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container px-4 py-12 text-center">
          <div className="mb-4 text-6xl">❌</div>
          <h2 className="mb-2 text-xl font-semibold">Nota não encontrada</h2>
          <Link to="/notas">
            <Button>Voltar para Notas</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              ← Voltar
            </Button>
            <h1 className="text-xl font-bold">Detalhes da Nota</h1>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6">
        {/* Nota Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🧾 Informações da Nota
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Estabelecimento</p>
              <p className="font-medium">
                {nota.estabelecimento || 'Não identificado'}
              </p>
            </div>
            {nota.cnpj && (
              <div>
                <p className="text-sm text-muted-foreground">CNPJ</p>
                <p className="font-medium">{formatCNPJ(nota.cnpj)}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Data de Emissão</p>
              <p className="font-medium">
                {nota.data_emissao
                  ? formatDate(nota.data_emissao)
                  : formatDate(nota.created_at)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Código de Barras</p>
              <p className="break-all font-mono text-sm">{nota.codigo_barras}</p>
            </div>
            <div className="flex items-center justify-between border-t pt-3">
              <p className="text-lg font-semibold">Valor Total</p>
              <p className="text-2xl font-bold text-primary-600">
                {formatCurrency(nota.valor_total)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Produtos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>🛒 Produtos ({nota.produtos?.length || 0})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nota.produtos && nota.produtos.length > 0 ? (
              <div className="space-y-4">
                {nota.produtos.map((produto) => (
                  <div
                    key={produto.id}
                    className="rounded-lg border p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">
                          {produto.descricao_amigavel || produto.descricao_original}
                        </h4>
                        {produto.descricao_amigavel &&
                          produto.descricao_amigavel !== produto.descricao_original && (
                            <p className="text-sm text-muted-foreground">
                              Original: {produto.descricao_original}
                            </p>
                          )}
                        <div className="mt-2 flex flex-wrap gap-2">
                          {produto.categoria && (
                            <Badge variant="secondary">{produto.categoria}</Badge>
                          )}
                          {produto.subcategoria && (
                            <Badge variant="outline">{produto.subcategoria}</Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteProduto(produto.id)}
                      >
                        🗑️
                      </Button>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Quantidade</p>
                        <p className="font-medium">
                          {produto.quantidade} {produto.unidade || 'UN'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Valor Unitário</p>
                        <p className="font-medium">
                          {formatCurrency(produto.valor_unitario)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Valor Total</p>
                        <p className="font-bold text-primary-600">
                          {formatCurrency(produto.valor_total)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <div className="mb-4 text-4xl">📦</div>
                <p className="text-muted-foreground">
                  Nenhum produto cadastrado nesta nota
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}