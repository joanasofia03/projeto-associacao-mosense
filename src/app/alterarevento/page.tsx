'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { VerificacaoDePermissoes } from '../components/VerificacaoDePermissoes';
import Toast from '../components/toast';

// Import de icons
import { RiDeleteBin6Line } from "react-icons/ri";
import { MdOutlineEdit, MdClose, MdSave } from "react-icons/md";

type Evento = {
  id: string;
  nome: string;
  data_inicio: string;
  data_fim: string;
  criando_em: string;
  em_execucao: boolean;
};

function AlterarEvento() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [editingEvento, setEditingEvento] = useState<Evento | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

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
      try {
        const { data, error } = await supabase
          .from('eventos')
          .select('*')
          .order('criando_em', { ascending: false });

        if (error) {
          console.error('Erro ao buscar eventos:', error);
          showToast('Erro ao carregar eventos', 'error');
        } else {
          setEventos(data || []);
        }
      } catch (err) {
        console.error('Erro inesperado ao buscar eventos:', err);
        showToast('Erro inesperado ao carregar eventos', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchEventos();
  }, []);

  const handleEditClick = (evento: Evento) => {
    setEditingEvento({ ...evento });
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    if (!editingEvento) return;
    
    setEditingEvento({ 
      ...editingEvento, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const handleSave = async () => {
    if (!editingEvento || !editingEvento.nome || !editingEvento.data_fim || !editingEvento.data_inicio) {
      showToast('Preencha todos os campos obrigatórios', 'error');
      return;
    }

    setSaving(true);

    try {
      // Verificar se o nome já existe em outro evento
      const { data: existingEvents, error: checkError } = await supabase
        .from('eventos')
        .select('id')
        .ilike('nome', editingEvento.nome.trim())
        .neq('id', editingEvento.id);

      if (checkError) {
        showToast('Erro ao verificar eventos existentes.', 'error');
        setSaving(false);
        return;
      }

      if (existingEvents && existingEvents.length > 0) {
        showToast('Já existe outro evento com esse nome.', 'error');
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from('eventos')
        .update({
          nome: editingEvento.nome.trim(),
          data_inicio: editingEvento.data_inicio,
          data_fim: editingEvento.data_fim,
          em_execucao: editingEvento.em_execucao,
        })
        .eq('id', editingEvento.id);

      if (error) {
        if (error.message.includes('unico_evento_em_execucao')) {
          showToast('Já existe um evento em execução. Finalize-o antes de marcar este como ativo.', 'error');
        } else {
          showToast('Erro ao atualizar evento', 'error');
        }
        console.error('Erro ao atualizar evento:', error);
      } else {
        setEventos(eventos.map(ev => ev.id === editingEvento.id ? { ...editingEvento } : ev));
        showToast('Evento atualizado com sucesso!', 'success');
        setIsModalOpen(false);
        setEditingEvento(null);
      }
    } catch (err) {
      console.error('Erro ao guardar evento:', err);
      showToast('Erro desconhecido ao guardar o evento', 'error');
    }

    setSaving(false);
  };

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEvento(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#eaf2e9] flex items-center justify-center">
        <div className="text-[#032221] text-xl">Carregando eventos...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#eaf2e9] px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-[#032221] text-center">
          Gerir Eventos - Edição ou Exclusão
        </h1>

        {eventos.length === 0 ? (
          <div className="bg-[#FFFDF6] rounded-lg p-8 shadow-[1px_1px_3px_rgba(3,34,33,0.1)] text-center">
            <p className="text-[#032221] text-lg">Nenhum evento encontrado.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {eventos.map((evento) => (
              <div
                key={evento.id}
                className="bg-[#FFFDF6] rounded-lg p-6 shadow-[1px_1px_3px_rgba(3,34,33,0.1)] 
                         hover:shadow-[2px_2px_6px_rgba(3,34,33,0.15)] transition-all duration-200"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-[#032221] mb-2">
                      {evento.nome}
                    </h3>
                    <div className="space-y-1 text-sm text-[#032221]/70">
                      <p>
                        <span className="font-medium">Início:</span> {formatDate(evento.data_inicio)}
                      </p>
                      <p>
                        <span className="font-medium">Fim:</span> {formatDate(evento.data_fim)}
                      </p>
                      <p>
                        <span className="font-medium">Criado em:</span> {formatDate(evento.criando_em)}
                      </p>
                    </div>
                    <div className="mt-3">
                      <span 
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          evento.em_execucao 
                            ? 'bg-[#DDEB9D] text-[#032221] font-semibold text-xs' 
                            : 'bg-[#f8d7da] text-[#032221] font-semibold text-xs'
                        }`}
                      >
                        {evento.em_execucao ? 'Em Execução' : 'Não ativo' }
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEditClick(evento)}
                      className="p-2 bg-[#DDEB9D] text-[#032221] rounded-lg hover:bg-opacity-80 
                               transition-all duration-200 hover:scale-105 flex flex-row justify-between items-center gap-1 text-base cursor-pointer"
                      title="Editar evento"
                    >Editar
                      <MdOutlineEdit size={16} /> 
                    </button>
                    <button
                      onClick={() => handleDelete(evento.id)}
                      className="p-2 bg-[rgba(210,102,90,0.12)] text-[#D2665A] rounded-lg hover:bg-[rgba(210,102,90,0.17)] 
                               transition-all duration-200 hover:scale-105 flex flex-row justify-between items-center gap-1 text-base cursor-pointer"
                      title="Excluir evento"
                    >Eliminar
                      <RiDeleteBin6Line size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de Edição */}
        {isModalOpen && editingEvento && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(234, 242, 233, 0.9)' }}>
            <div className="bg-[#FFFDF6] rounded-lg p-8 w-full max-w-md shadow-[4px_4px_12px_rgba(3,34,33,0.2)]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-[#032221]">Editar Evento</h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <MdClose size={24} className="text-[#032221]" />
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
                <div>
                  <label htmlFor="nome" className="block text-sm font-medium text-[#032221] mb-1">
                    Nome do Evento
                  </label>
                  <input
                    type="text"
                    id="nome"
                    name="nome"
                    value={editingEvento.nome}
                    onChange={handleInputChange}
                    className="w-full border border-[#032221] rounded-lg px-3 py-2 
                             focus:outline-none focus:ring-2 focus:ring-[#032221]/20"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="data_inicio" className="block text-sm font-medium text-[#032221] mb-1">
                    Data de Início
                  </label>
                  <input
                    type="date"
                    id="data_inicio"
                    name="data_inicio"
                    value={editingEvento.data_inicio}
                    onChange={handleInputChange}
                    className="w-full border border-[#032221] rounded-lg px-3 py-2 
                             focus:outline-none focus:ring-2 focus:ring-[#032221]/20"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="data_fim" className="block text-sm font-medium text-[#032221] mb-1">
                    Data de Fim
                  </label>
                  <input
                    type="date"
                    id="data_fim"
                    name="data_fim"
                    value={editingEvento.data_fim}
                    onChange={handleInputChange}
                    className="w-full border border-[#032221] rounded-lg px-3 py-2 
                             focus:outline-none focus:ring-2 focus:ring-[#032221]/20"
                    required
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="em_execucao"
                    name="em_execucao"
                    checked={editingEvento.em_execucao}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-[#032221] rounded focus:ring-[#032221]"
                  />
                  <label htmlFor="em_execucao" className="text-sm text-[#032221]">
                    Evento está em execução?
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 py-2 px-4 text-[#032221] rounded-lg cursor-pointer
                               transition-all duration-200 bg-[rgba(3,98,76,0.2)] hover:-translate-y-1"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className={`flex-1 py-2 px-4 bg-[#032221] text-[#FFFDF6] rounded-lg 
                             hover:bg-[#052e2d] transition-all duration-200 hover:-translate-y-1 
                             flex items-center justify-center gap-2 cursor-pointer ${
                               saving ? 'opacity-60 cursor-not-allowed' : ''
                             }`}
                  >
                    {saving ? (
                      'Guardando...'
                    ) : (
                      <>
                        <MdSave size={18} />
                        Guardar
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Toast */}
        <Toast
          message={toastMessage}
          visible={toastVisible}
          onClose={() => setToastVisible(false)}
          type={toastType}
        />
      </div>
    </div>
  );
}

export default VerificacaoDePermissoes(AlterarEvento, ['Administrador']);