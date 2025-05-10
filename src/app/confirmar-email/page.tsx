'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';

export default function ConfirmarEmail() {
  const [status, setStatus] = useState('A verificar...');
  const [submensagem, setSubmensagem] = useState('');

  useEffect(() => {
    const verificarEmail = async () => {
      const hash = window.location.hash;
      const message = new URLSearchParams(hash.replace('#', '')).get('message');

      const { data, error } = await supabase.auth.getSession();

      if (error) {
        setStatus('Erro ao confirmar email.');
        setSubmensagem('Tente novamente ou contacte o suporte.');
        return;
      }

      if (
        message?.toLowerCase().includes('proceed to confirm link sent to the other email')
      ) {
        setStatus('Primeira confirmação concluída.');
        setSubmensagem('Por favor, confirme agora no novo email.');
        return;
      }

      if (data.session) {
        setStatus('Email confirmado com sucesso!');
        setSubmensagem('Pode fechar esta página ou continuar a usar a aplicação.');
      } else {
        setStatus('Confirmação recebida.');
        setSubmensagem('Inicie sessão para continuar.');
      }
    };

    verificarEmail();
  }, []);

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#eaf2e9] p-4">
      <div className="bg-white rounded-2xl shadow-lg p-6 text-center max-w-md w-full">
        <h1 className="text-xl font-bold text-[#032221] mb-2">Confirmação de Email</h1>
        <p className="text-[#032221] text-base">{status}</p>
        {submensagem && (
          <p className="text-sm text-gray-600 mt-2">{submensagem}</p>
        )}
      </div>
    </div>
  );
}
