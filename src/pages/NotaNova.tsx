import { useEffect, useState, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useCriarNota, useAdicionarProdutos } from '../hooks/useNotas'
import { LoadingPage } from '../components/ui/Loading'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { parseNFCe, categorizeProduct } from '../services/receiptParser'

export function NotaNova() {
  const location = useLocation()
  const navigate = useNavigate()
  const { codigo, parsed } = location.state || {}
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'scraping' | 'categorizing' | 'saving'>('scraping')
  
  const criarNota = useCriarNota()
  const adicionarProdutos = useAdicionarProdutos()
  const hasProcessed = useRef(false)

  useEffect(() => {
    if (!codigo) {
      navigate('/scanner')
      return
    }

    if (hasProcessed.current) return
    hasProcessed.current = true

    const processarNota = async () => {
      try {
        setStep('scraping')
        // Carrega dados reais da SEFAZ
        const scraped = await parseNFCe(codigo)

        setStep('categorizing')
        // Categoriza produtos usando IA em paralelo
        const itemsWithCategorization = await Promise.all(
          scraped.items.map(async (item) => {
            const categorization = await categorizeProduct(item.name)
            return {
              ...item,
              ...categorization
            }
          })
        )

        setStep('saving')
        // Salva a Nota Fiscal
        const novaNota = await criarNota.mutateAsync({
          estabelecimento: scraped.establishment,
          cnpj: parsed?.cnpj || '', // CNPJ pode não estar no scrap, tentar vir do scan anterior
          valor_total: scraped.total,
          data_emissao: scraped.date,
          codigo_barras: scraped.accessKey || parsed?.codigoNumerico || codigo,
        })

        // Salva os Produtos
        await adicionarProdutos.mutateAsync({
          notaId: novaNota.id,
          produtos: itemsWithCategorization.map(item => ({
            descricao_original: item.name,
            descricao_amigavel: item.nome_amigavel,
            quantidade: item.qty,
            valor_unitario: item.unitPrice,
            valor_total: item.total,
            categoria: item.categoria,
            subcategoria: item.subcategoria,
            unidade: item.unit
          }))
        })

        navigate(`/notas/${novaNota.id}`, { replace: true })
      } catch (err) {
        console.error('Erro ao processar nota:', err)
        setError(err instanceof Error ? err.message : 'Não foi possível processar os dados desta nota fiscal.')
      }
    }

    processarNota()
  }, [codigo, navigate, parsed, criarNota, adicionarProdutos])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Card className="w-full max-w-md glass-card border-red-500/20">
          <CardContent className="pt-6 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold mb-2">Erro no Processamento</h2>
            <p className="text-sm text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => navigate('/scanner')} className="w-full">
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      <div className="text-center space-y-4">
        <LoadingPage />
        <div className="animate-pulse space-y-2">
          <h2 className="text-xl font-bold text-primary-600">
            {step === 'scraping' && 'Lendo dados da SEFAZ...'}
            {step === 'categorizing' && 'Categorizando produtos com IA...'}
            {step === 'saving' && 'Guardando no seu histórico...'}
          </h2>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
            {step === 'scraping' && 'Buscando nota fiscal'}
            {step === 'categorizing' && 'Organizando categorias'}
            {step === 'saving' && 'Finalizando registro'}
          </p>
        </div>
        
        <div className="max-w-xs mx-auto mt-8 p-6 glass-card rounded-3xl text-left border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl">
            {step === 'scraping' && '🔍'}
            {step === 'categorizing' && '🧠'}
            {step === 'saving' && '💾'}
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-primary-500/10 flex items-center justify-center text-primary-600 shadow-inner">✨</div>
            <div className="space-y-1">
              <div className={`h-2 w-24 rounded-full transition-all duration-500 ${step === 'scraping' ? 'bg-primary-500' : 'bg-primary-500/20'}`}></div>
              <div className={`h-2 w-16 rounded-full transition-all duration-500 ${step === 'categorizing' ? 'bg-primary-500' : 'bg-primary-500/20'}`}></div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-3 w-full bg-black/10 dark:bg-white/10 rounded-full"></div>
            <div className="h-3 w-5/6 bg-black/10 dark:bg-white/10 rounded-full"></div>
            <div className={`h-3 w-2/3 rounded-full transition-colors ${step === 'saving' ? 'bg-primary-500/30' : 'bg-black/10 dark:bg-white/5'}`}></div>
          </div>
        </div>
      </div>
    </div>
  )
}
