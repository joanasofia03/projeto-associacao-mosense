// page.tsx (Server Component - SSR)
'use server';

import { createClient } from '../../utils/supabase/server'
import AdicionarItem from './components/itemForm'
import { Toaster } from 'sonner';
import { adicionarItemAction } from './server/actions';

const TIPOS_OPTIONS = [
  { value: "Sopas", label: "Sopas" },
  { value: "Comida", label: "Comida" },
  { value: "Sobremesas", label: "Sobremesas" },
  { value: "Bebida", label: "Bebida" },
  { value: "Álcool", label: "Álcool" },
  { value: "Brindes", label: "Brindes" }
];

const IVA_OPTIONS = [
  { value: 23, label: "23% (Padrão)" },
  { value: 13, label: "13% (Intermédio)" },
  { value: 6, label: "6% (Reduzido)" },
  { value: 0, label: "0% (Isento)" }
];

export default async function AdicionarItemPage() {

  const supabase = await createClient()

  const initialData = {
    tipos: TIPOS_OPTIONS,
    taxaIVA: IVA_OPTIONS,
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#eaf2e9]">
      <Toaster position="bottom-right" />
      <AdicionarItem
        initialData={initialData}
        adicionarItemAction={adicionarItemAction}
      />
    </div>
  )
}