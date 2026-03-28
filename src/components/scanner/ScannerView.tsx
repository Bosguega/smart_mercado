import { useRef, useEffect, useState, useCallback } from 'react'
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library'
import { Button } from '../ui/Button'
import { Loading } from '../ui/Loading'

interface ScannerViewProps {
  onScan: (result: string) => void
  onError?: (error: Error) => void
  onClose?: () => void
}

export function ScannerView({ onScan, onError, onClose }: ScannerViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const [isProcessingImage, setIsProcessingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCapture = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsProcessingImage(true)
    setError(null)

    try {
      const reader = new BrowserMultiFormatReader()
      const imageUrl = URL.createObjectURL(file)
      
      // Criar um elemento de imagem temporário para decodificação
      const img = new Image()
      img.src = imageUrl
      
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
      })

      try {
        const result = await reader.decodeFromImageElement(img)
        onScan(result.getText())
      } catch (err) {
        console.error('Não foi possível encontrar QR Code na imagem:', err)
        setError('QR Code não detectado na foto. Tente aproximar mais ou melhorar o foco.')
      } finally {
        URL.revokeObjectURL(imageUrl)
      }
    } catch (err) {
      console.error('Erro ao processar imagem:', err)
      setError('Erro ao processar a imagem da câmera.')
    } finally {
      setIsProcessingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [onScan])

  const triggerCapture = () => {
    fileInputRef.current?.click()
  }

  const startScanning = useCallback(async () => {
    if (!videoRef.current) return

    try {
      setIsScanning(true)
      setError(null)

      const reader = new BrowserMultiFormatReader()
      readerRef.current = reader

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      setHasPermission(true)
      videoRef.current.srcObject = stream

      reader.decodeFromVideoDevice(null, videoRef.current, (result, err) => {
        if (result) {
          onScan(result.getText())
        }
        if (err && !(err instanceof NotFoundException)) {
          console.error('Erro ao decodificar:', err)
        }
      })
    } catch (err) {
      console.error('Erro ao iniciar scanner:', err)
      setHasPermission(false)
      setError('Não foi possível acessar a câmera. Verifique as permissões.')
      onError?.(err as Error)
    }
  }, [onScan, onError])

  const stopScanning = useCallback(() => {
    if (readerRef.current) {
      readerRef.current.reset()
      readerRef.current = null
    }

    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }

    setIsScanning(false)
  }, [])

  useEffect(() => {
    return () => {
      stopScanning()
    }
  }, [stopScanning])

  if (hasPermission === false && !isProcessingImage) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center glass-card">
        <div className="mb-4 text-6xl">📷</div>
        <h3 className="mb-2 text-lg font-bold">Permissão Necessária</h3>
        <p className="mb-6 text-muted-foreground text-sm">
          Acesse sua câmera para escanear a nota diretamente.
        </p>
        <div className="flex flex-col gap-3 w-full">
          <Button onClick={startScanning} className="h-12">Tentar Novamente</Button>
          <div className="flex items-center gap-2 py-2">
            <div className="h-[1px] flex-1 bg-border" />
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Ou use a galeria</span>
            <div className="h-[1px] flex-1 bg-border" />
          </div>
          <Button variant="outline" onClick={triggerCapture} className="h-12 border-none bg-white/40 shadow-sm">
            🖼️ Escolher Foto da Galeria
          </Button>
          {onClose && (
            <Button variant="ghost" onClick={onClose} className="mt-2">
              Cancelar
            </Button>
          )}
        </div>
        <input 
          ref={fileInputRef}
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={handleCapture}
        />
      </div>
    )
  }

  return (
    <div className="relative w-full max-w-lg mx-auto">
      <input 
        ref={fileInputRef}
        type="file" 
        accept="image/*" 
        capture="environment"
        className="hidden" 
        onChange={handleCapture}
      />

      {/* Container do vídeo */}
      <div className="relative aspect-square overflow-hidden rounded-3xl bg-black/10 backdrop-blur-sm border-4 border-white/20 shadow-2xl">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          playsInline
          muted
          autoPlay
        />

        {/* Overlay de scan */}
        {isScanning && !error && (
          <div className="scanner-overlay">
            <div className="scanner-line shadow-[0_0_15px_#22c55e]" />
          </div>
        )}

        {/* Loading/Processing states */}
        {(isProcessingImage || (!isScanning && hasPermission === null)) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md z-20">
            <Loading size="lg" />
            {isProcessingImage && (
              <p className="mt-4 text-xs font-bold uppercase tracking-widest text-white animate-pulse">
                Processando Imagem...
              </p>
            )}
          </div>
        )}

        {/* Error Overlay */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/20 backdrop-blur-sm p-6 text-center z-10">
            <div className="mb-2 text-4xl">🔎</div>
            <p className="text-sm font-bold text-red-600 bg-white/90 px-3 py-2 rounded-xl shadow-lg">
              {error}
            </p>
            <Button size="sm" onClick={() => setError(null)} className="mt-4 bg-white text-destructive hover:bg-white/90">
              Continuar tentando
            </Button>
          </div>
        )}
      </div>

      {/* Controles */}
      <div className="mt-6 flex flex-col gap-4">
        <div className="flex gap-3">
          {!isScanning ? (
            <Button onClick={startScanning} className="flex-1 h-14 text-base font-bold">
              📷 Iniciar Ao Vivo
            </Button>
          ) : (
            <Button variant="outline" onClick={stopScanning} className="flex-1 h-14 text-base font-bold bg-white/40 border-none shadow-md">
              ⏹️ Parar Câmera
            </Button>
          )}
          <Button 
            onClick={triggerCapture} 
            className="flex-1 h-14 text-base font-bold bg-gradient-to-r from-blue-600 to-blue-500 shadow-blue-500/30"
          >
            📸 Tirar Foto
          </Button>
        </div>
        
        {onClose && (
          <Button variant="ghost" onClick={onClose} className="h-10 text-muted-foreground">
            Cancelar e Voltar
          </Button>
        )}
      </div>

      {/* Instruções */}
      <div className="mt-6 glass-card p-4 text-center">
        <p className="text-sm font-medium">
          {isScanning ? (
            "Aponte para o QR Code. Se for muito pequeno, use o botão 'Tirar Foto' para usar o zoom do celular."
          ) : (
            "Use o scanner ao vivo ou tire uma foto de perto para processar o QR Code pequeno."
          )}
        </p>
      </div>
    </div>
  )
}