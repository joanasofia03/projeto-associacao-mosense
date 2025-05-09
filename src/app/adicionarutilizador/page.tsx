'use client';

import { useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { VerificacaoDePermissoes } from '../components/VerificacaoDePermissoes';
import { FaUserPlus } from 'react-icons/fa';

function AdicionarUtilizador() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tipo, setTipo] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setMensagemSucesso(null);

    if (password !== confirmPassword) {
      setErro('As palavras-passe não coincidem.');
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome,
            tipo,
            aceitou_TU_e_PP: 'sim',
          },
        },
      });

      if (error) {
        setErro('Erro ao criar o utilizador.');
        console.error(error.message);
        return;
      }

      const user = data?.user;

      if (!user) {
        setErro('Utilizador criado, mas não foi possível obter o ID.');
        return;
      }

      setMensagemSucesso('Utilizador criado com sucesso! Verifique o e-mail do utilizador para confirmar o registo.');
      setNome('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setTipo('');
    } catch (err) {
      setErro('Erro desconhecido ao tentar criar o utilizador.');
      console.error(err);
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-[#eaf2e9] px-4">
      <div className="w-full max-w-lg rounded-2xl bg-[#f1f6f7] text-[#032221] shadow-md p-10">
        <h1 className="text-2xl font-semibold mb-6">Adicionar Utilizador</h1>

        {erro && <p className="text-red-500 text-sm mb-4">{erro}</p>}
        {mensagemSucesso && <p className="text-green-600 text-sm mb-4">{mensagemSucesso}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="nome" className="block mb-1 text-sm font-medium">Nome</label>
            <input
              type="text"
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full border border-[#032221] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block mb-1 text-sm font-medium">E-mail</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-[#032221] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block mb-1 text-sm font-medium">Palavra-passe</label>
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
            <label htmlFor="confirmPassword" className="block mb-1 text-sm font-medium">Confirmar palavra-passe</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-[#032221] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
              required
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">Tipo de Utilizador</label>
            <div className="flex justify-between gap-2">
              {['Administrador', 'Funcionario de Banca', 'Cliente'].map((opcao) => (
                <button
                  key={opcao}
                  type="button"
                  onClick={() => setTipo(opcao)}
                  className={`flex-1 px-3 py-1 text-sm rounded-full border transition-all
                    ${tipo === opcao
                      ? 'bg-[#032221] text-white border-[#032221]'
                      : 'bg-white text-[#032221] border-gray-300 hover:bg-gray-100'}`}
                >
                  {opcao}
                </button>
              ))}
            </div>
          </div>

          <p className="text-sm mt-2">
            Ao criar uma conta está automaticamente a concordar com os{' '}
            <a href="/termsofuseprivacypolicy" className="underline text-[#064e3b] hover:text-[#043d2c]">
              Termos de Utilização e Política de Privacidade
            </a>.
          </p>

          <button
            type="submit"
            className="w-full py-2 rounded flex items-center justify-center gap-2 hover:opacity-90"
            style={{
              backgroundColor: '#032221',
              color: '#f1f7f6',
            }}
          >
            Adicionar Utilizador
            <FaUserPlus size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}

export default VerificacaoDePermissoes(AdicionarUtilizador, ['Administrador']);
