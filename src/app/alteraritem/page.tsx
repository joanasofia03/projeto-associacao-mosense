// page.tsx (Server Component - SSR)

import { createClient } from '../../utils/supabase/server'
import AlterarItem from './components/editItem'
import { ToasterProvider } from '../components/toasterProvider'
import { updateItemAction, deleteItemAction, fetchItensAction } from './server/actions';

const TIPOS_OPTIONS = [
  { value: "Todos os Itens", label: "Todos os Itens" },
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

export default async function AlterarItemPage() {

  const supabase = await createClient()

  const initialData = {
    tipos: TIPOS_OPTIONS,
    taxaIVA: IVA_OPTIONS,
  };

  return (
    <div className="min-h-screen w-full px-4 bg-[#eaf2e9]">
      <ToasterProvider />
      <AlterarItem
        initialData={initialData}
      />
    </div>
  )
}