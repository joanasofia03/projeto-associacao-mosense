'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { CiEdit } from 'react-icons/ci';
import { supabase } from '../../../../lib/supabaseClient';
import Toast from '../../components/toast';

//Import de icons
import { GoSearch } from "react-icons/go";

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
        setProfile(data);
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
          .eq('estado_validade', 'Confirmado');

        if (pedidosError || !pedidosData?.length) {
          setLoading(false);
          return;
        }

        setPedidos(pedidosData);

        // Buscar eventos únicos
        const eventoIds = [...new Set(pedidosData.map(p => p.id_evento))];
        const { data: eventosData } = await supabase
          .from('eventos')
          .select('id, nome')
          .in('id', eventoIds);

        if (eventosData) {
          const eventosMap = new Map(eventosData.map(e => [e.id, e.nome]));
          setEventos(eventosMap);
        }

        // Buscar itens dos pedidos
        const pedidoIds = pedidosData.map(p => p.id);
        const { data: pedidoItensData } = await supabase
          .from('pedidos_itens')
          .select('id, pedido_id, item_id, quantidade')
          .in('pedido_id', pedidoIds);

        if (pedidoItensData) {
          setPedidoItens(pedidoItensData);

          // Buscar detalhes dos itens
          const itemIds = [...new Set(pedidoItensData.map(pi => pi.item_id))];
          const { data: itensData } = await supabase
            .from('itens')
            .select('id, nome, preco')
            .in('id', itemIds);

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

  return { pedidos, pedidoItens, itens, eventos, loading };
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

// Components
const ProfileField = ({ 
  label, 
  value, 
  isEditing, 
  type = 'text',
  onChange,
  readOnly = false 
}: {
  label: string;
  value: string;
  isEditing: boolean;
  type?: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
}) => (
  <div className="flex flex-col">
    <label className="text-sm text-gray-600">{label}</label>
    {isEditing && !readOnly ? (
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="mt-1 p-2 rounded-lg border border-gray-300 bg-white focus:outline-none"
      />
    ) : (
      <span className={`${readOnly ? 'text-sm text-gray-400 bg-[rgba(3,98,76,0.05)] rounded-lg p-2' : isEditing ? 'text-lg font-semibold text-[#032221]' : 'text-sm text-gray-600'}`}>
        {value || '—'}
      </span>
    )}
  </div>
);

const PedidoCard = ({ 
  pedido, 
  itensDoPedido, 
  itens, 
  eventoNome 
}: {
  pedido: Pedido;
  itensDoPedido: PedidoItem[];
  itens: Item[];
  eventoNome: string;
}) => {
  const totalPedido = useMemo(() => 
    itensDoPedido.reduce((acc, pi) => {
      const item = itens.find(i => i.id === pi.item_id);
      return acc + (item?.preco || 0) * pi.quantidade;
    }, 0), [itensDoPedido, itens]
  );

  return (
    <div className="bg-[#FFFDF6] border rounded-lg shadow p-4 space-y-2 w-full">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-[#032221]">
          Pedido #{pedido.numero_diario}
        </h3>
        <span className="text-xs text-gray-500">
          {new Date(pedido.criado_em).toLocaleDateString()}
        </span>
      </div>
      <p className="text-sm text-gray-600">Evento: {eventoNome}</p>
      <ul className="list-disc ml-5 text-sm text-gray-700">
        {itensDoPedido.map(pi => {
          const item = itens.find(i => i.id === pi.item_id);
          return (
            <li key={pi.id}>
              {item?.nome ?? 'Item desconhecido'} — {pi.quantidade} × €
              {item?.preco?.toFixed(2) ?? '0.00'}
            </li>
          );
        })}
      </ul>
      <div className="text-sm font-semibold text-[#032221]">
        Total: €{totalPedido.toFixed(2)}
      </div>
    </div>
  );
};

//Componente Principal
export default function EditarPerfilCard() {
  const [isEditing, setIsEditing] = useState(false);
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
    pedidos, 
    pedidoItens, 
    itens, 
    eventos, 
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

  const handleSave = useCallback(async () => {
    if (!user?.id) {
      showToast('Utilizador não autenticado.', 'error');
      return;
    }

    const telemovelValue = profile.telemovel ? Number(profile.telemovel) : null;

    try {
      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({ 
          nome: profile.nome, 
          telemovel: telemovelValue 
        })
        .eq('id', user.id);

      if (error) throw error;

      // Update email if changed
      if (email !== originalEmail) {
        const { error: emailError } = await supabase.auth.updateUser(
          { email },
          { emailRedirectTo: 'http://localhost:3000/confirmar-email' }
        );

        if (emailError) throw emailError;

        showToast(
          'Perfil atualizado com sucesso. Verifica ambas as caixas de email para confirmar a alteração.',
          'success'
        );
      } else {
        showToast('Perfil atualizado com sucesso.', 'success');
      }

      setOriginalEmail(email);
      setIsEditing(false);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      showToast('Erro ao atualizar perfil.', 'error');
    }
  }, [user, profile, email, originalEmail, showToast, setOriginalEmail]);

  const handleCancel = useCallback(() => {
    setEmail(originalEmail);
    setIsEditing(false);
  }, [originalEmail, setEmail]);

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
    <div className="flex justify-center items-center w-full min-h-screen bg-[#eaf2e9] p-4 gap-15">
      <div className="bg-[#FFFDF6] w-full max-w-md p-6 rounded-2xl shadow-lg flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-[#032221]">Perfil</h1>
          {!isEditing && (
            <CiEdit
              size={36}
              className="bg-gray-200 text-[#032221] p-2 rounded-xl cursor-pointer transition hover:bg-gray-300"
              onClick={() => setIsEditing(true)}
            />
          )}
        </div>

        <div className="flex flex-col gap-4">
          <ProfileField
            label="Nome"
            value={profile.nome}
            isEditing={isEditing}
            onChange={(value) => setProfile(prev => ({ ...prev, nome: value }))}
          />

          <ProfileField
            label="Email"
            value={email}
            isEditing={isEditing}
            type="email"
            onChange={setEmail}
          />

          <ProfileField
            label="Telemóvel"
            value={profile.telemovel}
            isEditing={isEditing}
            type="tel"
            onChange={(value) => setProfile(prev => ({ ...prev, telemovel: value }))}
          />

          <ProfileField
            label="Tipo de Utilizador"
            value={profile.tipo}
            isEditing={isEditing}
            readOnly
          />
        </div>

        {isEditing && (
          <div className="flex justify-end gap-2">
            <button
              onClick={handleCancel}
              className="px-4 py-2 rounded-lg bg-gray-200 text-[#032221] font-medium hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg bg-[#032221] text-[#FFFDF6] font-medium hover:bg-[#052e2d] transition-colors"
            >
              Guardar
            </button>
          </div>
        )}
      </div>

      {!pedidosLoading && pedidos.length > 0 && (
        <div className="flex flex-col mt-2 w-full max-w-md space-y-4">
          <div className='h-10 p-4 mr-4 flex justify-between gap-1 items-center bg-[#FFFDF6] w-full rounded-lg shadow-[1px_1px_3px_rgba(3,34,33,0.1)]'>
            <GoSearch size={20}/>
            <input
              type="text"
              placeholder="Pesquisar pelo nº de pedido"
              className="w-full p-2 focus:outline-none text-lg text-gray-500 transition-all duration-300 ease-in-out"
            />
          </div>
          <h2 className="text-lg font-bold text-[#032221]">Os Meus Pedidos Confirmados</h2>
          {pedidos.map(pedido => {
            const itensDoPedido = pedidoItens.filter(pi => pi.pedido_id === pedido.id);
            const eventoNome = eventos.get(pedido.id_evento) || 'Evento desconhecido';
            
            return (
              <PedidoCard
                key={pedido.id}
                pedido={pedido}
                itensDoPedido={itensDoPedido}
                itens={itens}
                eventoNome={eventoNome}
              />
            );
          })}
        </div>
      )}

      <Toast
        message={toast.message}
        visible={toast.visible}
        onClose={hideToast}
        type={toast.type}
      />
    </div>
  );
}