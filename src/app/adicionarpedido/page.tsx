// page.tsx (Server Component - SSR)

import { createClient } from '../../utils/supabase/server'
import { ToasterProvider, toastMessage } from '../components/toasterProvider'
import SearchBarWrapper from './components/SearchBarWrapper';
import FiltrarItensPorTipo from './components/Filtragem'
import { CheckoutComponent } from './components/Checkout'

export default async function AdicionarPedidoPage() {

    const supabase = await createClient()

    return (
        <div className="h-screen w-full px-4 bg-[#eaf2e9] overflow-y-auto">
            <ToasterProvider />
            <div className="w-full text-[var(--cor-texto)] pt-5 px-5 flex items-center gap-4">
                <h1 className="text-3xl font-bold whitespace-nowrap">
                    Registar Pedido
                </h1>
                <div className='flex-1'>
                    <SearchBarWrapper />
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-stretch gap-3">
                        <FiltrarItensPorTipo />
                    </div>
                </div>
                <div>
                    <CheckoutComponent />
                </div>
            </div>
        </div>
    )
}