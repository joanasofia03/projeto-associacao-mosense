'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { VerificacaoDePermissoes } from '../components/VerificacaoDePermissoes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Toaster } from 'sonner';

// Import de icons
import { RiDeleteBin6Line } from "react-icons/ri";
import { MdOutlineEdit } from "react-icons/md";

// Interfaces
interface Item {
  id: string;
  nome: string;
  preco: number;
  tipo: string;
  criado_em: string;
  isMenu: boolean;
  IVA?: number;
  imagem_url?: string | null;
}

interface EditFormData {
  nome: string;
  preco: number;
  tipo: string;
  isMenu: boolean;
  IVA: number;
  imagem: File | null;
  imagemPreview: string | null;
}

// Constantes
const FILTER_CATEGORIES = ['Tudo', 'Sopas', 'Comida', 'Sobremesas', 'Bebida', 'Álcool', 'Brindes'] as const;

const TIPOS_OPTIONS = [
  { value: "Sopas", label: "Sopas" },
  { value: "Comida", label: "Comida" },
  { value: "Sobremesas", label: "Sobremesas" },
  { value: "Bebida", label: "Bebida" },
  { value: "Álcool", label: "Álcool" },
  { value: "Brindes", label: "Brindes" }
] as const;

const IVA_OPTIONS = [
  { value: 23, label: "23% (Padrão)" },
  { value: 13, label: "13% (Intermédio)" },
  { value: 6, label: "6% (Reduzido)" },
  { value: 0, label: "0% (Isento)" }
] as const;

// Componente de upload de imagem melhorado
interface ImageUploadProps {
  imagem: File | null;
  imagemPreview: string | null;
  onImageChange: (file: File | null) => void;
  onImageRemove: () => void;
}

