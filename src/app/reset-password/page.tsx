'use client';

import { useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Toaster } from 'sonner';
import { Eye, EyeOff, Key } from 'lucide-react';

// Interfaces para type safety
interface FormData {
  password: string;
  confirmPassword: string;
}

// Estado inicial do formulário
const INITIAL_FORM_STATE: FormData = {
  password: '',
  confirmPassword: '',
};

// Mensagens de erro centralizadas
const ERROR_MESSAGES = {
  CAMPOS_OBRIGATORIOS: 'Por favor, preencha todos os campos.',
  PASSWORDS_NAO_COINCIDEM: 'As palavras-passe não coincidem.',
  PASSWORD_FRACA: 'A palavra-passe deve ter pelo menos 6 caracteres.',
  ERRO_ATUALIZAR: 'Erro ao atualizar a palavra-passe.',
  ERRO_INESPERADO: 'Ocorreu um erro inesperado.',
} as const;

// Mensagens de sucesso
const SUCCESS_MESSAGES = {
  PASSWORD_ATUALIZADA: 'Palavra-passe atualizada com sucesso! Já pode iniciar sessão.',
} as const;

// Hook customizado para gerenciar o formulário
function useResetPasswordForm() {
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
  const { password, confirmPassword } = formData;

  if (!password.trim() || !confirmPassword.trim()) {
    return ERROR_MESSAGES.CAMPOS_OBRIGATORIOS;
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
async function updateUserPassword(password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    throw new Error(ERROR_MESSAGES.ERRO_ATUALIZAR);
  }
}

function ResetPassword() {
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
  } = useResetPasswordForm();

  // Handler principal otimizado
  const handleUpdate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validação
      const validationError = validateForm(formData);
      if (validationError) {
        toast.error(validationError);
        return;
      }

      // Atualizar palavra-passe
      await updateUserPassword(formData.password);

      // Toast de sucesso
      toast.success(SUCCESS_MESSAGES.PASSWORD_ATUALIZADA);

      // Limpar formulário
      resetForm();

    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : ERROR_MESSAGES.ERRO_INESPERADO;
      
      console.error('Erro ao atualizar palavra-passe:', error);
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
            Definir nova palavra-passe
          </CardTitle>
          <CardDescription className="text-[#032221]/70">
            Crie uma nova palavra-passe para a sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-[#032221]">
                Nova palavra-passe
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
                Confirmar nova palavra-passe
              </Label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  className="border-[#032221] focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus:shadow-none pr-10"
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
                    <EyeOff className="h-4 w-4 text-[#032221]" />
                  ) : (
                    <Eye className="h-4 w-4 text-[#032221]" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#032221] text-[#FFFDF6] hover:bg-[#052e2d] cursor-pointer transition-all duration-200 hover:scale-[1.02] disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? 'Atualizando...' : 'Atualizar palavra-passe'}
              <Key className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default ResetPassword;