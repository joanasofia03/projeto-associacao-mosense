'use client';

import { useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';

export default function EsqueciPassword() {
  const [email, setEmail] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');

const handleReset = async (e: React.FormEvent) => {
  e.preventDefault();
  setMensagem('');
  setErro('');

  // Verifica se o utilizador existe
  const { data: exists, error: checkError } = await supabase.rpc('check_user_exists', {
    email_to_check: email,
  });

  if (checkError || !exists) {
    setErro('Este e-mail não está associado a nenhuma conta.');
    return;
  }

  // Envia o e-mail de recuperação
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'http://localhost:3000/reset-password',
  });

  if (error) {
    setErro('Erro ao enviar email de recuperação.');
  } else {
    setMensagem('Verifica o teu email para redefinir a palavra-passe.');
    setEmail('');
  }
};


  return (
    <div className="w-full overflow-hidden flex items-center justify-center flex-col bg-[#eaf2e9] min-h-screen">
      <div className="w-full max-w-lg rounded-2xl bg-[#f1f6f7] text-[#032221] shadow-md p-10">
        <h1 className="text-2xl text-[#032221] font-semibold mb-6">Recuperar Palavra-passe</h1>

        {mensagem && <p className="text-green-600 text-sm mb-4">{mensagem}</p>}
        {erro && <p className="text-red-500 text-sm mb-4">{erro}</p>}

        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label htmlFor="email" className="block mb-1 text-sm font-medium text-[#032221]">
              E-mail
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-[#032221] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 rounded flex items-center justify-center gap-2 hover:opacity-90"
            style={{
              backgroundColor: '#032221',
              color: '#f1f7f6',
            }}
          >
            Enviar link de recuperação
          </button>
        </form>
      </div>
    </div>
  );
}
