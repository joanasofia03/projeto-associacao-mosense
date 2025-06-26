'use client';

import { useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import Link from 'next/link'

//Import Shadcn UI componentes
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Toast from '../../components/toast';
import { Toaster } from '@/components/ui/sonner';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

//Import de icons
import { MdOutlineMarkEmailUnread } from "react-icons/md";

export default function EsqueciPassword() {
  const [email, setEmail] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [loading, setLoading] = useState<boolean>(false)

  const InputClassNames = "border-[var(--cor-texto)] focus-visible:ring-0";

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setToastVisible(false);

    // Verifica se o utilizador existe
    const { data: exists, error: checkError } = await supabase.rpc('check_user_exists', {
      email_to_check: email,
    });

    if (checkError || !exists) {
      setToastMessage('Este e-mail não está associado a nenhuma conta.');
      setToastType('error');
      setToastVisible(true);
      return;
    }

    // Envia o e-mail de recuperação
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:3000/reset-password',
    });

    if (error) {
      setToastMessage('Erro ao enviar email de recuperação.');
      setToastType('error');
    } else {
      setToastMessage('Verifica o teu email para redefinir a palavra-passe.');
      setToastType('success');
      setEmail('');
    }

    setToastVisible(true);
  };

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
          <form onSubmit={handleReset} className="space-y-4">
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

          {/* Toast */}
          <Toast
            message={toastMessage}
            visible={toastVisible}
            onClose={() => setToastVisible(false)}
            type={toastType}
          />
        </CardContent>
      </Card>
    </div>
  );
}
