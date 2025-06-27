'use client';

import { resetPasswordAction } from './actions'
import { useState } from 'react';
import { useRouter } from 'next/navigation'

//Import Shadcn UI Componentes
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Toaster } from 'sonner';

//Import de icons
import { Eye, EyeOff, Key } from 'lucide-react';

function ResetPassword() {
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [message, setMessage] = useState<string>('')
  const router = useRouter()

  const InputClassNames = "border-[var(--cor-texto)] focus-visible:ring-0";

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword((prev) => !prev)

  async function handleResetPassword(formData: FormData) {
    setLoading(true)
    setMessage('')

    const result = await resetPasswordAction(formData)

    if (result.errorCamposVazios) {
      setMessage(`Erro: ${result.errorCamposVazios}`)
      toast.error(result.errorCamposVazios)
    } else if (result.errorPalavraPasseDiferente) {
      setMessage(`Erro: ${result.errorPalavraPasseDiferente}`)
      toast.error(result.errorPalavraPasseDiferente)
    } else if (result.errorTamanhoInferior) {
      setMessage(`Erro: ${result.errorTamanhoInferior}`)
      toast.error(result.errorTamanhoInferior)
    } else if (result.error) {
      setMessage(`Erro: ${result.error}`)
      toast.error(result.error)
    } else {
      toast.success(result.sucess)
      setTimeout(() => {
        router.push('/login')
      }, 1500) //1500ms
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
            Definir nova palavra-passe
          </CardTitle>
          <CardDescription className="text-[var(--cor-texto)]/70">
            Crie uma nova palavra-passe para a sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-[var(--cor-texto)]">
                Nova palavra-passe
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  className={InputClassNames}
                  placeholder="Mínimo 6 caracteres"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={togglePasswordVisibility}
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
                Confirmar nova palavra-passe
              </Label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  className={InputClassNames}
                  placeholder="Repita a nova palavra-passe"
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
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--cor-texto)] text-[#FFFDF6] hover:bg-[var(--cor-texto)]/90 cursor-pointer transition-all duration-300"
            >
              {loading ? 'A atualizar...' : 'Atualizar palavra-passe'}
              <Key className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default ResetPassword;