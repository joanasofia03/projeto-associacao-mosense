'use client';

import { useEffect, useRef, useState } from 'react';
import { CiEdit } from 'react-icons/ci';
import { supabase } from '../../../../lib/supabaseClient';
import Toast from '../../components/toast';

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


export default function EditarPerfilCard() {
  const [isEditing, setIsEditing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telemovel, setTelemovel] = useState('');
  const [tipo, setTipo] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [pedidoItens, setPedidoItens] = useState<PedidoItem[]>([]);
  const [itens, setItens] = useState<Item[]>([]);
  const eventosMap = useRef(new Map<number, string>());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        showToast('Erro ao obter utilizador autenticado.', 'error');
        setLoading(false);
        return;
      }

      setUserId(user.id);
      setEmail(user.email || '');
      setOriginalEmail(user.email || '');

      const { data: perfil, error: perfilError } = await supabase
        .from('profiles')
        .select('nome, tipo, telemovel')
        .eq('id', user.id)
        .single();

      if (perfilError) {
        showToast('Erro ao carregar os dados do perfil.', 'error');
        setLoading(false);
        return;
      }

      setNome(perfil.nome || '');
      setTipo(perfil.tipo || '');
      setTelemovel(perfil.telemovel || '');

      const { data: pedidosData, error: pedidosError } = await supabase
        .from('pedidos')
        .select('id, numero_diario, estado_validade, criado_em, id_evento')
        .eq('registado_por', user.id)
        .eq('estado_validade', 'Confirmado');

      if (pedidosError || !pedidosData) {
        showToast('Erro ao buscar pedidos.', 'error');
        console.error('Erro ao buscar pedidos:', pedidosError);
        setLoading(false);
        return;
      }
      console.log('pedidosData:', pedidosData);

      const pedidoIds = pedidosData.map(p => p.id);

      if (pedidoIds.length === 0) {
        return;
      }

      setPedidos(pedidosData);

          const eventoIdsUnicos = [...new Set(pedidosData.map(p => p.id_evento))];

      const { data: eventosData, error: eventosError } = await supabase
        .from('eventos')
        .select('id, nome')
        .in('id', eventoIdsUnicos);

      if (eventosError || !eventosData) {
        showToast('Erro ao buscar eventos.', 'error');
        console.error('Erro ao buscar eventos:', eventosError);
        return;
      }

      eventosData.forEach(evento => {
        eventosMap.current.set(evento.id, evento.nome);
      });

      const { data: pedidoItensData, error: piError } = await supabase
        .from('pedidos_itens')
        .select('id, pedido_id, item_id, quantidade')
        .in('pedido_id', pedidoIds);

      if (piError || !pedidoItensData) {
        showToast('Erro ao buscar itens do pedido.', 'error');
        console.error('Erro ao buscar pedidos_itens');
        return;
      }

      setPedidoItens(pedidoItensData);

            const itemIdsUnicos = [
        ...new Set(pedidoItensData.map((pi: PedidoItem) => pi.item_id)),
      ];

      const { data: itensData, error: itensError } = await supabase
        .from('itens')
        .select('id, nome, preco')
        .in('id', itemIdsUnicos);

      if (itensError || !itensData) {
        console.error('Erro ao buscar itens');
        return;
      }

        setItens(itensData);
        setLoading(false);
      }

      fetchUser();
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const handleGuardar = async () => {
    if (!userId) {
      showToast('Utilizador não autenticado.', 'error');
      return;
    }

    const telemovelValue = telemovel ? Number(telemovel) : null;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ nome, telemovel: telemovelValue })
        .eq('id', userId);

      if (error) {
        console.error(error);
        showToast('Erro ao atualizar perfil.', 'error');
        return;
      }

      if (email !== originalEmail) {
        const { error: emailError } = await supabase.auth.updateUser(
          { email },
          { emailRedirectTo: 'http://localhost:3000/confirmar-email' }
        );

        if (emailError) {
          console.error(emailError);
          showToast('Erro ao atualizar email.', 'error');
          return;
        }

        showToast(
          'Perfil atualizado com sucesso. Verifica ambas as caixas de email para confirmar a alteração.',
          'success'
        );
      } else {
        showToast('Perfil atualizado com sucesso.', 'success');
      }

      setIsEditing(false);
    } catch (err) {
      console.error(err);
      showToast('Erro ao atualizar perfil.', 'error');
    }
  };

  return (
    <div className="flex justify-center items-center w-full min-h-screen bg-[#eaf2e9] p-4">
      <div className="bg-[#FFFDF6] w-full max-w-md p-6 rounded-2xl shadow-lg flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-[#032221]">Perfil</h1>
          {!isEditing && (
            <CiEdit
              size={36}
              className="bg-gray-200 text-[#032221] p-2 rounded-xl cursor-pointer transition"
              onClick={() => setIsEditing(true)}
            />
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col">
            <label className="text-sm text-gray-600">Nome</label>
            {isEditing ? (
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="mt-1 p-2 rounded-lg border border-gray-300 bg-white focus:outline-none"
              />
            ) : (
              <span className="text-lg font-semibold text-[#032221]">{nome}</span>
            )}
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-gray-600">Email</label>
            {isEditing ? (
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 p-2 rounded-lg border border-gray-300 bg-white focus:outline-none"
              />
            ) : (
              <span className="text-sm text-gray-600">{email}</span>
            )}
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-gray-600">Telemóvel</label>
            {isEditing ? (
              <input
                type="tel"
                value={telemovel}
                onChange={(e) => setTelemovel(e.target.value)}
                className="mt-1 p-2 rounded-lg border border-gray-300 bg-white focus:outline-none"
              />
            ) : (
              <span className="text-sm text-gray-600">{telemovel || '—'}</span>
            )}
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-gray-600">Tipo de Utilizador</label>
            <span className="text-sm text-gray-400 bg-[rgba(3,98,76,0.05)] rounded-lg p-2">
              {tipo || '—'}
            </span>
          </div>
        </div>

        {isEditing && (
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-lg bg-gray-200 text-[#032221] font-medium hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardar}
              className="px-4 py-2 rounded-lg bg-[#032221] text-[#FFFDF6] font-medium hover:bg-[#052e2d]"
            >
              Guardar
            </button>
          </div>
        )}
      </div>

  {!loading && pedidos.length > 0 && (
  <div className="mt-10 w-full max-w-md space-y-4">
    <h2 className="text-lg font-bold text-[#032221]">Os Meus Pedidos Confirmados</h2>

    {pedidos.map((pedido) => {
      const itensDoPedido = pedidoItens.filter((pi) => pi.pedido_id === pedido.id);
      const totalPedido = itensDoPedido.reduce((acc, pi) => {
        const item = itens.find((i) => i.id === pi.item_id);
        return acc + (item?.preco || 0) * pi.quantidade;
      }, 0);

      const eventoNome = eventosMap.current.get(pedido.id_evento) || 'Evento desconhecido';

      return (
        <div
          key={pedido.id}
          className="bg-white border rounded-lg shadow p-4 space-y-2"
        >
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
            {itensDoPedido.map((pi) => {
              const item = itens.find((i) => i.id === pi.item_id);
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
    })}
  </div>
)}

      <Toast
        message={toastMessage}
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
        type={toastType}
      />
    </div>
  );
}
