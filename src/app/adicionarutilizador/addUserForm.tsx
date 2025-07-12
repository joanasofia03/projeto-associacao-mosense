// AdicionarUtilizadorForm.tsx (Client Component)
'use client'

import { useState, useRef } from 'react'

//Import Shadcn
import { CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Toaster } from 'sonner'
import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

//Import de icons
import { Eye, EyeOff, UserPlus, CheckIcon, ChevronsUpDownIcon } from 'lucide-react'

//Tipos
interface TipoConta {
  value: string
  label: string
}

interface InitialData {
  tiposDeConta: TipoConta[]
}

interface Props {
  initialData: InitialData
  addUserAction: (formData: FormData) => Promise<{ success: boolean; message: string }>
}

export default function AdicionarUtilizadorForm({ initialData, addUserAction }: Props) {
  // Estados (funcionam normalmente em Client Components)
  const [loading, setLoading] = useState<boolean>(false)
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false)
  const [open, setOpen] = useState<boolean>(false)
  const [value, setValue] = useState<string>("")
  const [tipoSelecionado, setTipoSelecionado] = useState<string>("")
  
  const formRef = useRef<HTMLFormElement>(null)
  const InputClassNames = "border-[var(--cor-texto)] focus-visible:ring-0"

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev)
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword((prev) => !prev)

  async function handleSubmitReact(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)

      // Garantir que o tipo selecionado está no formData
      if (tipoSelecionado) {
        formData.set('tipo', tipoSelecionado)
      }

      const result = await addUserAction(formData)

      if (result.success) {
        toast.success(result.message)
        if (formRef.current) {
          formRef.current.reset()
        }
        setTipoSelecionado("")
        setValue("")
        setShowPassword(false)
        setShowConfirmPassword(false)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error('Erro ao submeter formulário:', error)
      toast.error('Erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Toaster position="bottom-right" />
      <CardContent className="p-6">
        <form ref={formRef} onSubmit={handleSubmitReact} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome" className="text-sm font-medium text-[var(--cor-texto)]">
              Nome *
            </Label>
            <Input
              type="text"
              id="nome"
              name="nome"
              className={InputClassNames}
              placeholder="Nome completo do utilizador"
              maxLength={100}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-[var(--cor-texto)]">
              E-mail *
            </Label>
            <Input
              type="email"
              id="email"
              name="email"
              className={InputClassNames}
              placeholder="email@exemplo.com"
              maxLength={100}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telemovel" className="text-sm font-medium text-[var(--cor-texto)]">
              Telemóvel
            </Label>
            <Input
              type="tel"
              id="telemovel"
              name="telemovel"
              className={InputClassNames}
              pattern="[0-9]{9}"
              inputMode="numeric"
              placeholder="Deve conter 9 números"
              maxLength={9}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-[var(--cor-texto)]">
              Palavra-passe *
            </Label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                className={`${InputClassNames} pr-10`}
                placeholder="Mínimo 6 caracteres"
                required
              />
              <Button
                type="button"
                onClick={togglePasswordVisibility}
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                aria-label={showPassword ? "Ocultar palavra-passe" : "Mostrar palavra-passe"}
              >
                {showPassword ? (
                  <Eye className="h-4 w-4 text-[var(--cor-texto)]" />
                ) : (
                  <EyeOff className="h-4 w-4 text-[var(--cor-texto)]" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-[var(--cor-texto)]">
              Confirmar palavra-passe *
            </Label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                className={`${InputClassNames} pr-10`}
                placeholder="Repita a palavra-passe"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={toggleConfirmPasswordVisibility}
                aria-label={showConfirmPassword ? "Ocultar confirmação" : "Mostrar confirmação"}
              >
                {showConfirmPassword ? (
                  <Eye className="h-4 w-4 text-[var(--cor-texto)]" />
                ) : (
                  <EyeOff className="h-4 w-4 text-[var(--cor-texto)]" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipoUtilizador" className="text-sm font-medium text-[var(--cor-texto)]">
              Tipo de Utilizador *
            </Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="botaovoltar"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
                  type="button"
                >
                  {tipoSelecionado
                    ? initialData.tiposDeConta.find((tipo) => tipo.value === tipoSelecionado)?.label
                    : "Selecionar Tipo de Conta..."}
                  <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="min-w-[var(--radix-popover-trigger-width)] p-0">
                <Command>
                  <CommandInput placeholder="Procurar tipo..." />
                  <CommandList>
                    <CommandEmpty>Nenhum tipo encontrado.</CommandEmpty>
                    <CommandGroup>
                      {initialData.tiposDeConta.map((tipo) => (
                        <CommandItem
                          key={tipo.value}
                          value={tipo.value}
                          onSelect={(currentValue) => {
                            setTipoSelecionado(currentValue === tipoSelecionado ? "" : currentValue)
                            setOpen(false)
                          }}
                        >
                          <CheckIcon
                            className={cn(
                              "mr-2 h-4 w-4",
                              tipoSelecionado === tipo.value ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {tipo.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <input type="hidden" name="tipo" value={tipoSelecionado} />
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="aceitouTermos"
              name="aceitouTermos"
              value="true"
              className="border-[#1a4d4a] data-[state=checked]:bg-[var(--cor-texto)] data-[state=checked]:border-[var(--cor-texto)] mt-1"
            />
            <Label htmlFor="aceitouTermos" className="text-sm text-[var(--cor-texto)] leading-5">
              Aceito os{' '}
              <a
                href="/termsofuseprivacypolicy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-[#3F7D58] hover:text-[var(--cor-texto)] transition-colors"
              >
                Termos de Utilização e Política de Privacidade
              </a>
              {' '}*
            </Label>
          </div>

          <Button
            type="submit"
            disabled={loading || !tipoSelecionado}
            variant="botaoadicionar"
            className="w-full"
          >
            {loading ? (
              'A criar utilizador...'
            ) : (
              <>
                Adicionar Utilizador
                <UserPlus className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </>
  )
}