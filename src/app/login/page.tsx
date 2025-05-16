'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import { CgLogIn } from "react-icons/cg";
import Toast from '../components/toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('error');

  const router = useRouter();

  const showToast = (message: string, type: 'success' | 'error') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error(error.message);
        showToast('E-mail ou palavra-passe incorretos.', 'error');
      } else {
        localStorage.setItem('session', JSON.stringify(data));
        showToast('Sessão iniciada com sucesso!', 'success');
        setTimeout(() => router.push('/welcome'), 1000); // ligeiro atraso para mostrar o toast
      }
    } catch (err) {
      showToast('Ocorreu um erro ao tentar iniciar sessão.', 'error');
    }
  };

  return (
    <div className="w-full overflow-hidden flex items-center justify-center flex-col bg-[#eaf2e9] min-h-screen">
      <div className="w-full max-w-lg rounded-2xl bg-[#FFFDF6] text-[#032221] shadow-md p-10">
        <h1 className="text-2xl text-[#032221] font-semibold mb-6">Iniciar sessão na sua conta</h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block mb-1 text-sm font-medium text-[#032221]">
              E-mail
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-[#032221] rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#032221]"
            />
          </div>

          <div>
            <label htmlFor="password" className="block mb-1 text-sm font-medium text-[#032221]">
              Palavra-passe
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-[#032221] rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#032221]"
            />
          </div>

          <p className="text-sm mt-2">
            <a href="/esquecipassword" className="underline text-[#537D5D] hover:text-[#032221]">
              Esqueci-me da palavra-passe
            </a>
          </p>

          <p className="text-sm mt-2 flex justify-center gap-1 text-gray-500">
            Não tem uma conta?{' '}
            <a href="/registar" className="underline text-[#032221] hover:text-[#052e2d]">
              Registe-se.
            </a>
          </p>

          <button
            type="submit"
            className="w-full py-2 rounded flex items-center justify-center rounded-lg gap-2 bg-[#032221] text-[#FFFDF6] hover:bg-[#052e2d]"
          >
            Entrar
            <CgLogIn size={20} />
          </button>
        </form>
      </div>

      <Toast
        message={toastMessage}
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
        type={toastType}
      />
    </div>
  );
}
