// page.tsx (Server Component - SSR)

import { createClient } from '../../utils/supabase/server'
import AlterarItem from './components/editItem'
import { ToasterProvider, toastMessage } from '../components/toasterProvider'
import { updateItemAction, deleteItemAction, fetchItensAction } from './server/actions';

// Array para filtros (inclui "Todos os Itens")
const TIPOS_FILTRO_OPTIONS = [
  { value: "Todos os Itens", label: "Todos os Itens" },
  { value: "Sopas", label: "Sopas" },
  { value: "Comida", label: "Comida" },
  { value: "Sobremesas", label: "Sobremesas" },
  { value: "Bebida", label: "Bebida" },
  { value: "Álcool", label: "Álcool" },
  { value: "Brindes", label: "Brindes" }
];

// Array para edição de itens (sem "Todos os Itens")
const TIPOS_ITEM_OPTIONS = [
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

  //Buscar todos os itens
  const itensResult = await fetchItensAction();

  if (!itensResult.success) {
    toastMessage('Teste', 'error');
    return null;
  }

  const initialData = {
    tiposFiltro: TIPOS_FILTRO_OPTIONS,  //Para filtros
    tiposItem: TIPOS_ITEM_OPTIONS,      //Para edição
    taxaIVA: IVA_OPTIONS,
  };

  return (
    <div className="h-screen w-full px-4 bg-[#eaf2e9] overflow-y-auto">
      <ToasterProvider />
      <AlterarItem
        initialData={initialData}
        itens={itensResult.data || []}
        updateItemAction={updateItemAction}
        deleteItemAction={deleteItemAction}
      />
    </div>
  )
}