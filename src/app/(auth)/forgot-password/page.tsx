'use client';

import { useState } from 'react';
import Link from 'next/link'
import { forgotPasswordAction } from './actions'
import { useRouter } from 'next/navigation'

//Import Shadcn UI componentes
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Toaster } from 'sonner';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

//Import de icons
import { MdOutlineMarkEmailUnread } from "react-icons/md";

export default function EsqueciPassword() {
  const [loading, setLoading] = useState<boolean>(false)
  const [message, setMessage] = useState<string>('')
  const router = useRouter()

  const InputClassNames = "border-[var(--cor-texto)] focus-visible:ring-0";

  async function handleForgotPassword(formData: FormData) {
    setLoading(true)
    setMessage('')

    const result = await forgotPasswordAction(formData)

    if (result.errorVerify) {
      setMessage(`Erro: ${result.errorVerify}`)
      toast.error(`Erro ao verificar o seu email na nossa base de dados - ${result.errorVerify}`)
    } else if (result.error) {
      setMessage(`Erro: ${result.error}`)
      toast.error(`Erro ao enviar o email de verificação - ${result.error}`)
    } else {
      toast.success('Verifique o seu email para redefinir a palavra-passe.')
      setTimeout(() => {
        router.push('/login')
      }, 2000) //2000ms
      return;
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#eaf2e9]">
      <Toaster position="bottom-right" />
      <Card className="w-full max-w-md bg-[var(--cor-fundo2)] shadow-[3px_3px_3px_3px_var(--cor-texto)]/2">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-[var(--cor-texto)]">
            Recuperar palavra-passe
          </CardTitle>
          <CardDescription className="text-[var(--cor-texto)]/70">
            Preencha o seu email para receber um link de recuperação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleForgotPassword} className="space-y-4">
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

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--cor-texto)] text-[#FFFDF6] hover:bg-[var(--cor-texto)]/90 cursor-pointer transition-all duration-300"
            >
              {loading ? 'A enviar...' : 'Enviar link de recuperação'}
              <MdOutlineMarkEmailUnread className="h-4 w-4" />
            </Button>
            <div className="text-sm font-normal text-[var(--cor-texto)]/70 text-center">
              Pretende voltar atrás?{' '}
              <Link
                href="/login"
                className="text-[var(--cor-texto)] hover:text-[var(--cor-texto)]/90 hover:underline font-semibold transition-all duration-300"
              >
                Voltar
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
