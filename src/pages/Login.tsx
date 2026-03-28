import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card'

export function Login() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setIsLoading(true)

    try {
      if (!isLogin && password !== confirmPassword) {
        setError('As senhas não coincidem')
        setIsLoading(false)
        return
      }

      if (password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres')
        setIsLoading(false)
        return
      }

      const { error } = isLogin
        ? await signIn(email, password)
        : await signUp(email, password)

      if (error) {
        setError(error.message)
      } else {
        if (isLogin) {
          navigate('/')
        } else {
          setSuccessMessage('Conta criada! Verifique seu email para confirmar.')
          setIsLogin(true)
        }
      }
    } catch {
      setError('Ocorreu um erro inesperado')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6 animate-in fade-in duration-500">
      <Card className="w-full max-w-md border-none ring-1 ring-white/20">
        <CardHeader className="text-center pt-10 pb-6">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary-500 to-primary-700 text-4xl shadow-2xl shadow-primary-500/20 animate-bounce-slow">
            🛒
          </div>
          <CardTitle className="text-3xl font-black tracking-tight bg-gradient-to-r from-primary-700 to-primary-500 bg-clip-text text-transparent">
            Smart Mercado
          </CardTitle>
          <CardDescription className="text-base font-medium mt-2">
            {isLogin ? 'Bem-vindo de volta!' : 'Comece a economizar hoje'}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5 px-8">
            {error && (
              <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-600 font-medium animate-shake">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="rounded-2xl bg-primary-500/10 border border-primary-500/20 p-4 text-sm text-primary-700 font-medium">
                {successMessage}
              </div>
            )}

            <div className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/50 dark:bg-black/20"
              />

              <Input
                label="Senha"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white/50 dark:bg-black/20"
              />

              {!isLogin && (
                <Input
                  label="Confirmar Senha"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-white/50 dark:bg-black/20"
                />
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-6 p-8 pt-6">
            <Button type="submit" className="w-full h-12 text-base font-bold" isLoading={isLoading}>
              {isLogin ? 'Entrar Agora' : 'Criar Minha Conta'}
            </Button>

            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin)
                setError(null)
                setSuccessMessage(null)
              }}
              className="group text-sm font-semibold text-muted-foreground transition-colors hover:text-primary-600"
            >
              {isLogin ? (
                <>Não tem conta? <span className="text-primary-600 group-hover:underline">Criar uma</span></>
              ) : (
                <>Já tem conta? <span className="text-primary-600 group-hover:underline">Fazer login</span></>
              )}
            </button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}