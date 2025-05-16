'use client';

import { useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import Toast from '../components/toast';

export default function EsqueciPassword() {
  const [email, setEmail] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setToastVisible(false);

    // Verifica se o utilizador existe
    const { data: exists, error: checkError } = await supabase.rpc('check_user_exists', {
      email_to_check: email,
    });

    if (checkError || !exists) {
      setToastMessage('Este e-mail não está associado a nenhuma conta.');
      setToastType('error');
      setToastVisible(true);
      return;
    }

    // Envia o e-mail de recuperação
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:3000/reset-password',
    });

    if (error) {
      setToastMessage('Erro ao enviar email de recuperação.');
      setToastType('error');
    } else {
      setToastMessage('Verifica o teu email para redefinir a palavra-passe.');
      setToastType('success');
      setEmail('');
    }

    setToastVisible(true);
  };

  return (
    <div className="w-full overflow-hidden flex items-center justify-center flex-col bg-[#eaf2e9] min-h-screen">
      <div className="w-full max-w-lg rounded-2xl bg-[#f1f6f7] text-[#032221] shadow-md p-10">
        <h1 className="text-2xl text-[#032221] font-semibold mb-6">Recuperar Palavra-passe</h1>

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
              className="w-full border border-[#032221] rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#032221]"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 rounded flex items-center rounded-lg justify-center gap-2 bg-[#032221] text-[#FFFDF6] hover:bg-[#052e2d]"
          >
            Enviar link de recuperação
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
