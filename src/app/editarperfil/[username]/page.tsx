'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { CiEdit } from 'react-icons/ci';
import { supabase } from '../../../../lib/supabaseClient';
import Toast from '../../components/toast';

//Import de icons
import { GoSearch } from "react-icons/go";
import { MdOutlineFiberNew } from "react-icons/md";
import { IoCheckmarkDoneOutline, IoChevronDown, IoChevronUp } from "react-icons/io5";

// Shadcn imports
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast as sonnerToast } from 'sonner';
import { Toaster } from 'sonner';

// Types
type Item = {
  id: number;
  nome: string;
  preco: number;
};

type PedidoItem = {
  id: number;
  pedido_id: number;
  item_id: number;
  quantidade: number;
};

type Pedido = {
  id: number;
  numero_diario: number;
  estado_validade: string;
  id_evento: number;
  criado_em: string;
};

type Evento = {
  id: number;
  nome: string;
};

interface Profile {
  nome: string;
  tipo: string;
  telemovel: string;
}

interface Toast {
  message: string;
  type: 'success' | 'error';
  visible: boolean;
}

interface FormData {
  nome: string;
  email: string;
  telemovel: string;
}

// Mensagens de erro centralizadas
const ERROR_MESSAGES = {
  CAMPOS_OBRIGATORIOS: 'Por favor, preencha todos os campos obrigatórios.',
  EMAIL_INVALIDO: 'Por favor, insira um email válido.',
  TELEMOVEL_INVALIDO: 'Por favor, insira um número de telemóvel válido.',
  ERRO_ATUALIZAR: 'Erro ao atualizar o perfil.',
  UTILIZADOR_NAO_AUTENTICADO: 'Utilizador não autenticado.',
  ERRO_INESPERADO: 'Erro inesperado.',
} as const;

// Custom hooks
const useUser = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error) setUser(user);
      setLoading(false);
    };
    fetchUser();
  }, []);

  return { user, loading };
};

const useProfile = (userId: string | null) => {
  const [profile, setProfile] = useState<Profile>({ nome: '', tipo: '', telemovel: '' });
  const [email, setEmail] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchProfile = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('nome, tipo, telemovel')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setProfile({
          nome: data.nome || '',
          tipo: data.tipo || '',
          telemovel: data.telemovel || ''
        });
      }
      setLoading(false);
    };

    fetchProfile();
  }, [userId]);

  return { profile, setProfile, email, setEmail, originalEmail, setOriginalEmail, loading };
};

const usePedidos = (userId: string | null) => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [pedidoItens, setPedidoItens] = useState<PedidoItem[]>([]);
  const [itens, setItens] = useState<Item[]>([]);
  const [eventos, setEventos] = useState<Map<number, string>>(new Map());
  const [loading, setLoading] = useState(true);

  // Memoize pedidos data processing
  const processedPedidos = useMemo(() => {
    const pedidosMap = new Map();
    
    pedidos.forEach(pedido => {
      const itensDoPedido = pedidoItens.filter(pi => pi.pedido_id === pedido.id);
      const total = itensDoPedido.reduce((acc, pi) => {
        const item = itens.find(i => i.id === pi.item_id);
        return acc + (item?.preco || 0) * pi.quantidade;
      }, 0);
      
      pedidosMap.set(pedido.id, {
        ...pedido,
        itens: itensDoPedido,
        total,
        eventoNome: eventos.get(pedido.id_evento) || 'Evento desconhecido'
      });
    });
    
    return Array.from(pedidosMap.values());
  }, [pedidos, pedidoItens, itens, eventos]);

  useEffect(() => {
    if (!userId) return;

    const fetchPedidos = async () => {
      setLoading(true);

      try {
        // Buscar pedidos
        const { data: pedidosData, error: pedidosError } = await supabase
          .from('pedidos')
          .select('id, numero_diario, estado_validade, criado_em, id_evento')
          .eq('registado_por', userId)
          .eq('estado_validade', 'Confirmado')
          .order('criado_em', { ascending: false });

        if (pedidosError || !pedidosData?.length) {
          setLoading(false);
          return;
        }

        setPedidos(pedidosData);

        // Batch fetch all related data
        const [eventosResponse, pedidoItensResponse] = await Promise.all([
          supabase
            .from('eventos')
            .select('id, nome')
            .in('id', [...new Set(pedidosData.map(p => p.id_evento))]),
          supabase
            .from('pedidos_itens')
            .select('id, pedido_id, item_id, quantidade')
            .in('pedido_id', pedidosData.map(p => p.id))
        ]);

        // Set eventos
        if (eventosResponse.data) {
          const eventosMap = new Map(eventosResponse.data.map(e => [e.id, e.nome]));
          setEventos(eventosMap);
        }

        // Set pedido itens and fetch item details
        if (pedidoItensResponse.data) {
          setPedidoItens(pedidoItensResponse.data);

          const { data: itensData } = await supabase
            .from('itens')
            .select('id, nome, preco')
            .in('id', [...new Set(pedidoItensResponse.data.map(pi => pi.item_id))]);

          if (itensData) {
            setItens(itensData);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar pedidos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPedidos();
  }, [userId]);

  return { processedPedidos, itens, loading };
};

const useToast = () => {
  const [toast, setToast] = useState<Toast>({
    message: '',
    type: 'success',
    visible: false
  });

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type, visible: true });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }));
  }, []);

  return { toast, showToast, hideToast };
};

