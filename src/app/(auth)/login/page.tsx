'use client';

import { useState, useCallback } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Toaster } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { IoLogInOutline } from "react-icons/io5";

interface FormData {
  email: string;
  password: string;
}

// Estado inicial do formulário
const INITIAL_FORM_STATE: FormData = {
  email: '',
  password: '',
};

// Mensagens de erro centralizadas
const ERROR_MESSAGES = {
  CAMPOS_OBRIGATORIOS: 'Por favor, preencha todos os campos obrigatórios.',
  EMAIL_INVALIDO: 'Por favor, insira um email válido.',
  LOGIN_INVALIDO: 'Email ou palavra-passe incorretos.',
  ERRO_CONEXAO: 'Erro de conexão. Tente novamente.',
  ERRO_INESPERADO: 'Erro inesperado. Tente novamente.',
} as const;

// Mensagens de sucesso
const SUCCESS_MESSAGES = {
  LOGIN_SUCESSO: 'Login realizado com sucesso!',
} as const;

// Hook customizado para gerenciar o formulário
function useLoginForm() {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_STATE);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const updateField = useCallback(<K extends keyof FormData>(
    field: K,
    value: FormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_STATE);
  }, []);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  return {
    formData,
    loading,
    showPassword,
    setLoading,
    updateField,
    resetForm,
    togglePasswordVisibility,
  };
}

// Validações extraídas
function validateForm(formData: FormData): string | null {
  const { email, password } = formData;

  if (!email.trim() || !password.trim()) {
    return ERROR_MESSAGES.CAMPOS_OBRIGATORIOS;
  }

  // Validação básica de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return ERROR_MESSAGES.EMAIL_INVALIDO;
  }

  return null;
}

// Funções de API extraídas
async function loginUser(formData: FormData): Promise<any> {
  const { email, password } = formData;

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: password,
  });

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      throw new Error(ERROR_MESSAGES.LOGIN_INVALIDO);
    }
    if (error.message.includes('Network')) {
      throw new Error(ERROR_MESSAGES.ERRO_CONEXAO);
    }
    throw new Error(ERROR_MESSAGES.ERRO_INESPERADO);
  }

  return data;
}

function Login() {
  const router = useRouter();
  const {
    formData,
    loading,
    showPassword,
    setLoading,
    updateField,
    resetForm,
    togglePasswordVisibility,
  } = useLoginForm();

  // Handler principal otimizado
  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validação
      const validationError = validateForm(formData);
      if (validationError) {
        toast.error(validationError);
        return;
      }

      // Fazer login
      const loginData = await loginUser(formData);

      // Toast de sucesso
      toast.success(SUCCESS_MESSAGES.LOGIN_SUCESSO);

      // Limpar formulário
      resetForm();

      // Redirecionar para a página principal
      router.push('/');

    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : ERROR_MESSAGES.ERRO_INESPERADO;
      
      console.error('Erro ao fazer login:', error);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [formData, setLoading, resetForm]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#eaf2e9]">
      <Toaster position="bottom-right" />
      <Card className="w-full max-w-md bg-[#FFFDF6] shadow-[1px_1px_3px_rgba(3,34,33,0.1)]">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-[#032221]">
            Iniciar Sessão
          </CardTitle>
          <CardDescription className="text-[#032221]/70">
            Entre na sua conta para continuar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-[#032221]">
                Email
              </Label>
              <Input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                className="border-[#032221] focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus:shadow-none"
                placeholder="seu.email@exemplo.com"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="password" className="text-sm font-medium text-[#032221]">
                Palavra-passe
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  className="border-[#032221] focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus:shadow-none pr-10"
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
                    <EyeOff className="h-4 w-4 text-[#032221]" />
                  ) : (
                    <Eye className="h-4 w-4 text-[#032221]" />
                  )}
                </Button>
              </div>
            </div>

            {/* Links para palavra-passe esquecida e registo */}
            <Link 
              href="/reset-password" 
              className="text-sm text-[#032221] font-normal hover:text-[#052e2d] text-center transition-colors duration-200"
            >
              Esqueceu a palavra-passe?
            </Link>

            <Button
              type="submit"
              disabled={loading}
              className="mt-3 w-full bg-[#032221] text-[#FFFDF6] hover:bg-[#052e2d] cursor-pointer transition-all duration-200 hover:scale-[1.02] disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <IoLogInOutline />
              {loading ? 'Entrando...' : 'Iniciar Sessão'}
            </Button>

            <div className="text-sm font-normal text-[#032221]/70 text-center">
              Não tem conta?{' '}
              <Link 
                href="/registar" 
                className="text-[#032221] hover:text-[#052e2d] font-medium transition-colors duration-200"
              >
                Registar-se
              </Link>
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default Login;