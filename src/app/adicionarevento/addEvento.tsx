'use client'

import { useEffect, useActionState } from 'react'
import { adicionarEventoAction } from './actions'

// Imports do Shadcn
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { MdOutlineEmojiEvents } from "react-icons/md"
import { toast } from 'sonner';
import { Toaster } from 'sonner';

const initialState = { success: false, message: '' }

export default function AdicionarEvento() {
  const [state, formAction] = useActionState(adicionarEventoAction, initialState)

  useEffect(() => {
    if (state.message) {
      state.success ? toast.success(state.message) : toast.error(state.message)
    }
  }, [state])

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#eaf2e9]">
      <Toaster position="bottom-right" />
      <Card className="w-full max-w-md bg-[var(--cor-fundo2)] shadow-[3px_3px_3px_3px_var(--cor-texto)]/2">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-[var(--cor-texto)]">
            Adicionar Evento
          </CardTitle>
          <CardDescription className="text-[var(--cor-texto)]/70">
            Crie e gira um evento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-sm font-medium text-[var(--cor-texto)]">
                Nome do Evento
              </Label>
              <Input
                type="text"
                id="nome"
                name="nome"
                placeholder="Festa do evento"
                className="border-[var(--cor-texto)] focus-visible:ring-0"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_inicio" className="text-sm font-medium text-[var(--cor-texto)]">
                Data de Início
              </Label>
              <Input
                type="date"
                id="data_inicio"
                name="data_inicio"
                className="border-[var(--cor-texto)] focus-visible:ring-0"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_fim" className="text-sm font-medium text-[var(--cor-texto)]">
                Data de Fim
              </Label>
              <Input
                type="date"
                id="data_fim"
                name="data_fim"
                className="border-[var(--cor-texto)] focus-visible:ring-0"
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="em_execucao"
                name="em_execucao"
                value="true"
                className="border-[#1a4d4a] data-[state=checked]:bg-[var(--cor-texto)] data-[state=checked]:border-[var(--cor-texto)]"
              />
              <Label htmlFor="em_execucao" className="text-sm text-[var(--cor-texto)]">
                Evento está em execução?
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full bg-[var(--cor-texto)] text-[#FFFDF6] hover:bg-[var(--cor-texto)]/90 cursor-pointer transition-all duration-300"
            >
              Adicionar Evento
              <MdOutlineEmojiEvents />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}