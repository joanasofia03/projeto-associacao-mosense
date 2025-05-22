'use client';

//Imports do Shadcn
import { useState, useCallback, useMemo } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { VerificacaoDePermissoes } from '../components/VerificacaoDePermissoes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Toaster } from 'sonner';

// Interfaces para type safety
interface Evento {
  id?: string;
  nome: string;
  data_inicio: string;
  data_fim: string;
  em_execucao: boolean;
}

interface FormData {
  nome: string;
  dataInicio: Date | undefined;
  dataFim: Date | undefined;
  emExecucao: boolean;
}

// Estado inicial do formulário
const INITIAL_FORM_STATE: FormData = {
  nome: '',
  dataInicio: undefined,
  dataFim: undefined,
  emExecucao: false,
};

// Mensagens de erro centralizadas
const ERROR_MESSAGES = {
  CAMPOS_OBRIGATORIOS: 'Por favor, preencha todos os campos obrigatórios.',
  DATA_INVALIDA: 'Por favor, selecione uma data de fim posterior à data de início.',
  EVENTO_EXISTENTE: 'Já existe um evento com esse nome.',
  EVENTO_EM_EXECUCAO: 'Já existe um evento em execução. Finalize-o antes de adicionar outro.',
  ERRO_VERIFICACAO: 'Erro ao verificar eventos existentes.',
  ERRO_ADICIONAR: 'Erro ao adicionar o evento.',
  ERRO_UNDO: 'Erro ao desfazer a operação.',
  ERRO_INESPERADO: 'Erro inesperado.',
} as const;

// Hook customizado para gerenciar o formulário
function useEventForm() {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_STATE);
  const [loading, setLoading] = useState(false);

  const updateField = useCallback(<K extends keyof FormData>(
    field: K,
    value: FormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_STATE);
  }, []);

  const restoreForm = useCallback((data: FormData) => {
    setFormData(data);
  }, []);

  return {
    formData,
    loading,
    setLoading,
    updateField,
    resetForm,
    restoreForm,
  };
}

// Validações extraídas
function validateForm(formData: FormData): string | null {
  const { nome, dataInicio, dataFim } = formData;

  if (!nome.trim() || !dataInicio || !dataFim) {
    return ERROR_MESSAGES.CAMPOS_OBRIGATORIOS;
  }

  if (dataFim < dataInicio) {
    return ERROR_MESSAGES.DATA_INVALIDA;
  }

  return null;
}

// Funções de API extraídas
async function checkEventExists(nome: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('eventos')
    .select('id')
    .ilike('nome', nome.trim());

  if (error) {
    throw new Error(ERROR_MESSAGES.ERRO_VERIFICACAO);
  }

  return data && data.length > 0;
}

async function createEvent(formData: FormData): Promise<Evento[]> {
  const { nome, dataInicio, dataFim, emExecucao } = formData;

  const { data, error } = await supabase
    .from('eventos')
    .insert([{
      nome: nome.trim(),
      data_inicio: format(dataInicio!, 'yyyy-MM-dd'),
      data_fim: format(dataFim!, 'yyyy-MM-dd'),
      em_execucao: emExecucao,
    }])
    .select();

  if (error) {
    if (error.message.includes('unico_evento_em_execucao')) {
      throw new Error(ERROR_MESSAGES.EVENTO_EM_EXECUCAO);
    }
    throw new Error(ERROR_MESSAGES.ERRO_ADICIONAR);
  }

  return data;
}

async function deleteEvent(eventId: string): Promise<void> {
  const { error } = await supabase
    .from('eventos')
    .delete()
    .eq('id', eventId);

  if (error) {
    throw new Error(ERROR_MESSAGES.ERRO_UNDO);
  }
}

// Componente de campo de data reutilizável
interface DateFieldProps {
  label: string;
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
}

function DateField({ label, value, onChange }: DateFieldProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-[#032221]">
        {label}
      </Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal border-[#032221]",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, "dd/MM/yyyy") : "Selecione a data"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={value}
            onSelect={onChange}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function AdicionarEvento() {
  const {
    formData,
    loading,
    setLoading,
    updateField,
    resetForm,
    restoreForm,
  } = useEventForm();

  // Função de undo otimizada
  const createUndoHandler = useCallback((
    eventData: Evento,
    originalFormData: FormData
  ) => {
    return async () => {
      try {
        if (eventData.id) {
          await deleteEvent(eventData.id);
          restoreForm(originalFormData);
          toast.success('Operação desfeita com sucesso!');
        }
      } catch (error) {
        console.error('Erro no undo:', error);
        toast.error(ERROR_MESSAGES.ERRO_UNDO);
      }
    };
  }, [restoreForm]);

  // Handler principal otimizado
  const handleAddEvento = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validação
      const validationError = validateForm(formData);
      if (validationError) {
        toast.error(validationError);
        return;
      }

      // Verificar se evento já existe
      const eventExists = await checkEventExists(formData.nome);
      if (eventExists) {
        toast.error(ERROR_MESSAGES.EVENTO_EXISTENTE);
        return;
      }

      // Criar evento
      const [createdEvent] = await createEvent(formData);

      // Guardar dados para undo
      const originalFormData = { ...formData };

      // Toast de sucesso com undo
      toast(`Evento "${formData.nome.trim()}" foi criado com sucesso!`, {
        action: {
          label: "Undo",
          onClick: createUndoHandler(createdEvent, originalFormData),
        },
      });

      // Limpar formulário
      resetForm();

    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : ERROR_MESSAGES.ERRO_INESPERADO;
      
      console.error('Erro ao adicionar evento:', error);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [formData, setLoading, createUndoHandler, resetForm]);

  // Memoização dos componentes de data
  const dataInicioField = useMemo(() => (
    <DateField
      label="Data de Início"
      value={formData.dataInicio}
      onChange={(date) => updateField('dataInicio', date)}
    />
  ), [formData.dataInicio, updateField]);

  const dataFimField = useMemo(() => (
    <DateField
      label="Data de Fim"
      value={formData.dataFim}
      onChange={(date) => updateField('dataFim', date)}
    />
  ), [formData.dataFim, updateField]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#eaf2e9]">
      <Toaster position="top-right" />
      <Card className="w-full max-w-md bg-[#FFFDF6] shadow-[1px_1px_3px_rgba(3,34,33,0.1)]">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-[#032221]">
            Adicionar Evento
          </CardTitle>
          <CardDescription className="text-[#032221]/70">
            Crie e gira um evento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddEvento} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-sm font-medium text-[#032221]">
                Nome do Evento
              </Label>
              <Input
                type="text"
                id="nome"
                value={formData.nome}
                onChange={(e) => updateField('nome', e.target.value)}
                className="border-[#032221] focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus:shadow-none"
                required
              />
            </div>

            {dataInicioField}
            {dataFimField}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="emExecucao"
                checked={formData.emExecucao}
                onCheckedChange={(checked) => updateField('emExecucao', checked as boolean)}
                className="border-[#1a4d4a] data-[state=checked]:bg-[#032221] data-[state=checked]:border-[#032221]"
              />
              <Label htmlFor="emExecucao" className="text-sm text-[#032221]">
                Evento está em execução?
              </Label>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#032221] text-[#FFFDF6] hover:bg-[#052e2d] cursor-pointer transition-all duration-200 hover:scale-[1.02] disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? 'Guardando...' : 'Adicionar Evento'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default VerificacaoDePermissoes(AdicionarEvento, ['Administrador']);