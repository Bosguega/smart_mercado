import { cn } from '../../utils/cn'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Loading({ size = 'md', className }: LoadingProps) {
  const sizes = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-20 w-20',
  }

  return (
    <div className={cn('flex flex-col items-center justify-center gap-4', className)}>
      <div className={cn('relative', sizes[size])}>
        <div className="absolute inset-0 rounded-full border-4 border-primary-500/20"></div>
        <div className="absolute inset-0 rounded-full border-4 border-primary-500 border-t-transparent animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center text-xl animate-pulse">
          🛒
        </div>
      </div>
    </div>
  )
}

export function LoadingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background/50 backdrop-blur-xl">
      <div className="relative">
        <div className="absolute -inset-4 rounded-full bg-primary-500/20 blur-2xl animate-pulse"></div>
        <Loading size="lg" />
      </div>
      <p className="text-lg font-bold tracking-tight text-primary-700 animate-pulse">
        Carregando Smart Mercado...
      </p>
    </div>
  )
}

export function LoadingOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/40 backdrop-blur-md">
      <div className="glass-card p-8 rounded-3xl flex flex-col items-center gap-4 scale-110">
        <Loading size="md" />
        <p className="text-sm font-bold uppercase tracking-widest text-primary-600">
          Processando
        </p>
      </div>
    </div>
  )
}