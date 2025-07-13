// page.tsx (Server Component - SSR)
import { createClient } from '../../utils/supabase/server'
import { addUserAction } from './actions'
import AdicionarUtilizadorForm from './addUserForm'

//Tipos de conta
const tipo_de_conta = [
  {
    value: "administrador",
    label: "Administrador",
  },
  {
    value: "funcionario banca",
    label: "Funcionario Banca",
  },
  {
    value: "cliente",
    label: "Cliente",
  },
]

export default async function AdicionarUtilizador() {

  const supabase = await createClient()
  
  // Dados iniciais para o cliente
  const initialData = {
    tiposDeConta: tipo_de_conta,
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#eaf2e9]">
      <div className="w-full max-w-lg">
        <div className="bg-[var(--cor-fundo2)] shadow-[3px_3px_3px_3px_var(--cor-texto)]/2 rounded-lg">
          <div className="p-6 pb-0">
            <h1 className="text-2xl font-semibold text-[var(--cor-texto)]">
              Adicionar Utilizador
            </h1>
            <p className="text-[var(--cor-texto)]/70 mt-2">
              Crie uma nova conta de utilizador no sistema
            </p>
          </div>
          
          {/* Client Component para interatividade */}
          <AdicionarUtilizadorForm 
            initialData={initialData}
            addUserAction={addUserAction}
          />
        </div>
      </div>
    </div>
  )
}