// Hook customizado para gerenciar o formulário de edição
function useProfileForm(initialProfile: Profile, initialEmail: string) {
  const [formData, setFormData] = useState<FormData>({
    nome: '',
    email: '',
    telemovel: ''
  });
  const [loading, setLoading] = useState(false);

  // Atualizar formData quando os dados iniciais mudarem
  useEffect(() => {
    setFormData({
      nome: initialProfile.nome,
      email: initialEmail,
      telemovel: initialProfile.telemovel
    });
  }, [initialProfile, initialEmail]);

  const updateField = useCallback(<K extends keyof FormData>(
    field: K,
    value: FormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      nome: initialProfile.nome,
      email: initialEmail,
      telemovel: initialProfile.telemovel
    });
  }, [initialProfile, initialEmail]);

  return {
    formData,
    loading,
    setLoading,
    updateField,
    resetForm,
  };
}

// Validações
function validateForm(formData: FormData): string | null {
  const { nome, email, telemovel } = formData;

  if (!nome.trim() || !email.trim()) {
    return ERROR_MESSAGES.CAMPOS_OBRIGATORIOS;
  }

  // Validação básica de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return ERROR_MESSAGES.EMAIL_INVALIDO;
  }

  // Validação básica de telemóvel (se preenchido)
  if (telemovel && !/^\d{9}$/.test(telemovel.replace(/\s+/g, ''))) {
    return ERROR_MESSAGES.TELEMOVEL_INVALIDO;
  }

  return null;
}

// Components
const ProfileField = ({ 
  label, 
  value, 
  readOnly = false 
}: {
  label: string;
  value: string;
  readOnly?: boolean;
}) => (
  <div className="flex flex-col">
    <label className="text-sm text-gray-600">{label}</label>
    <span className={`${readOnly ? 'text-sm text-gray-400 bg-[rgba(3,98,76,0.05)] rounded-lg p-2' : 'text-sm text-gray-600'}`}>
      {value || '—'}
    </span>
  </div>
);

