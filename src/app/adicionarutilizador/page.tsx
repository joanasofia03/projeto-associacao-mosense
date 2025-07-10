'use client';

import { useState, useCallback, useMemo } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from 'sonner';

// Interfaces para type safety
interface FormData {
  nome: string;
  email: string;
  password: string;
  confirmPassword: string;
  tipo: string;
  telemovel: string;
  aceitouTermos: boolean;
}

// Estado inicial do formulário
const INITIAL_FORM_STATE: FormData = {
  nome: '',
  email: '',
  password: '',
  confirmPassword: '',
  tipo: '',
  telemovel: '',
  aceitouTermos: false,
};

// Constantes
const USER_TYPES = ['Administrador', 'Funcionario de Banca', 'Cliente'] as const;

const ERROR_MESSAGES = {
  PASSWORD_MISMATCH: 'As palavras-passe não coincidem.',
  USER_CREATION_ERROR: 'Erro ao criar o utilizador.',
  UNKNOWN_ERROR: 'Erro desconhecido ao tentar criar o utilizador.',
  FILL_ALL_FIELDS: 'Por favor, preencha todos os campos obrigatórios.',
  SELECT_USER_TYPE: 'Por favor, selecione um tipo de utilizador.',
  ACCEPT_TERMS: 'Deve aceitar os Termos de Utilização e Política de Privacidade.',
  PASSWORD_WEAK: 'A palavra-passe deve ter pelo menos 6 caracteres.',
} as const;

const SUCCESS_MESSAGE = 'Utilizador criado com sucesso! Verifique o e-mail do utilizador para confirmar o registo.';

// Hook customizado para gerenciar o formulário
function useUserForm() {
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
    setLoading,
    showPassword,
    showConfirmPassword,
    updateField,
    resetForm,
    togglePasswordVisibility,
    toggleConfirmPasswordVisibility,
  };
}

// Validações
function validateForm(formData: FormData): string | null {
  const { nome, email, password, confirmPassword, tipo, telemovel, aceitouTermos } = formData;

  if (!nome.trim() || !email.trim() || !password || !confirmPassword) {
    return ERROR_MESSAGES.FILL_ALL_FIELDS;
  }

  if (!tipo) {
    return ERROR_MESSAGES.SELECT_USER_TYPE;
  }

  if (password.length < 6) {
    return ERROR_MESSAGES.PASSWORD_WEAK;
  }

  if (password !== confirmPassword) {
    return ERROR_MESSAGES.PASSWORD_MISMATCH;
  }

  if (telemovel && (!/^\d+$/.test(telemovel) || telemovel.length < 9)) {
    return 'Número de telemóvel deve ter pelo menos 9 dígitos.';
  }

  if (!aceitouTermos) {
    return ERROR_MESSAGES.ACCEPT_TERMS;
  }

  return null;
}

// Função para criar utilizador - CORRIGIDA para usar a mesma abordagem do código de registar
async function createUser(formData: FormData): Promise<void> {
  const { nome, email, password, tipo, telemovel } = formData;

  // Usar a mesma abordagem do código de registar
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password: password,
    options: {
      data: {
        nome: nome.trim(),
        tipo: tipo,
        aceitou_TU_e_PP: 'Sim', // Usar 'Sim' como no código de registar
        telemovel: telemovel ? Number(telemovel) : null,
      },
    },
  });

  if (error) {
    console.error('Erro ao criar utilizador:', error.message);
    throw new Error(ERROR_MESSAGES.USER_CREATION_ERROR);
  }

  if (!data) {
    throw new Error(ERROR_MESSAGES.UNKNOWN_ERROR);
  }
}

// Componente para input de password com toggle de visibilidade
interface PasswordInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  showPassword: boolean;
  onToggleVisibility: () => void;
  required?: boolean;
  placeholder?: string;
}

function PasswordInput({
  id,
  label,
  value,
  onChange,
  showPassword,
  onToggleVisibility,
  required = false,
  placeholder = '',
}: PasswordInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium text-[#032221]">
        {label}
      </Label>
      <div className="relative">
        <Input
          type={showPassword ? 'text' : 'password'}
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="border-[#032221] focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus:shadow-none pr-10"
          required={required}
          placeholder={placeholder}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={onToggleVisibility}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-[#032221]" />
          ) : (
            <Eye className="h-4 w-4 text-[#032221]" />
          )}
        </Button>
      </div>
    </div>
  );
}

// Componente para seleção de tipo de utilizador
interface UserTypeSelectorProps {
  selectedType: string;
  onTypeSelect: (type: string) => void;
}

