'use client';

import { useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setMensagem('');

    if (password !== confirmPassword) {
      setErro('As palavras-passe não coincidem.');
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setErro('Erro ao atualizar a palavra-passe.');
    } else {
      setMensagem('Palavra-passe atualizada com sucesso! Já podes iniciar sessão.');
      setPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <div className="w-full overflow-hidden flex items-center justify-center flex-col bg-[#eaf2e9] min-h-screen">
      <div className="w-full max-w-lg rounded-2xl bg-[#f1f6f7] text-[#032221] shadow-md p-10">
        <h1 className="text-2xl text-[#032221] font-semibold mb-6">Definir nova palavra-passe</h1>

        {mensagem && <p className="text-green-600 text-sm mb-4">{mensagem}</p>}
        {erro && <p className="text-red-500 text-sm mb-4">{erro}</p>}

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label htmlFor="password" className="block mb-1 text-sm font-medium text-[#032221]">
              Nova palavra-passe
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-[#032221] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
              required
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block mb-1 text-sm font-medium text-[#032221]">
              Confirmar nova palavra-passe
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-[#032221] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
              required
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
            Atualizar palavra-passe
          </button>
        </form>
      </div>
    </div>
  );
}