// Componente de Timeline de Pedidos com funcionalidade expansível
const PedidoTimelineItem = ({ 
  pedido,
  itens,
  isLast = false
}: {
  pedido: any;
  itens: Item[];
  isLast?: boolean;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  // Calcular a altura real do conteúdo quando expande
  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [isExpanded, pedido.itens]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-PT', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="relative">
      <div className="flex flex-row items-start border-b border-gray-200 last:border-b-0">
        {/* Linha vertical */}
        {!isLast && (
          <div className="absolute left-6 top-8 w-0.5 h-full bg-[rgba(3,98,76,0.2)] z-0"></div>
        )}
        
        {/* Círculo do estado */}
        <div className="flex items-center justify-center p-1 rounded-full relative z-10">
          <MdOutlineFiberNew size={40} className='text-[#2A4759]'/>
        </div>
        
        {/* Conteúdo do pedido */}
        <div className="flex-1 rounded-lg px-3">
          {/* Header clicável */}
          <div 
            className='flex flex-row justify-between items-center cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors'
            onClick={toggleExpanded}
          >
            <div className='flex flex-col justify-between items-start'>
              <h3 className="font-semibold text-[#032221] text-base">
                Pedido #{pedido.numero_diario}
              </h3>
              <p className="text-sm font-normal text-gray-500">
                {formatDate(pedido.criado_em)} às {formatTime(pedido.criado_em)}
              </p>
            </div>
            <div className='flex flex-row items-center gap-4'>
              <div className='flex flex-col justify-between items-end'>
                <span className="flex flex-row gap-1 items-center text-[#A4B465] text-sm font-medium rounded-full">
                  <IoCheckmarkDoneOutline size='14'/>
                  {pedido.estado_validade}
                </span>
                <p className="text-sm">
                  <span className="font-semibold text-sm text-[#032221]">Evento:</span> {pedido.eventoNome}
                </p>
              </div>
              <div className="text-[#032221]">
                {isExpanded ? <IoChevronUp size={20} /> : <IoChevronDown size={20} />}
              </div>
            </div>
          </div>
          
          {/* Conteúdo expansível com altura dinâmica */}
          <div 
            className="overflow-hidden transition-all duration-300 ease-in-out"
            style={{ 
              maxHeight: isExpanded ? `${contentHeight}px` : '0px',
              opacity: isExpanded ? 1 : 0
            }}
          >
            <div ref={contentRef} className="p-4 rounded-lg mt-2">
              <div className="space-y-2">
                <div className="border-t border-gray-300 pt-2">
                  <p className="font-medium text-gray-700 text-sm mb-2">Itens:</p>
                  <ul className="space-y-1">
                    {pedido.itens.map((pi: any) => {
                      const item = itens.find(i => i.id === pi.item_id);
                      return (
                        <li key={pi.id} className="flex justify-between text-sm text-gray-600">
                          <span>{item?.nome ?? 'Item desconhecido'} × {pi.quantidade}</span>
                          <span>€{((item?.preco ?? 0) * pi.quantidade).toFixed(2)}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                
                <div className="border-t border-gray-300 pt-2 flex justify-between items-center">
                  <span className="font-semibold text-[#032221]">Total:</span>
                  <span className="font-bold text-[#032221] text-lg">€{pedido.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente do Dialog de Edição
const EditProfileDialog = ({ 
  user, 
  profile, 
  email, 
  originalEmail, 
  onProfileUpdate 
}: {
  user: any;
  profile: Profile;
  email: string;
  originalEmail: string;
  onProfileUpdate: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const {
    formData,
    loading,
    setLoading,
    updateField,
    resetForm,
  } = useProfileForm(profile, email);

  // Handler para salvar o perfil
  const handleSaveProfile = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validação
      const validationError = validateForm(formData);
      if (validationError) {
        sonnerToast.error(validationError);
        return;
      }

      if (!user?.id) {
        sonnerToast.error(ERROR_MESSAGES.UTILIZADOR_NAO_AUTENTICADO);
        return;
      }

      const telemovelValue = formData.telemovel ? Number(formData.telemovel) : null;

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({ 
          nome: formData.nome.trim(), 
          telemovel: telemovelValue 
        })
        .eq('id', user.id);

      if (error) throw error;

      // Update email if changed
      if (formData.email !== originalEmail) {
        const { error: emailError } = await supabase.auth.updateUser(
          { email: formData.email },
          { emailRedirectTo: 'http://localhost:3000/confirmar-email' }
        );

        if (emailError) throw emailError;

        sonnerToast.success(
          'Perfil atualizado com sucesso. Verifica ambas as caixas de email para confirmar a alteração.'
        );
      } else {
        sonnerToast.success('Perfil atualizado com sucesso!');
      }

      // Fechar dialog e atualizar dados
      setOpen(false);
      onProfileUpdate();

    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : ERROR_MESSAGES.ERRO_INESPERADO;
      
      console.error('Erro ao atualizar perfil:', error);
      sonnerToast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [formData, user, originalEmail, setLoading, onProfileUpdate]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open, resetForm]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <CiEdit
          size={36}
          className="bg-[#032221]/10 text-[#032221] p-2 rounded-xl cursor-pointer transition hover:bg-[#032221]/15"
        />
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-[#FFFDF6]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-[#032221]">
            Editar Perfil
          </DialogTitle>
          <DialogDescription className="text-[#032221]/70">
            Atualize as suas informações pessoais
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSaveProfile} className="space-y-4">
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
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telemovel" className="text-sm font-medium text-[#032221]">
              Telemóvel
            </Label>
            <Input
              type="tel"
              id="telemovel"
              value={formData.telemovel}
              onChange={(e) => updateField('telemovel', e.target.value)}
              className="border-[#032221] focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus:shadow-none"
              placeholder="912345678"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#032221]">
              Tipo de Utilizador
            </Label>
            <div className="text-sm text-gray-400 bg-[rgba(3,98,76,0.05)] rounded-lg p-2">
              {profile.tipo || '—'}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="botaocancelar"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="botaoguardar"
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

//Componente Principal
export default function EditarPerfilCard() {
  const [searchTerm, setSearchTerm] = useState('');
  const { user, loading: userLoading } = useUser();
  const { 
    profile, 
    setProfile, 
    email, 
    setEmail, 
    originalEmail, 
    setOriginalEmail, 
    loading: profileLoading 
  } = useProfile(user?.id);
  const { 
    processedPedidos, 
    itens,
    loading: pedidosLoading 
  } = usePedidos(user?.id);
  const { toast, showToast, hideToast } = useToast();

  // Initialize email when user is loaded
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
      setOriginalEmail(user.email);
    }
  }, [user, setEmail, setOriginalEmail]);

  // Filtrar pedidos baseado na pesquisa
  const filteredPedidos = useMemo(() => {
    if (!searchTerm) return processedPedidos;
    return processedPedidos.filter(pedido => 
      pedido.numero_diario.toString().includes(searchTerm) ||
      pedido.eventoNome.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [processedPedidos, searchTerm]);

  // Função para recarregar os dados do perfil
  const handleProfileUpdate = useCallback(() => {
    // Força recarregamento dos dados do perfil
    window.location.reload();
  }, []);

  const loading = userLoading || profileLoading;

  if (loading) {
    return (
      <div className="flex justify-center items-center w-full min-h-screen bg-[#eaf2e9] p-4">
        <div className="text-[#032221]">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center w-full min-h-screen bg-[#eaf2e9] p-4">
        <div className="text-red-500">Erro ao carregar utilizador.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#eaf2e9] p-4">
      <Toaster position="bottom-right" />
      <div className="flex flex-row justify-center items-start w-full pt-2 gap-8 max-w-6xl mx-auto">
        {/* Seção do Perfil */}
        <div className="bg-[#FFFDF6] w-full max-w-md p-6 rounded-2xl shadow-lg flex flex-col gap-6 h-fit sticky top-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-[#032221]">Perfil</h1>
            <EditProfileDialog
              user={user}
              profile={profile}
              email={email}
              originalEmail={originalEmail}
              onProfileUpdate={handleProfileUpdate}
            />
          </div>

          <div className="flex flex-col gap-4">
            <ProfileField label="Nome" value={profile.nome} />
            <ProfileField label="Email" value={email} />
            <ProfileField label="Telemóvel" value={profile.telemovel} />
            <ProfileField label="Tipo de Utilizador" value={profile.tipo} readOnly />
          </div>
        </div>

        {/* Seção dos Pedidos - Timeline */}
        {!pedidosLoading && processedPedidos.length > 0 && (
          <div className="bg-[#FFFDF6] w-full max-w-2xl rounded-2xl shadow-lg flex flex-col">
            {/* Header da Timeline */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-[#032221]">Os Meus Pedidos</h2>
                <span className="text-sm text-gray-500">
                  {filteredPedidos.length} pedido{filteredPedidos.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              {/* Barra de pesquisa */}
              <div className='flex items-center gap-3 bg-[#FFFDF6] px-3 py-2 rounded-lg shadow-sm border border-gray-200'>
                <GoSearch size={20} className="text-gray-400"/>
                <input
                  type="text"
                  placeholder="Pesquisar por nº de pedido ou evento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full focus:outline-none text-gray-700"
                />
              </div>
            </div>

            {/* Timeline dos Pedidos com altura dinâmica */}
            <div className="p-6" style={{ maxHeight: 'calc(100vh - 12rem)' }}>
              {filteredPedidos.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  {searchTerm ? 'Nenhum pedido encontrado para a pesquisa.' : 'Nenhum pedido confirmado encontrado.'}
                </div>
              ) : (
                <div className="space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 16rem)' }}>
                  {filteredPedidos.map((pedido, index) => (
                    <PedidoTimelineItem
                      key={pedido.id}
                      pedido={pedido}
                      itens={itens}
                      isLast={index === filteredPedidos.length - 1}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <Toast
          message={toast.message}
          visible={toast.visible}
          onClose={hideToast}
          type={toast.type}
        />
      </div>
    </div>
  );
}