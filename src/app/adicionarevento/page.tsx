import { createClient } from '../../utils/supabase/server'
import AdicionarEvento from './addEvento'

export default async function Page() {
  const supabase = await createClient();

  return (
    <div>
      <AdicionarEvento />
    </div>
  );
}