function UserTypeSelector({ selectedType, onTypeSelect }: UserTypeSelectorProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-[#032221]">
        Tipo de Utilizador
      </Label>
      <div className="bg-[rgba(3,98,76,0.2)] w-full h-14 flex flex-row justify-between items-center rounded-3xl border border-[rgba(209,213,219,0.3)]">
        {USER_TYPES.map((opcao) => (
          <Button
            key={opcao}
            type="button"
            variant="ghost"
            onClick={() => onTypeSelect(opcao)}
            className={`text-sm font-semibold flex-1 flex items-center justify-center text-center cursor-pointer transition-all duration-300 hover:-translate-y-1 rounded-3xl h-14 ${
              selectedType === opcao
                ? 'bg-[#032221] text-[#FFFDF6] hover:bg-[#032221] hover:text-[#FFFDF6]'
                : 'bg-transparent text-[#032221] hover:bg-transparent'
            }`}
          >
            {opcao}
          </Button>
        ))}
      </div>
    </div>
  );
}

export default function AdicionarUtilizador() {
  const {
    formData,
    loading,
    setLoading,
    showPassword,
    showConfirmPassword,
    updateField,
    resetForm,
    togglePasswordVisibility,
    toggleConfirmPasswordVisibility,
  } = useUserForm();

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validação
      const validationError = validateForm(formData);
      if (validationError) {
        toast.error(validationError);
        return;
      }

      // Criar utilizador
      await createUser(formData);

      // Sucesso
      toast.success(SUCCESS_MESSAGE);
      resetForm();

    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : ERROR_MESSAGES.UNKNOWN_ERROR;
      
      console.error('Erro ao criar utilizador:', error);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [formData, setLoading, resetForm]);

  // Memoização dos componentes mais pesados
  const passwordInput = useMemo(() => (
    <PasswordInput
      id="password"
      label="Palavra-passe"
      value={formData.password}
      onChange={(value) => updateField('password', value)}
      showPassword={showPassword}
      onToggleVisibility={togglePasswordVisibility}
      required
      placeholder="Mínimo 6 caracteres"
    />
  ), [formData.password, showPassword, updateField, togglePasswordVisibility]);

  const confirmPasswordInput = useMemo(() => (
    <PasswordInput
      id="confirmPassword"
      label="Confirmar palavra-passe"
      value={formData.confirmPassword}
      onChange={(value) => updateField('confirmPassword', value)}
      showPassword={showConfirmPassword}
      onToggleVisibility={toggleConfirmPasswordVisibility}
      required
      placeholder="Repita a palavra-passe"
    />
  ), [formData.confirmPassword, showConfirmPassword, updateField, toggleConfirmPasswordVisibility]);

  const userTypeSelector = useMemo(() => (
    <UserTypeSelector
      selectedType={formData.tipo}
      onTypeSelect={(type) => updateField('tipo', type)}
    />
  ), [formData.tipo, updateField]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#eaf2e9]">
      <Toaster position="bottom-right" />
      <Card className="w-full max-w-lg bg-[#FFFDF6] shadow-[1px_1px_3px_rgba(3,34,33,0.1)]">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-[#032221]">
            Adicionar Utilizador
          </CardTitle>
          <CardDescription className="text-[#032221]/70">
            Crie uma nova conta de utilizador no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="Nome completo do utilizador"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-[#032221]">
                E-mail
              </Label>
              <Input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                className="border-[#032221] focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus:shadow-none"
                placeholder="email@exemplo.com"
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
                pattern="[0-9]*"
                inputMode="numeric"
                placeholder="912345678"
              />
            </div>

            {passwordInput}
            {confirmPasswordInput}
            {userTypeSelector}

            <div className="flex items-start space-x-2">
              <Checkbox
                id="aceitouTermos"
                checked={formData.aceitouTermos}
                onCheckedChange={(checked) => updateField('aceitouTermos', checked as boolean)}
                className="border-[#1a4d4a] data-[state=checked]:bg-[#032221] data-[state=checked]:border-[#032221] mt-1"
              />
              <Label htmlFor="aceitouTermos" className="text-sm text-[#032221] leading-5">
                Aceito os{' '}
                <a 
                  href="/termsofuseprivacypolicy" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-[#3F7D58] hover:text-[#032221] transition-colors"
                >
                  Termos de Utilização e Política de Privacidade
                </a>
              </Label>
            </div>

            <Button
              type="submit"
              disabled={loading}
              variant="botaoadicionar"
              className="w-full"
            >
              {loading ? (
                'Criando utilizador...'
              ) : (
                <>
                  Adicionar Utilizador
                  <UserPlus className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}