import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScannerView } from '../components/scanner/ScannerView'
import { Button } from '../components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { parseNotaCode, isValidNFCeCode } from '../utils/normalize'

export function Scanner() {
  const navigate = useNavigate()
  const [scannedCode, setScannedCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleScan = (result: string) => {
    setScannedCode(result)
    setError(null)

    if (isValidNFCeCode(result)) {
      const parsed = parseNotaCode(result)
      navigate('/notas/nova', { state: { codigo: result, parsed } })
    } else {
      setError('Código não reconhecido como NFC-e válida')
    }
  }

  const handleError = (err: Error) => {
    console.error('Erro no scanner:', err)
    setError('Erro ao acessar a câmera')
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b bg-background/60 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between px-6 mx-auto">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="rounded-full w-10 h-10 p-0 hover:bg-white/20">
              <span className="text-xl">←</span>
            </Button>
            <h1 className="text-xl font-bold tracking-tight">Escanear Nota</h1>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500/10 text-primary-600">
            📸
          </div>
        </div>
      </header>

      <main className="container max-w-2xl mx-auto px-6 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="space-y-6">
          <Card className="overflow-hidden border-none bg-black/5 dark:bg-white/5 shadow-2xl">
            <CardContent className="p-2 aspect-square relative">
              <div className="absolute inset-4 rounded-3xl border-2 border-dashed border-primary-500/30 pointer-events-none z-10"></div>
              <ScannerView
                onScan={handleScan}
                onError={handleError}
                onClose={() => navigate('/')}
              />
            </CardContent>
          </Card>

          <Card className="border-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold">Não consegue escanear?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Se o QR Code estiver muito pequeno ou danificado, cole o link da nota fiscal abaixo.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://www.sefaz.rs.gov.br/..."
                  className="flex-1 rounded-xl bg-black/5 dark:bg-white/5 border border-white/20 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-mono"
                  onChange={(e) => setScannedCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleScan(scannedCode || '')}
                />
                <Button 
                  size="sm" 
                  className="px-6 font-bold"
                  onClick={() => handleScan(scannedCode || '')}
                >
                  Confirmar
                </Button>
              </div>
            </CardContent>
          </Card>

          {error && (
            <div className="glass-card border-red-500/30 bg-red-500/5 p-4 text-center text-red-600 font-bold animate-shake">
              ⚠️ {error}
            </div>
          )}

          {scannedCode && (
            <Card className="border-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Código Detectado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl bg-black/10 dark:bg-white/10 p-3 font-mono text-[10px] break-all opacity-70">
                  {scannedCode}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            <h3 className="text-lg font-bold px-2">Dificuldades?</h3>
            <Card className="border-none">
              <CardContent className="p-6">
                <div className="grid gap-6">
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 text-xl shadow-sm">
                      💡
                    </div>
                    <div>
                      <p className="font-bold text-sm">Iluminação</p>
                      <p className="text-xs text-muted-foreground">Garanta que o QR Code esteja bem iluminado e sem reflexos.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 text-xl shadow-sm">
                      🎯
                    </div>
                    <div>
                      <p className="font-bold text-sm">Foco e Enquadramento</p>
                      <p className="text-xs text-muted-foreground">Mantenha a câmera estável e centralize o código no quadrado.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 text-xl shadow-sm">
                      🔗
                    </div>
                    <div>
                      <p className="font-bold text-sm">Entrada Manual</p>
                      <p className="text-xs text-muted-foreground">Cole o link da nota diretamente se o QR Code estiver ilegível.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}