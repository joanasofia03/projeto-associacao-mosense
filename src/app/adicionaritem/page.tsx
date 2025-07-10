'use client';

//Imports do Shadcn
import { useState, useRef, useCallback, useMemo } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Toaster } from 'sonner';

import { IoAddCircleOutline } from "react-icons/io5";

// Interfaces para type safety
interface Item {
  id?: string;
  nome: string;
  preco: number;
  tipo: string;
  isMenu: boolean;
  IVA: number;
  imagem_url: string | null;
  criado_em: string;
}

interface FormData {
  nome: string;
  preco: number;
  tipo: string;
  isMenu: boolean;
  taxaIVA: number;
  imagem: File | null;
  imagemPreview: string | null;
}

// Estado inicial do formulário
const INITIAL_FORM_STATE: FormData = {
  nome: '',
  preco: 0,
  tipo: '',
  isMenu: false,
  taxaIVA: 23,
  imagem: null,
  imagemPreview: null,
};

// Mensagens de erro centralizadas
const ERROR_MESSAGES = {
  CAMPOS_OBRIGATORIOS: 'Por favor, preencha todos os campos obrigatórios.',
  ITEM_EXISTENTE: 'Já existe um item com esse nome.',
  ERRO_VERIFICACAO: 'Erro ao verificar itens existentes.',
  ERRO_UPLOAD_IMAGEM: 'Erro ao fazer upload da imagem.',
  ERRO_URL_IMAGEM: 'Erro ao gerar URL temporária da imagem.',
  ERRO_ADICIONAR: 'Erro ao adicionar o item.',
  ERRO_UNDO: 'Erro ao desfazer a operação.',
  ERRO_INESPERADO: 'Erro inesperado.',
} as const;

// Opções de tipos
const TIPOS_OPTIONS = [
  { value: "Sopas", label: "Sopas" },
  { value: "Comida", label: "Comida" },
  { value: "Sobremesas", label: "Sobremesas" },
  { value: "Bebida", label: "Bebida" },
  { value: "Álcool", label: "Álcool" },
  { value: "Brindes", label: "Brindes" }
];

// Opções de IVA
const IVA_OPTIONS = [
  { value: 23, label: "23% (Padrão)" },
  { value: 13, label: "13% (Intermédio)" },
  { value: 6, label: "6% (Reduzido)" },
  { value: 0, label: "0% (Isento)" }
];

