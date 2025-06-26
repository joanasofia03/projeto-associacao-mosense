'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signUpAction } from './actions';

//Import ShadCn UI componentes
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Toaster } from 'sonner';

//Import de icons
import { Eye, EyeOff, UserPlus } from 'lucide-react';

export default function LoginPage() {
  const [loading, setLoading] = useState<boolean>(false)
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false)
  const [message, setMessage] = useState<string>('')

  const InputClassNames = "border-[var(--cor-texto)] focus-visible:ring-0";

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword((prev) => !prev)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setMessage('')

    const result = await signUpAction(formData)

    if (result.error) {
      setMessage(`Erro: ${result.error}`)
      toast.error(result.error)
    } else {
      setMessage(result.sucess || 'Conta criada com sucesso!')
      toast.success('Conta criada! Por favor, consulte o seu email.')
    }

    setLoading(false)
  }


  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#eaf2e9]">
      <Toaster position="bottom-right" />
      <Card className="w-full max-w-md bg-[var(--cor-fundo2)] shadow-[3px_3px_3px_3px_var(--cor-texto)]/2">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-[var(--cor-texto)]">
            Criar uma nova conta
          </CardTitle>
          <CardDescription className="text-[var(--cor-texto)]/70">
            Preencha os dados para criar a sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-sm font-medium text-[var(--cor-texto)]">
                Nome
              </Label>
              <Input
                type="text"
                id="nome"
                name="nome"
                className={InputClassNames}
                placeholder="Seu nome completo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-[var(--cor-texto)]">
                Email
              </Label>
              <Input
                type="email"
                id="email"
                name="email"
                className={InputClassNames}
                placeholder="seu.email@exemplo.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telemovel" className="text-sm font-medium text-[var(--cor-texto)]">
                Telemóvel (opcional)
              </Label>
              <Input
                type="tel"
                id="telemovel"
                name="telemovel"
                className={InputClassNames}
                placeholder="987654321"
                pattern="[0-9]*"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-[var(--cor-texto)]">
                Palavra-passe
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  className={`${InputClassNames} pr-10`}
                  placeholder="Mínimo 6 caracteres"
                  required
                />
                <Button
                  type="button"
                  onClick={togglePasswordVisibility}
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                >
                  {showPassword ? (
                    <Eye className="h-4 w-4 text-[var(--cor-texto)]" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-[var(--cor-texto)]" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-[var(--cor-texto)]">
                Confirmar palavra-passe
              </Label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  className={`${InputClassNames} pr-10`}
                  placeholder="Repita a palavra-passe"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={toggleConfirmPasswordVisibility}
                >
                  {showConfirmPassword ? (
                    <Eye className="h-4 w-4 text-[var(--cor-texto)]" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-[var(--cor-texto)]" />
                  )}
                </Button>
              </div>
            </div>

            <div className="text-sm text-[var(--cor-texto)]">
              Ao criar uma conta está automaticamente a concordar com os{' '}
              <Link href="/termsofuseprivacypolicy" className="text-[var(--cor-texto)] hover:text-[var(--cor-texto)]/90 underline font-medium transition-all duration-300">
                Termos de Utilização e Política de Privacidade
              </Link>.
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--cor-texto)] text-[#FFFDF6] hover:bg-[var(--cor-texto)]/90 cursor-pointer transition-all duration-300"
            >
              {loading ? 'A registar....' : 'Registar'}
              <UserPlus className="h-4 w-4" />
            </Button>

            {/* Link para login */}
            <div className="text-sm text-[var(--cor-texto)]/90 text-center">
              Já tem conta?{' '}
              <Link
                href="/login"
                className="text-[var(--cor-texto)] hover:text-[var(--cor-texto)]/90 hover:underline font-semibold transition-all duration-300"
              >
                Iniciar sessão
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}