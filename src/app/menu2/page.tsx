import { supabase } from '../../../lib/supabaseClient';
import ExibirItens from './ExibirItens';
import SearchBar from '../components/SearchBar';

export default async function Page() {
  const { data: itens, error } = await supabase.from('itens').select('*');

  if (error) {
    throw new Error(error.message);
  }

  return (
    <main className='flex flex-col justify-start items-center w-full h-full px-10 py-5 gap-5 overflow-y-scroll bg-[#eaf2e9]'>
      <SearchBar />
      <ExibirItens itens={itens} />
    </main>
  );
}
