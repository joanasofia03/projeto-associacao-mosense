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
  const [telemovel, setTelemovel] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [opcaoSelecionada, setOpcaoSelecionada] = useState<string | null>(null);


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
            aceitou_TU_e_PP: 'Sim',
            telemovel: telemovel ? Number(telemovel) : null,
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
      setTelemovel('');
      setOpcaoSelecionada(null);
    } catch (err) {
      setErro('Erro desconhecido ao tentar criar o utilizador.');
      console.error(err);
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-[#eaf2e9] px-4">
      <div className="w-full max-w-lg rounded-2xl bg-[#FFFDF6] text-[#032221] shadow-md p-10">
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
              className="w-full border border-[#032221] rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#032221]"
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
              className="w-full border border-[#032221] rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#032221]"
              required
            />
          </div>

          <div>
            <label htmlFor="telemovel" className="block mb-1 text-sm font-medium">Telemóvel (opcional)</label>
            <input
              type="tel"
              id="telemovel"
              value={telemovel}
              onChange={(e) => setTelemovel(e.target.value)}
              className="w-full border border-[#032221] rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#032221]"
              pattern="[0-9]*"
              inputMode="numeric"
            />
          </div>

          <div>
            <label htmlFor="password" className="block mb-1 text-sm font-medium">Palavra-passe</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-[#032221] rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#032221]"
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
              className="w-full border border-[#032221] rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#032221]"
              required
            />
          </div>

          <div className='bg-[rgba(3,98,76,0.1)] w-full h-14 flex flex-row justify-between items-center rounded-3xl border border-[rgba(209,213,219,0.3)]'>
          {['Administrador', 'Funcionario de Banca', 'Cliente'].map((opcao) => (
            <h1
              key={opcao}
              onClick={() => setOpcaoSelecionada(opcao)}
              className={`text-sm font-semibold flex-1 flex items-center justify-center text-center cursor-pointer transition-transform duration-300 hover:-translate-y-1
                rounded-3xl
                ${
                  opcaoSelecionada === opcao
                    ? 'bg-[#032221] text-[#FFFDF6] h-14'
                    : 'bg-transparent text-[#032221] h-14'
                }`}
            >
              {opcao}
            </h1>
          ))}
          </div>

          <p className="text-sm mt-2">
            Ao criar uma conta está automaticamente a concordar com os{' '}
            <a href="/termsofuseprivacypolicy" className="underline text-[#3F7D58] hover:text-[#032221]">
              Termos de Utilização e Política de Privacidade
            </a>.
          </p>

          <button
            type="submit"
            className="w-full py-2 flex items-center justify-center gap-2 rounded-lg bg-[#032221] text-[#FFFDF6] hover:bg-[#052e2d] transition-transform duration-200 hover:scale-101 cursor-pointer"
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
