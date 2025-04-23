'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';

export default function AdicionarUtilizador() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tipo, setTipo] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [temPermissao, setTemPermissao] = useState(false);

  useEffect(() => {
    const verificarPermissao = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/login');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('tipo')
        .eq('id', user.id)
        .single();

      if (error || !data || data.tipo !== 'Administrador') {
        router.replace('/');
        return;
      }

      setTemPermissao(true);
      setIsLoading(false);
    };

    verificarPermissao();
  }, [router]);

  if (isLoading) {
    return <div className="text-center mt-10">A carregar...</div>;
  }

  if (!temPermissao) {
    return null;
  }
  
  const waitForProfile = async (userId: string, attempts = 5, delay = 500) => {
    for (let i = 0; i < attempts; i++) {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      if (data) return true;
      await new Promise((res) => setTimeout(res, delay));
    }
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setMensagemSucesso(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: password,
      });

      if (error) {
        setErro('Erro ao criar o utilizador.');
        console.error(error.message);
        return;
      }

      const user = data?.user;

      if (user) {
        const ready = await waitForProfile(user.id);

        if (!ready) {
          setErro('Perfil ainda não está disponível. Tente novamente.');
          return;
        }

        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            nome: nome,
            tipo: tipo,
          })
          .eq('id', user.id);

        if (profileError) {
          setErro('Erro ao guardar utilizador.');
          console.error(profileError.message);
        } else {
          setMensagemSucesso('Utilizador criado com sucesso!');
          setTimeout(() => setMensagemSucesso(null), 3000);
          setNome('');
          setEmail('');
          setPassword('');
          setTipo('');
        }
      }
    } catch (err) {
      setErro('Erro desconhecido.');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md text-gray-800 shadow-md rounded p-8">
        <h1 className="text-2xl font-semibold mb-6">Adicionar Utilizador</h1>

        {erro && <p className="text-red-500 text-sm mb-4">{erro}</p>}

        {mensagemSucesso && (
          <div className="bg-green-500 text-white p-3 rounded mb-4">
            {mensagemSucesso}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="nome" className="block mb-1 text-sm font-medium">
              Nome
            </label>
            <input
              type="text"
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block mb-1 text-sm font-medium">
              E-mail
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block mb-1 text-sm font-medium">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
              required
            />
          </div>

          <div>
            <label htmlFor="tipo" className="block mb-1 text-sm font-medium">
              Tipo de Utilizador
            </label>
            <select
              id="tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-gray-400"
              required
            >
              <option value="">Selecione...</option>
              <option value="Administrador">Administrador</option>
              <option value="Funcionario de Banca">Funcionário de Banca</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-2 rounded hover:opacity-90"
            style={{
              backgroundColor: '#343a40',
              color: '#ffffff',
            }}
          >
            Adicionar Utilizador
          </button>
        </form>
      </div>
    </div>
  );
}
