'use client';

import { useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import Toast from '../components/toast';
import { VerificacaoDePermissoes } from '../components/VerificacaoDePermissoes';

function AdicionarEvento() {
  const [nome, setNome] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [emExecucao, setEmExecucao] = useState(false);
  const [loading, setLoading] = useState(false);

  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const handleAddEvento = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setToastVisible(false);

    try {
      const { data: existingEventos, error: checkError } = await supabase
        .from('eventos')
        .select('id')
        .ilike('nome', nome.trim());

      if (checkError) {
        showToast('Erro ao verificar eventos existentes.', 'error');
        setLoading(false);
        return;
      }

      if (existingEventos && existingEventos.length > 0) {
        showToast('Já existe um evento com esse nome.', 'error');
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase.from('eventos').insert([
        {
          nome: nome.trim(),
          data_inicio: dataInicio,
          data_fim: dataFim,
          em_execucao: emExecucao,
        },
      ]);

      if (insertError) {
        if (insertError.message.includes('unico_evento_em_execucao')) {
          showToast('Já existe um evento em execução. Finalize-o antes de adicionar outro.', 'error');
        } else {
          showToast('Erro ao adicionar o evento.', 'error');
        }
        console.error(insertError.message);
        setLoading(false);
        return;
      }

      showToast('Evento adicionado com sucesso!', 'success');
      setNome('');
      setDataInicio('');
      setDataFim('');
      setEmExecucao(false);
    } catch (err) {
      console.error('Erro inesperado:', err);
      showToast('Erro inesperado.', 'error');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#eaf2e9]">
      <div className="w-full max-w-md bg-[#FFFDF6] rounded-lg p-8 shadow-[1px_1px_3px_rgba(3,34,33,0.1)]">
        <h1 className="text-2xl font-semibold mb-4 text-[#032221]">Adicionar Evento</h1>

        <form onSubmit={handleAddEvento} className="space-y-4">
          <div>
            <label htmlFor="nome" className="block text-sm font-medium text-[#032221]">
              Nome do Evento
            </label>
            <input
              type="text"
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full border border-[#032221] rounded-lg px-3 py-2"
              required
            />
          </div>

          <div>
            <label htmlFor="dataInicio" className="block text-sm font-medium text-[#032221]">
              Data de Início
            </label>
            <input
              type="date"
              id="dataInicio"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full border border-[#032221] rounded-lg px-3 py-2"
              required
            />
          </div>

          <div>
            <label htmlFor="dataFim" className="block text-sm font-medium text-[#032221]">
              Data de Fim
            </label>
            <input
              type="date"
              id="dataFim"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-full border border-[#032221] rounded-lg px-3 py-2"
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="emExecucao"
              checked={emExecucao}
              onChange={() => setEmExecucao(!emExecucao)}
              className="w-4 h-4"
            />
            <label htmlFor="emExecucao" className="text-sm text-[#032221]">
              Evento está em execução?
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-lg bg-[#032221] text-white hover:bg-[#05403d] transition-transform ${
              loading ? 'opacity-60 cursor-not-allowed' : 'hover:scale-105'
            }`}
          >
            {loading ? 'Salvando...' : 'Adicionar Evento'}
          </button>
        </form>

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

export default VerificacaoDePermissoes(AdicionarEvento, ['Administrador']);
