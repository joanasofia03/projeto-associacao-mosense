import { supabase } from '../../../../lib/supabaseClient';

interface EditarPerfilPageProps {
  params: {
    username: string;
  };
}

export default async function EditarPerfilPage({ params }: EditarPerfilPageProps) {
  const { username } = await params;

  const userName = decodeURIComponent(username);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Editar Perfil: {userName}</h1>
      <p>Conteúdo do perfil do utilizador {userName} será carregado aqui.</p>
    </main>
  );
}
