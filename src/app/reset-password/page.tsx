'use client';

import { useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import Toast from '../components/toast';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setToastVisible(false);

    if (password !== confirmPassword) {
      setToastMessage('As palavras-passe não coincidem.');
      setToastType('error');
      setToastVisible(true);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setToastMessage('Erro ao atualizar a palavra-passe.');
      setToastType('error');
    } else {
      setToastMessage('Palavra-passe atualizada com sucesso! Já podes iniciar sessão.');
      setToastType('success');
      setPassword('');
      setConfirmPassword('');
    }

    setToastVisible(true);
  };

  return (
    <div className="w-full overflow-hidden flex items-center justify-center flex-col bg-[#eaf2e9] min-h-screen">
      <div className="w-full max-w-lg rounded-2xl bg-[#f1f6f7] text-[#032221] shadow-md p-10">
        <h1 className="text-2xl text-[#032221] font-semibold mb-6">Definir nova palavra-passe</h1>

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

      {/* Toast */}
      <Toast
        message={toastMessage}
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
        type={toastType}
      />
    </div>
  );
}
