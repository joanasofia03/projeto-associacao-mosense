import { createClient } from '../../utils/supabase/server'
import AlterarEvento from './changeEvento'
import { fetchEventos } from './actions';
import { toast } from 'sonner';
import { Toaster } from 'sonner';

export default async function Page() {
  const supabase = await createClient();

  //Buscar eventos no servidor
  const resultEventos = await fetchEventos();

  if(!resultEventos.success){
    console.error('Erro ao carregar eventos:', resultEventos.message);
    toast.error('Erro ao carregar eventos: ' + resultEventos.message);
    return (
      <div className='min-h-screen flex items-center justify-center bg-[#eaf2e9]'>
        <div className='text-[#032221] text-xl'>Erro ao carregar eventos</div>
      </div>
    )
  }

  return (
    <div>
      <Toaster position="bottom-right" />
      <AlterarEvento initialEventos={resultEventos.data || []} />
    </div>
  );
}