const ImageUpload = ({ 
  imagem, 
  imagemPreview, 
  onImageChange,
  onImageRemove
}: ImageUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione apenas arquivos de imagem');
        return;
      }
      
      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('A imagem deve ter no máximo 5MB');
        return;
      }
      
      onImageChange(file);
    }
    
    // Limpar o input para permitir selecionar o mesmo arquivo novamente
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [onImageChange]);

  const hasImage = useMemo(() => imagem || imagemPreview, [imagem, imagemPreview]);

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-[#032221]">
        Imagem do Item
      </Label>
      <div className="flex flex-col gap-2">
        <input
          ref={inputRef}
          type="file"
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          aria-label="Upload de imagem"
        />
        
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleFileSelect}
            className="flex-grow border-[#032221] hover:bg-[rgba(3,98,76,0.1)]"
          >
            {imagem ? 'Trocar Imagem' : 'Selecionar Imagem'}
          </Button>
          {hasImage && (
            <Button
              type="button"
              variant="destructive"
              onClick={onImageRemove}
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
              {imagem ? imagem.name : 'Imagem atual'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente de Card de Item otimizado
const ItemCard = ({ 
  item, 
  onEdit, 
  onDelete 
}: { 
  item: Item; 
  onEdit: (item: Item) => void; 
  onDelete: (id: string, nome: string) => void; 
}) => {
  const formatDateTime = useMemo(() => {
    const date = new Date(item.criado_em);
    return {
      data: date.toLocaleDateString(),
      hora: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }, [item.criado_em]);

  const handleEdit = useCallback(() => onEdit(item), [onEdit, item]);
  const handleDelete = useCallback(() => onDelete(item.id, item.nome), [onDelete, item.id, item.nome]);

  return (
    <Card className="bg-[#FFFDF6] shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="text-[#032221] border-b border-[rgba(32,41,55,0.1)]">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl text-[#032221] truncate">{item.nome}</CardTitle>
          <span className="px-3 py-1 bg-[#DDEB9D] text-[#032221] text-xs font-medium rounded-full">
            {item.tipo}
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="p-5 flex-grow">
        <div className="space-y-3 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-[#032221]">Preço:</span>
            <span className="text-[#032221] font-semibold">€{item.preco.toFixed(2)}</span>
          </div>
          
          {item.IVA !== undefined && (
            <div className="flex justify-between items-center">
              <span className="text-[#032221]">IVA:</span>
              <span className="text-[#032221] font-semibold">{item.IVA}%</span>
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <span className="text-[#032221]">Menu:</span>
            <span className={`font-medium ${item.isMenu ? 'text-[#A4B465]' : 'text-[#D2665A]'}`}>
              {item.isMenu ? 'Incluído' : 'Não incluído'}
            </span>
          </div>
          
          <div className="flex justify-between items-center text-sm text-gray-500">
            <span>Criado em:</span>
            <span>{formatDateTime.data} às {formatDateTime.hora}</span>
          </div>
        </div>
        
        {/* Botões de ação */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button
            onClick={handleEdit}
            className="bg-[#DDEB9D] text-[#032221] hover:bg-[#c9d685] transition-all duration-200 hover:scale-105"
          >
            <MdOutlineEdit className="h-4 w-4 mr-1"/>
            Editar
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="bg-[rgba(210,102,90,0.12)] text-[#D2665A] hover:bg-[rgba(210,102,90,0.17)] transition-all duration-200 hover:scale-105"
              >
                <RiDeleteBin6Line className="h-4 w-4 mr-1"/>
                Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-[#FFFDF6]">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-[#032221]">
                  Confirmar Exclusão
                </AlertDialogTitle>
                <AlertDialogDescription className="text-[#032221]/70">
                  Tem certeza que deseja excluir o item <strong>"{item.nome}"</strong>?
                  <br />
                  Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-[#032221] text-[#032221] hover:bg-[rgba(3,98,76,0.1)]">
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-[#D2665A] text-white hover:bg-[#D2665A]/90"
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};

function AlterarItem() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<typeof FILTER_CATEGORIES[number]>('Tudo');
  const [saving, setSaving] = useState(false);
  
  // Form data para edição
  const [editFormData, setEditFormData] = useState<EditFormData>({
    nome: '',
    preco: 0,
    tipo: '',
    isMenu: false,
    IVA: 23,
    imagem: null,
    imagemPreview: null,
  });

  // Fetch items com otimização
  const fetchItems = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('itens')
        .select('id, nome, preco, tipo, criado_em, isMenu, IVA, imagem_url')
        .order('criado_em', { ascending: false });

      if (error) {
        console.error('Erro ao buscar itens:', error);
        toast.error('Erro ao carregar os itens');
      } else {
        setItems(data || []);
      }
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast.error('Erro inesperado ao carregar os itens');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Update field helper otimizado
  const updateEditField = useCallback(<K extends keyof EditFormData>(
    field: K,
    value: EditFormData[K]
  ) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Handle image change com preview otimizado
  const handleImageChange = useCallback((file: File | null) => {
    if (file) {
      updateEditField('imagem', file);
      
      // Criar preview da imagem
      const reader = new FileReader();
      reader.onloadend = () => {
        updateEditField('imagemPreview', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [updateEditField]);

  // Handle image remove - CORRIGIDO
  const handleImageRemove = useCallback(() => {
    updateEditField('imagem', null);
    updateEditField('imagemPreview', null);
  }, [updateEditField]);

  // Handle edit click otimizado
  const handleEditClick = useCallback((item: Item) => {
    setEditingItem(item);
    setEditFormData({
      nome: item.nome,
      preco: item.preco,
      tipo: item.tipo,
      isMenu: item.isMenu,
      IVA: item.IVA || 23,
      imagem: null,
      imagemPreview: item.imagem_url || null,
    });
    setIsDialogOpen(true);
  }, []);

  // Upload image function otimizada
  const uploadImage = useCallback(async (imagem: File): Promise<string | null> => {
    const imagemNome = `${Date.now()}-${imagem.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;

    const { error: uploadError } = await supabase.storage
      .from('imagens')
      .upload(imagemNome, imagem, {
        contentType: imagem.type,
      });

    if (uploadError) {
      throw new Error('Erro ao fazer upload da imagem');
    }

    // Espera 1 segundo para garantir consistência eventual
    await new Promise(resolve => setTimeout(resolve, 1000));

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('imagens')
      .createSignedUrl(imagemNome, 60 * 60 * 24 * 365 * 5);

    if (signedUrlError) {
      throw new Error('Erro ao gerar URL temporária da imagem');
    }

    return signedUrlData?.signedUrl || null;
  }, []);

  // Handle save otimizado
  const handleSave = useCallback(async () => {
    if (!editingItem || !editFormData.nome.trim() || !editFormData.tipo) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const nomeTrimmed = editFormData.nome.trim();
    setSaving(true);
    
    try {
      // Verificar duplicação de nome
      const { data: existingItems, error: fetchError } = await supabase
        .from('itens')
        .select('id')
        .ilike('nome', nomeTrimmed)
        .eq('tipo', editFormData.tipo);

      if (fetchError) {
        throw new Error('Erro ao verificar duplicação de nome');
      }

      const isDuplicate = existingItems.some(item => item.id !== editingItem.id);
      if (isDuplicate) {
        toast.error('Já existe outro item com o mesmo nome e tipo');
        return;
      }
      
      // Upload da imagem se existir uma nova
      let imagemUrl = editingItem.imagem_url || null;
      
      if (editFormData.imagem) {
        // Nova imagem selecionada
        imagemUrl = await uploadImage(editFormData.imagem);
      } else if (!editFormData.imagemPreview) {
        // Imagem foi removida
        imagemUrl = null;
      }

      const { error } = await supabase
        .from('itens')
        .update({
          nome: nomeTrimmed,
          preco: editFormData.preco,
          tipo: editFormData.tipo,
          isMenu: editFormData.isMenu,
          IVA: editFormData.IVA,
          imagem_url: imagemUrl,
        })
        .eq('id', editingItem.id);

      if (error) {
        throw new Error('Erro ao atualizar item');
      }

      // Atualizar o estado local
      setItems(prevItems => prevItems.map(item => 
        item.id === editingItem.id ? { 
          ...item, 
          nome: nomeTrimmed,
          preco: editFormData.preco,
          tipo: editFormData.tipo,
          isMenu: editFormData.isMenu,
          IVA: editFormData.IVA,
          imagem_url: imagemUrl
        } : item
      ));

      toast.success('Item atualizado com sucesso!');
      setIsDialogOpen(false);
      setEditingItem(null);
      
    } catch (error) {
      console.error('Erro ao salvar item:', error);
      toast.error(error instanceof Error ? error.message : 'Erro desconhecido ao salvar o item');
    } finally {
      setSaving(false);
    }
  }, [editingItem, editFormData, uploadImage]);

  // Handle delete otimizado
  const handleDelete = useCallback(async (id: string, nome: string) => {
    try {
      const { data: itemData, error: fetchError } = await supabase
        .from('itens')
        .select('imagem_url')
        .eq('id', id)
        .single();

      if (fetchError) {
        throw new Error('Erro ao buscar item');
      }

      // Remover imagem do storage se existir
      if (itemData?.imagem_url) {
        const url = new URL(itemData.imagem_url);
        const pathname = url.pathname;
        const regex = /\/imagens\/(.+)$/;
        const match = pathname.match(regex);
        if (match && match[1]) {
          const imageName = match[1];
          await supabase.storage
            .from('imagens')
            .remove([imageName]);
        }
      }

      const { error: deleteItemError } = await supabase.from('itens').delete().eq('id', id);

      if (deleteItemError) {
        throw new Error('Erro ao excluir o item');
      }

      setItems(prevItems => prevItems.filter(item => item.id !== id));
      toast.success(`Item "${nome}" excluído com sucesso!`);
      
    } catch (error) {
      console.error('Erro ao excluir item:', error);
      toast.error(error instanceof Error ? error.message : 'Erro desconhecido ao excluir o item');
    }
  }, []);

  // Filtros otimizados com useMemo
  const filteredItems = useMemo(() => {
    return activeFilter === 'Tudo' 
      ? items 
      : items.filter(item => item.tipo === activeFilter);
  }, [items, activeFilter]);

  // Função para fechar dialog
  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
    setEditingItem(null);
    // Reset form
    setEditFormData({
      nome: '',
      preco: 0,
      tipo: '',
      isMenu: false,
      IVA: 23,
      imagem: null,
      imagemPreview: null,
    });
  }, []);

  return (
    <main className="h-full bg-[#eaf2e9] overflow-y-scroll">
      <Toaster position="bottom-right" />
      
      {/* Cabeçalho */}
      <div className="bg-[#eaf2e9] text-[#032221] pt-5 px-10">
        <h1 className="text-3xl font-bold">Gerir Itens - Edição ou Exclusão</h1>
      </div>

      {/* Filtros */}
      <div className="bg-[#eaf2e9] w-full h-12 flex flex-row justify-start items-center px-10 gap-4 mt-2">
        <div className="flex flex-row justify-start items-center gap-4">
          {FILTER_CATEGORIES.map((category) => (
            <Button
              key={category}
              onClick={() => setActiveFilter(category)}
              variant="botaoadicionar"
              className={`px-3 py-2 text-sm font-semibold transition-all duration-200 hover:-translate-y-1 cursor-pointer shadow-[1px_1px_3px_rgba(3,34,33,0.2)] ${
                activeFilter === category
                  ? 'bg-[#032221] text-[#FFFDF6]'
                  : 'bg-[#FFFDF6] text-[#032221]'
              }`}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Conteúdo principal */} 
      <div className="w-full py-2 px-10">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#032221]"></div>
          </div>
        ) : filteredItems.length === 0 ? (
          <Card className="bg-[#FFFDF6] shadow-md">
            <CardContent className="p-8 text-center">
              <p className="text-lg text-gray-600">Nenhum item encontrado para esta categoria.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onEdit={handleEditClick}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Dialog de Edição */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-md bg-[#FFFDF6] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-[#032221]">
              Editar Item
            </DialogTitle>
            <DialogDescription className="text-[#032221]/70">
              Faça as alterações necessárias ao item
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nome" className="text-sm font-medium text-[#032221]">
                Nome do Item
              </Label>
              <Input
                id="edit-nome"
                value={editFormData.nome}
                onChange={(e) => updateEditField('nome', e.target.value)}
                className="border-[#032221] focus-visible:ring-0 focus-visible:ring-offset-0"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-preco" className="text-sm font-medium text-[#032221]">
                Preço (€)
              </Label>
              <Input
                type="number"
                id="edit-preco"
                value={editFormData.preco}
                onChange={(e) => updateEditField('preco', parseFloat(e.target.value) || 0)}
                className="border-[#032221] focus-visible:ring-0 focus-visible:ring-offset-0"
                required
                step="0.01"
                min="0"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#032221]">
                  Tipo
                </Label>
                <Select
                  value={editFormData.tipo}
                  onValueChange={(value) => updateEditField('tipo', value)}
                >
                  <SelectTrigger className="w-full border-[#032221] focus:ring-0 focus:ring-offset-0">
                    <SelectValue />
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
                  value={editFormData.IVA.toString()}
                  onValueChange={(value) => updateEditField('IVA', Number(value))}
                >
                  <SelectTrigger className="w-full border-[#032221] focus:ring-0 focus:ring-offset-0">
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
            
            {/* Upload de Imagem - Versão Corrigida */}
            <ImageUpload
              imagem={editFormData.imagem}
              imagemPreview={editFormData.imagemPreview}
              onImageChange={handleImageChange}
              onImageRemove={handleImageRemove}
            />
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-isMenu"
                checked={editFormData.isMenu}
                onCheckedChange={(checked) => updateEditField('isMenu', checked as boolean)}
                className="border-[#1a4d4a] data-[state=checked]:bg-[#032221] data-[state=checked]:border-[#032221]"
              />
              <Label htmlFor="edit-isMenu" className="text-sm text-[#032221]">
                Incluir no menu?
              </Label>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={handleCloseDialog}
                className="border-[#032221] text-[#032221] hover:bg-[rgba(3,98,76,0.1)]"
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-[#032221] text-[#FFFDF6] hover:bg-[#052e2d] cursor-pointer transition-all duration-200 hover:scale-[1.02] disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

export default VerificacaoDePermissoes(AlterarItem, ['Administrador', 'Funcionario de Banca']);