'use client';

import { useEffect, useState } from 'react';
import { CiEdit } from 'react-icons/ci';
import { supabase } from '../../../../lib/supabaseClient';

export default function EditarPerfilCard() {
  const [isEditing, setIsEditing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telemovel, setTelemovel] = useState('');
  const [tipo, setTipo] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [originalEmail, setOriginalEmail] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        setErro('Erro ao obter utilizador autenticado.');
        return;
      }

      setUserId(user.id);
      setEmail(user.email || '');
      setOriginalEmail(user.email || '');

      const { data: perfil, error: perfilError } = await supabase
        .from('profiles')
        .select('nome, tipo, telemovel')
        .eq('id', user.id)
        .single();

      if (perfilError) {
        setErro('Erro ao carregar os dados do perfil.');
        return;
      }

      setNome(perfil.nome || '');
      setTipo(perfil.tipo || '');
      setTelemovel(perfil.telemovel || '');
    };

    fetchUser();
  }, []);

  const handleGuardar = async () => {
    setErro(null);
    setSucesso(null);

    if (!userId) {
      setErro('Utilizador não autenticado.');
      return;
    }

    const telemovelValue = telemovel ? Number(telemovel) : null;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ nome, telemovel: telemovelValue })
        .eq('id', userId);

      if (error) {
        setErro('Erro ao atualizar perfil.');
        console.error(error);
        return;
      }

      if (email !== originalEmail) {
  const { error: emailError } = await supabase.auth.updateUser(
  { email },
  { emailRedirectTo: 'http://localhost:3000/confirmar-email' }
);

  if (emailError) {
    setErro('Erro ao atualizar email.');
    console.error(emailError);
    return;
  }

  setSucesso('Perfil atualizado com sucesso. Por favor, verifique ambas as caixas de email para confirmar a alteração.');
} else {
  setSucesso('Perfil atualizado com sucesso.');
}

      setIsEditing(false);
    } catch (err) {
      setErro('Erro ao atualizar perfil.');
      console.error(err);
    }
  };

  return (
    <div className="flex justify-center items-center w-full min-h-screen bg-[#eaf2e9] p-4">
      <div className="bg-[#FFFDF6] w-full max-w-md p-6 rounded-2xl shadow-lg flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-[#032221]">Perfil</h1>
          {!isEditing && (
            <CiEdit
              size={36}
              className="bg-gray-200 text-[#032221] p-2 rounded-xl cursor-pointer transition"
              onClick={() => setIsEditing(true)}
            />
          )}
        </div>

        {erro && <p className="text-sm text-red-500">{erro}</p>}
        {sucesso && <p className="text-sm text-green-600">{sucesso}</p>}

        <div className="flex flex-col gap-4">
          <div className="flex flex-col">
            <label className="text-sm text-gray-600">Nome</label>
            {isEditing ? (
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="mt-1 p-2 rounded-lg border border-gray-300 bg-white focus:outline-none"
              />
            ) : (
              <span className="text-lg font-semibold text-[#032221]">{nome}</span>
            )}
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-gray-600">Email</label>
            {isEditing ? (
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 p-2 rounded-lg border border-gray-300 bg-white focus:outline-none"
              />
            ) : (
              <span className="text-sm text-gray-600">{email}</span>
            )}
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-gray-600">Telemóvel</label>
            {isEditing ? (
              <input
                type="tel"
                value={telemovel}
                onChange={(e) => setTelemovel(e.target.value)}
                className="mt-1 p-2 rounded-lg border border-gray-300 bg-white focus:outline-none"
              />
            ) : (
              <span className="text-sm text-gray-600">{telemovel || '—'}</span>
            )}
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-gray-600">Tipo de Utilizador</label>
            <span className="text-sm text-gray-400 bg-[rgba(3,98,76,0.05)] rounded-lg p-2">{tipo || '—'}</span>
          </div>
        </div>

        {isEditing && (
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-lg bg-gray-200 text-[#032221] font-medium hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardar}
              className="px-4 py-2 rounded-lg bg-[#032221] text-[#FFFDF6] font-medium hover:bg-[#052e2d]"
            >
              Guardar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
