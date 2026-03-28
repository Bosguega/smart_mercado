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

  const startScanning = useCallback(async () => {
    if (!videoRef.current) return

    try {
      setIsScanning(true)
      setError(null)

      const reader = new BrowserMultiFormatReader()
      readerRef.current = reader

      // Solicita permissão da câmera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Câmera traseira preferencial
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      setHasPermission(true)

      // Usa o stream diretamente
      videoRef.current.srcObject = stream

      // Inicia a decodificação contínua
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

  if (hasPermission === false) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="mb-4 text-6xl">📷</div>
        <h3 className="mb-2 text-lg font-semibold">Permissão da câmera necessária</h3>
        <p className="mb-4 text-muted-foreground">
          Para escanear códigos de barras e QR Codes, precisamos acessar sua câmera.
        </p>
        <div className="flex gap-2">
          <Button onClick={startScanning}>Tentar novamente</Button>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          )}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="mb-4 text-6xl">⚠️</div>
        <h3 className="mb-2 text-lg font-semibold">Erro no scanner</h3>
        <p className="mb-4 text-muted-foreground">{error}</p>
        <div className="flex gap-2">
          <Button onClick={startScanning}>Tentar novamente</Button>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full max-w-lg mx-auto">
      {/* Container do vídeo */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-black">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          playsInline
          muted
          autoPlay
        />

        {/* Overlay de scan */}
        {isScanning && (
          <div className="scanner-overlay">
            <div className="scanner-line" />
          </div>
        )}

        {/* Loading state */}
        {!isScanning && hasPermission === null && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loading size="lg" />
          </div>
        )}
      </div>

      {/* Controles */}
      <div className="mt-4 flex justify-center gap-2">
        {!isScanning ? (
          <Button onClick={startScanning} className="flex-1">
            📷 Iniciar Scanner
          </Button>
        ) : (
          <Button variant="outline" onClick={stopScanning} className="flex-1">
            ⏹️ Parar Scanner
          </Button>
        )}
        {onClose && (
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
        )}
      </div>

      {/* Instruções */}
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Posicione o código de barras ou QR Code da nota fiscal dentro da área de scan
      </p>
    </div>
  )
}