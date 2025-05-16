'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';
import { FaUserPlus } from 'react-icons/fa';
import Toast from '../components/toast';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nome, setNome] = useState('');
  const [telemovel, setTelemovel] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const router = useRouter();

  const showToast = (message: string, type: 'success' | 'error') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      showToast('As palavras-passe não coincidem.', 'error');
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome,
            tipo: 'Cliente',
            aceitou_TU_e_PP: 'Sim',
            telemovel: telemovel ? Number(telemovel) : null,
          },
        },
      });

      if (error) {
        console.error(error.message);
        showToast('Erro ao registar. Tente novamente.', 'error');
        return;
      }

      showToast('Utilizador criado com sucesso! Verifique o seu e-mail para confirmar o registo.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Ocorreu um erro ao registar.', 'error');
    }
  };

  return (
    <div className="w-full overflow-hidden flex items-center justify-center flex-col bg-[#eaf2e9] min-h-screen">
      <div className="w-full max-w-lg rounded-2xl bg-[#FFFDF6] text-[#032221] shadow-md p-10">
        <h1 className="text-2xl text-[#032221] font-semibold mb-6">Criar uma nova conta</h1>

        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label htmlFor="nome" className="block mb-1 text-sm font-medium text-[#032221]">Nome</label>
            <input
              type="text"
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full border border-[#032221] rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#032221]"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block mb-1 text-sm font-medium text-[#032221]">E-mail</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-[#032221] rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#032221]"
              required
            />
          </div>

          <div>
            <label htmlFor="telemovel" className="block mb-1 text-sm font-medium text-[#032221]">Telemóvel (opcional)</label>
            <input
              type="tel"
              id="telemovel"
              value={telemovel}
              onChange={(e) => setTelemovel(e.target.value)}
              className="w-full border border-[#032221] rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#032221]"
              pattern="[0-9]*"
              inputMode="numeric"
            />
          </div>

          <div>
            <label htmlFor="password" className="block mb-1 text-sm font-medium text-[#032221]">Palavra-passe</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-[#032221] rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#032221]"
              required
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block mb-1 text-sm font-medium text-[#032221]">Confirmar palavra-passe</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-[#032221] rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#032221]"
              required
            />
          </div>

          <div className="text-sm text-[#032221] mt-2">
            Ao criar uma conta está automaticamente a concordar com os{' '}
            <Link href="/termsofuseprivacypolicy" className="underline text-[#3F7D58] hover:text-[#032221]">
              Termos de Utilização e Política de Privacidade
            </Link>.
          </div>

          <button
            type="submit"
            className="w-full py-2 rounded flex items-center justify-center rounded-lg gap-2 bg-[#032221] text-[#FFFDF6] hover:bg-[#052e2d]"
          >
            Registar
            <FaUserPlus size={18} />
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
