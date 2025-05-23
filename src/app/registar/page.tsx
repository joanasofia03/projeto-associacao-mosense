'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Toaster } from 'sonner';
import { Eye, EyeOff, UserPlus } from 'lucide-react';

// Interfaces para type safety
interface FormData {
  nome: string;
  email: string;
  telemovel: string;
  password: string;
  confirmPassword: string;
}

// Estado inicial do formulário
const INITIAL_FORM_STATE: FormData = {
  nome: '',
  email: '',
  telemovel: '',
  password: '',
  confirmPassword: '',
};

// Mensagens de erro centralizadas
const ERROR_MESSAGES = {
  CAMPOS_OBRIGATORIOS: 'Por favor, preencha todos os campos obrigatórios.',
  EMAIL_INVALIDO: 'Por favor, insira um email válido.',
  PASSWORDS_NAO_COINCIDEM: 'As palavras-passe não coincidem.',
  PASSWORD_FRACA: 'A palavra-passe deve ter pelo menos 6 caracteres.',
  ERRO_REGISTRO: 'Erro ao registar. Tente novamente.',
  ERRO_INESPERADO: 'Ocorreu um erro ao registar.',
} as const;

// Mensagens de sucesso
const SUCCESS_MESSAGES = {
  REGISTRO_SUCESSO: 'Utilizador criado com sucesso! Verifique o seu e-mail para confirmar o registo.',
} as const;

// Hook customizado para gerenciar o formulário
function useSignUpForm() {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_STATE);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const toggleConfirmPasswordVisibility = useCallback(() => {
    setShowConfirmPassword(prev => !prev);
  }, []);

  return {
    formData,
    loading,
    showPassword,
    showConfirmPassword,
    setLoading,
    updateField,
    resetForm,
    togglePasswordVisibility,
    toggleConfirmPasswordVisibility,
  };
}

// Validações extraídas
function validateForm(formData: FormData): string | null {
  const { nome, email, password, confirmPassword } = formData;

  if (!nome.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
    return ERROR_MESSAGES.CAMPOS_OBRIGATORIOS;
  }

  // Validação básica de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return ERROR_MESSAGES.EMAIL_INVALIDO;
  }

  if (password.length < 6) {
    return ERROR_MESSAGES.PASSWORD_FRACA;
  }

  if (password !== confirmPassword) {
    return ERROR_MESSAGES.PASSWORDS_NAO_COINCIDEM;
  }

  return null;
}

// Funções de API extraídas
async function signUpUser(formData: FormData): Promise<any> {
  const { nome, email, password, telemovel } = formData;

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password: password,
    options: {
      data: {
        nome: nome.trim(),
        tipo: 'Cliente',
        aceitou_TU_e_PP: 'Sim',
        telemovel: telemovel ? Number(telemovel) : null,
      },
    },
  });

  if (error) {
    console.error(error.message);
    throw new Error(ERROR_MESSAGES.ERRO_REGISTRO);
  }

  return data;
}

function SignUp() {
  const router = useRouter();
  const {
    formData,
    loading,
    showPassword,
    showConfirmPassword,
    setLoading,
    updateField,
    resetForm,
    togglePasswordVisibility,
    toggleConfirmPasswordVisibility,
  } = useSignUpForm();

  // Handler principal otimizado
  const handleSignUp = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validação
      const validationError = validateForm(formData);
      if (validationError) {
        toast.error(validationError);
        return;
      }

      // Registar utilizador
      await signUpUser(formData);

      // Toast de sucesso
      toast.success(SUCCESS_MESSAGES.REGISTRO_SUCESSO);

      // Limpar formulário
      resetForm();

    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : ERROR_MESSAGES.ERRO_INESPERADO;
      
      console.error('Erro ao registar:', error);
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
            Criar uma nova conta
          </CardTitle>
          <CardDescription className="text-[#032221]/70">
            Preencha os dados para criar a sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-sm font-medium text-[#032221]">
                Nome
              </Label>
              <Input
                type="text"
                id="nome"
                value={formData.nome}
                onChange={(e) => updateField('nome', e.target.value)}
                className="border-[#032221] focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus:shadow-none"
                placeholder="Seu nome completo"
                required
              />
            </div>

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

            <div className="space-y-2">
              <Label htmlFor="telemovel" className="text-sm font-medium text-[#032221]">
                Telemóvel (opcional)
              </Label>
              <Input
                type="tel"
                id="telemovel"
                value={formData.telemovel}
                onChange={(e) => updateField('telemovel', e.target.value)}
                className="border-[#032221] focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus:shadow-none"
                placeholder="912345678"
                pattern="[0-9]*"
              />
            </div>

            <div className="space-y-2">
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
                    <EyeOff className="h-4 w-4 text-[#032221]" />
                  ) : (
                    <Eye className="h-4 w-4 text-[#032221]" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-[#032221]">
                Confirmar palavra-passe
              </Label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  className="border-[#032221] focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus:shadow-none pr-10"
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
                    <EyeOff className="h-4 w-4 text-[#032221]" />
                  ) : (
                    <Eye className="h-4 w-4 text-[#032221]" />
                  )}
                </Button>
              </div>
            </div>

            <div className="text-sm text-[#032221] pt-2">
              Ao criar uma conta está automaticamente a concordar com os{' '}
              <Link href="/termsofuseprivacypolicy" className="underline text-[#3F7D58] hover:text-[#032221] transition-colors duration-200">
                Termos de Utilização e Política de Privacidade
              </Link>.
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#032221] text-[#FFFDF6] hover:bg-[#052e2d] cursor-pointer transition-all duration-200 hover:scale-[1.02] disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? 'Registando...' : 'Registar'}
              <UserPlus className="ml-2 h-4 w-4" />
            </Button>

            {/* Link para login */}
            <div className="text-sm text-[#032221]/70 text-center pt-4">
              Já tem conta?{' '}
              <Link 
                href="/login" 
                className="text-[#032221] hover:text-[#052e2d] font-medium transition-colors duration-200"
              >
                Iniciar sessão
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default SignUp;