'use client';
import { login } from './actions'
import { useState } from 'react';
import Link from 'next/link';

//Import ShadCn UI componentes
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Toaster } from 'sonner';

//Import de icons
import { Eye, EyeOff } from 'lucide-react';
import { IoLogInOutline } from "react-icons/io5";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false);
  const InputClassNames = "border-[var(--cor-texto)] focus-visible:ring-0";

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#eaf2e9]">
      <Toaster position="bottom-right" />
      <Card className="w-full max-w-md bg-[var(--cor-fundo2)] shadow-[3px_3px_3px_3px_var(--cor-texto)]/2">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-[var(--cor-texto)]">
            Iniciar Sessão
          </CardTitle>
          <CardDescription className="text-[var(--cor-texto)]/70">
            Entre na sua conta para continuar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={login} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-[var(--cor-texto)]">
                Email
              </Label>
              <Input
                type="email"
                id="email"
                //value={formData.email}
                //onChange={(e) => updateField('email', e.target.value)}
                className={InputClassNames}
                placeholder="seu.email@exemplo.com"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="password" className="text-sm font-medium text-[var(--cor-texto)]">
                Palavra-passe
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  //value={formData.password}
                  //onChange={(e) => updateField('password', e.target.value)}
                  className={InputClassNames}
                  placeholder="Digite sua palavra-passe"
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

            {/* Links para palavra-passe esquecida e registo */}
            <Link
              href="/forgot-password"
              className="text-sm text-[var(--cor-texto)] font-normal hover:text-[var(--cor-texto)]/90 text-center transition-colors duration-200"
            >
              Esqueceu a palavra-passe?
            </Link>

            <Button
              type="submit"
              disabled={loading}
              className="mt-3 w-full bg-[var(--cor-texto)] text-[#FFFDF6] hover:bg-[var(--cor-texto)]/90 cursor-pointer transition-all duration-300"
            >
              <IoLogInOutline />
              {loading ? 'Entrando...' : 'Iniciar Sessão'}
            </Button>

            <div className="text-sm font-normal text-[var(--cor-texto)]/70 text-center">
              Não tem conta?{' '}
              <Link
                href="/signup"
                className="text-[var(--cor-texto)] hover:text-[var(--cor-texto)]/90 hover:underline font-semibold transition-all duration-300"
              >
                Registar-se
              </Link>
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  )
}