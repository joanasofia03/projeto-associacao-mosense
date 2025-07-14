'use client';

import { useState } from 'react';

//Shadcn Components
import { Button } from '@/components/ui/button';
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

const TIPOS_DE_ITENS_FILTRAGEM = [
    { value: "Todos os itens", label: "Todos os itens" },
    { value: "Sopas", label: "Sopas" },
    { value: "Comida", label: "Comida" },
    { value: "Sobremesas", label: "Sobremesas" },
    { value: "Bebida", label: "Bebida" },
    { value: "Álcool", label: "Álcool" },
    { value: "Brindes", label: "Brindes" }
];

//Icons Lucide
import { Check, ChevronsUpDown } from "lucide-react"

export default function FiltrarItensPorTipo() {
    const [openTipo, setOpenTipo] = useState<boolean>(false)
    const [tipoSelecionado, setTipoSelecionado] = useState<string>("")

    return (
        <Popover open={openTipo} onOpenChange={setOpenTipo}>
            <PopoverTrigger asChild>
                <Button
                    variant="botaoeditar"
                    role="combobox"
                    aria-expanded={openTipo}
                    className="min-w-[320px] justify-between min-h-[40px]"
                    type="button"
                >
                    {tipoSelecionado
                        ? TIPOS_DE_ITENS_FILTRAGEM.find((tipo) => tipo.value === tipoSelecionado)?.label
                        : "Selecionar Tipo de Item..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>

            <PopoverContent className="min-w-[var(--radix-popover-trigger-width)] p-0">
                <Command>
                    <CommandInput placeholder="Procurar tipo de item..." />
                    <CommandList>
                        <CommandEmpty>Nenhum tipo encontrado.</CommandEmpty>
                        <CommandGroup>
                            {TIPOS_DE_ITENS_FILTRAGEM.map((tipo) => (
                                <CommandItem
                                    key={tipo.value}
                                    value={tipo.value}
                                    onSelect={(currentValue) => {
                                        setTipoSelecionado(currentValue)
                                        setOpenTipo(false)
                                    }}
                                >
                                    <Check
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
    );
}