// Hook customizado para gerenciar o formulário
function useItemForm() {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_STATE);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const updateField = useCallback(<K extends keyof FormData>(
    field: K,
    value: FormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_STATE);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const restoreForm = useCallback((data: FormData) => {
    setFormData(data);
  }, []);

  const handleImagemChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      updateField('imagem', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        updateField('imagemPreview', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [updateField]);

  const resetImagemInput = useCallback(() => {
    updateField('imagem', null);
    updateField('imagemPreview', null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [updateField]);

  return {
    formData,
    loading,
    setLoading,
    updateField,
    resetForm,
    restoreForm,
    fileInputRef,
    handleImagemChange,
    resetImagemInput,
  };
}

// Validações extraídas
function validateForm(formData: FormData): string | null {
  const { nome, preco, tipo } = formData;

  if (!nome.trim() || preco < 0 || !tipo) {
    return ERROR_MESSAGES.CAMPOS_OBRIGATORIOS;
  }

  return null;
}

// Funções de API extraídas
async function checkItemExists(nome: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('itens')
    .select('id')
    .ilike('nome', nome.trim());

  if (error) {
    throw new Error(ERROR_MESSAGES.ERRO_VERIFICACAO);
  }

  return data && data.length > 0;
}

async function uploadImage(imagem: File): Promise<string | null> {
  const imagemNome = `${Date.now()}-${imagem.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;

  console.log('Arquivo para upload:', imagem);

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('imagens')
    .upload(imagemNome, imagem, {
      contentType: imagem.type,
    });

  if (uploadError) {
    console.error('Erro no upload:', uploadError);
    throw new Error(ERROR_MESSAGES.ERRO_UPLOAD_IMAGEM);
  }

  console.log('uploaded data', uploadData);

  // espera 1 segundo para garantir consistência eventual
  await new Promise(resolve => setTimeout(resolve, 1000));

  const { data: listaArquivos, error: listError } = await supabase.storage
    .from('imagens')
    .list('');

  if (listError) {
    console.error('Erro ao listar arquivos no bucket:', listError);
  } else {
    console.log('Arquivos atualmente no bucket:', listaArquivos);
  }

  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from('imagens')
    .createSignedUrl(imagemNome, 60 * 60 * 24 * 365 * 5);

  if (signedUrlError) {
    console.error('Erro URL temporária:', signedUrlError);
    throw new Error(ERROR_MESSAGES.ERRO_URL_IMAGEM);
  }

  const imagemUrl = signedUrlData?.signedUrl || null;
  console.log("imageurl:", imagemUrl);
  
  return imagemUrl;
}

async function createItem(formData: FormData, imagemUrl: string | null): Promise<Item[]> {
  const { nome, preco, tipo, isMenu, taxaIVA } = formData;

  const { data, error } = await supabase
    .from('itens')
    .insert([{
      nome: nome.trim(),
      preco,
      tipo,
      isMenu,
      IVA: taxaIVA,
      imagem_url: imagemUrl,
      criado_em: new Date().toISOString(),
    }])
    .select();

  if (error) {
    throw new Error(ERROR_MESSAGES.ERRO_ADICIONAR);
  }

  return data;
}

async function deleteItem(itemId: string): Promise<void> {
  const { error } = await supabase
    .from('itens')
    .delete()
    .eq('id', itemId);

  if (error) {
    throw new Error(ERROR_MESSAGES.ERRO_UNDO);
  }
}

// Componente de upload de imagem reutilizável
interface ImageUploadProps {
  imagem: File | null;
  imagemPreview: string | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetImage: () => void;
}

function ImageUpload({ 
  imagem, 
  imagemPreview, 
  fileInputRef, 
  onImageChange, 
  onResetImage 
}: ImageUploadProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-[#032221]">
        Imagem do Item
      </Label>
      <div className="flex flex-col gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={onImageChange}
          accept="image/*"
          className="hidden"
        />
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="flex-grow border-[#032221] hover:bg-[rgba(3,98,76,0.1)]"
          >
            {imagem ? 'Trocar Imagem' : 'Selecionar Imagem'}
          </Button>
          {imagem && (
            <Button
              type="button"
              variant="destructive"
              onClick={onResetImage}
              className="bg-[#D2665A] hover:bg-[#D2665A]/90"
            >
              Remover
            </Button>
          )}
        </div>
        {imagemPreview && (
          <div className="mt-2 border border-[#032221] rounded-lg p-2">
            <img
              src={imagemPreview}
              alt="Pré-visualização"
              className="w-full h-48 object-contain rounded"
            />
            <p className="text-xs text-gray-500 mt-1">
              {imagem?.name || 'Imagem selecionada'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdicionarItem() {
  const {
    formData,
    loading,
    setLoading,
    updateField,
    resetForm,
    restoreForm,
    fileInputRef,
    handleImagemChange,
    resetImagemInput,
  } = useItemForm();

  // Função de undo otimizada
  const createUndoHandler = useCallback((
    itemData: Item,
    originalFormData: FormData
  ) => {
    return async () => {
      try {
        if (itemData.id) {
          await deleteItem(itemData.id);
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
  const handleAddItem = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validação
      const validationError = validateForm(formData);
      if (validationError) {
        toast.error(validationError);
        return;
      }

      // Verificar se item já existe
      const itemExists = await checkItemExists(formData.nome);
      if (itemExists) {
        toast.error(ERROR_MESSAGES.ITEM_EXISTENTE);
        return;
      }

      // Upload da imagem se existir
      let imagemUrl = null;
      if (formData.imagem) {
        imagemUrl = await uploadImage(formData.imagem);
      }

      // Criar item
      const [createdItem] = await createItem(formData, imagemUrl);

      // Guardar dados para undo
      const originalFormData = { ...formData };

      // Toast de sucesso com undo
      toast(`Item "${formData.nome.trim()}" foi criado com sucesso!`, {
        action: {
          label: "Undo",
          onClick: createUndoHandler(createdItem, originalFormData),
        },
      });

      // Limpar formulário
      resetForm();

    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : ERROR_MESSAGES.ERRO_INESPERADO;
      
      console.error('Erro ao adicionar item:', error);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [formData, setLoading, createUndoHandler, resetForm]);

  // Componente de upload inline (sem memoização para evitar problemas com ref)

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#eaf2e9]">
      <Toaster position="bottom-right" />
      <Card className="w-full max-w-md bg-[#FFFDF6] shadow-[1px_1px_3px_rgba(3,34,33,0.1)]">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-[#032221]">
            Adicionar Novo Item
          </CardTitle>
          <CardDescription className="text-[#032221]/70">
            Crie e gerencie um item do menu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddItem} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-sm font-medium text-[#032221]">
                Nome do Item
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

            <div className="space-y-2">
              <Label htmlFor="preco" className="text-sm font-medium text-[#032221]">
                Preço (€)
              </Label>
              <Input
                type="number"
                id="preco"
                value={formData.preco}
                onChange={(e) => {
                  const valor = parseFloat(e.target.value);
                  updateField('preco', isNaN(valor) ? 0 : valor);
                }}
                className="border-[#032221] focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus:shadow-none"
                required
                step="0.1"
                min="0"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#032221]">
                  Tipo
                </Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) => updateField('tipo', value)}
                  required
                >
                  <SelectTrigger className="w-full border-[#032221] focus:ring-0 focus:ring-offset-0 cursor-pointer">
                    <SelectValue placeholder="Selecione o tipo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#032221]">
                  IVA (%)
                </Label>
                <Select
                  value={formData.taxaIVA.toString()}
                  onValueChange={(value) => updateField('taxaIVA', Number(value))}
                >
                  <SelectTrigger className="w-full border-[#032221] focus:ring-0 focus:ring-offset-0 cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {IVA_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#032221]">
                Imagem do Item
              </Label>
              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImagemChange}
                  accept="image/*"
                  className="hidden"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-grow border-[#032221] hover:bg-[rgba(3,98,76,0.1)] cursor-pointer"
                  >
                    {formData.imagem ? 'Trocar Imagem' : 'Selecionar Imagem'}
                  </Button>
                  {formData.imagem && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={resetImagemInput}
                      className="bg-[#D2665A] hover:bg-[#D2665A]/90"
                    >
                      Remover
                    </Button>
                  )}
                </div>
                {formData.imagemPreview && (
                  <div className="mt-2 border border-[#032221] rounded-lg p-2">
                    <img
                      src={formData.imagemPreview}
                      alt="Pré-visualização"
                      className="w-full h-48 object-contain rounded"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.imagem?.name || 'Imagem selecionada'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isMenu"
                checked={formData.isMenu}
                onCheckedChange={(checked) => updateField('isMenu', checked as boolean)}
                className="border-[#1a4d4a] data-[state=checked]:bg-[#032221] data-[state=checked]:border-[#032221]"
              />
              <Label htmlFor="isMenu" className="text-sm text-[#032221]">
                Incluir no menu?
              </Label>
            </div>

            <Button
              type="submit"
              disabled={loading}
              variant="botaoadicionar"
              className="w-full"
            >
              {loading ? 'Guardando...' : 'Adicionar Item'}<IoAddCircleOutline />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}