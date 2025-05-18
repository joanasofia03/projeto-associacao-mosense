'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { VerificacaoDePermissoes } from '../components/VerificacaoDePermissoes';
import Toast from '../components/toast';

//Import de icons
import { RiDeleteBin6Line } from "react-icons/ri";
import { MdOutlineEdit, MdKeyboardArrowDown } from "react-icons/md";

type Evento = {
  id: string;
  nome: string;
  data_inicio: string;
  data_fim: string;
  criado_em: string;
  em_execucao: string | null;
};

function AlterarEvento() {

    const [eventos, setEventos] = useState<Evento[]>([]);
    const [loading, setLoading] = useState(true);

    const [editingEvento, setEditingEvento] = useState<Evento | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [toastMessage, setToastMessage] = useState('');
    const [toastVisible, setToastVisible] = useState(false);
    const [toastType, setToastType] = useState<'success' | 'error'>('success');

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToastMessage(message);
        setToastType(type);
        setToastVisible(true);
    };

    useEffect(() => {
    const fetchEventos = async () => {
      const { data, error } = await supabase.from('eventos').select('*');

      if (error) {
        console.error('Erro ao buscar eventos:', error);
        showToast('Erro ao carregar eventos', 'error');
      } else {
        setEventos(data || []);
      }

      setLoading(false);
    };

    fetchEventos();
  }, []);

    const handleEditClick = (evento: Evento) => {
    setEditingEvento({ ...evento });
    setIsModalOpen(true);
  };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (!editingEvento) return;
    setEditingEvento({ ...editingEvento, [name]: value });
  };

  const handleSave = async () => {
    if (!editingEvento || !editingEvento.nome || !editingEvento.data_fim || !editingEvento.data_inicio) {
      showToast('Preencha todos os campos obrigatórios', 'error');
      return;
    }

    const nomeTrimmed = editingEvento.nome.trim();
    setToastVisible(false); // reset toast

    try {
        const { error } = await supabase
        .from('eventos')
        .update({
          nome: editingEvento.nome,
          data_inicio: editingEvento.data_inicio,
          data_fim: editingEvento.data_fim,
          em_execucao: editingEvento.em_execucao,
        })
        .eq('id', editingEvento.id);

      if (error) {
        console.error('Erro ao atualizar evento:', error);
        showToast('Erro ao atualizar evento', 'error');
      }

      else {
        setEventos(eventos.map(ev => ev.id === editingEvento.id ? { ...editingEvento } : ev));
        showToast('Evento atualizado com sucesso!', 'success');
        setIsModalOpen(false);
        setEditingEvento(null);
      }
    }
    catch (err) {
      console.error('Erro ao guardar evento:', err);
      showToast('Erro desconhecido ao guardar o evento', 'error');
    }

  }

    const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este evento?')) return;

    try {
      const { error } = await supabase.from('eventos').delete().eq('id', id);
      if (error) {
        showToast('Erro ao excluir evento', 'error');
      } else {
        setEventos(eventos.filter(e => e.id !== id));
        showToast('Evento excluído com sucesso!', 'success');
      }
    } catch (err) {
      showToast('Erro inesperado ao excluir', 'error');
    }
  };

  return (
<main className="h-full bg-[#eaf2e9] overflow-y-scroll">
    <div className="bg-[#eaf2e9] text-[#032221] pt-5 px-10">
  <h1 className="text-3xl font-bold mb-6 text-[#032221]">Gerir Eventos - Edição ou Exclusão</h1>
    </div>




        {/* Toast */}
        <Toast
          message={toastMessage}
          visible={toastVisible}
          onClose={() => setToastVisible(false)}
          type={toastType}
        />
</main>

  );
}

export default VerificacaoDePermissoes(AlterarEvento, ['Administrador']);