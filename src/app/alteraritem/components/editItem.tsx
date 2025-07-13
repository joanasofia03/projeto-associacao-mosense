'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Toaster } from 'sonner';
import { Separator } from "@/components/ui/separator"
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

// Import de icons
import { RiDeleteBin6Line } from "react-icons/ri";
import { MdOutlineEdit } from "react-icons/md";
import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react'

interface TipoOption {
    value: string;
    label: string;
}

interface IvaOption {
    value: number;
    label: string;
}

interface initialData {
    tipos: TipoOption[];
    taxaIVA: IvaOption[];
}

interface Props {
    initialData: initialData;
}

export default function AlterarItem({ initialData }: Props) {
    const [loading, setLoading] = useState(true);
    const [openTipo, setOpenTipo] = useState<boolean>(false)
    const [tipoSelecionado, setTipoSelecionado] = useState<string>("")

    return (
        <>
            {/* Cabeçalho */}
            <div className="w-full text-[var(--cor-texto)] pt-5 px-5 flex flex-row justify-between items-center">
                <h1 className="text-3xl font-bold whitespace-nowrap">
                    Gerir Produto - Edição ou Exclusão
                </h1>

                <div className="flex items-center space-x-2">
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
                                    ? initialData.tipos.find((tipo) => tipo.value === tipoSelecionado)?.label
                                    : "Selecionar Tipo de Item..."}
                                <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>

                        <PopoverContent className="min-w-[var(--radix-popover-trigger-width)] p-0">
                            <Command>
                                <CommandInput placeholder="Procurar tipo de item..." />
                                <CommandList>
                                    <CommandEmpty>Nenhum tipo encontrado.</CommandEmpty>
                                    <CommandGroup>
                                        {initialData.tipos.map((tipo) => (
                                            <CommandItem
                                                key={tipo.value}
                                                value={tipo.value}
                                                onSelect={(currentValue) => {
                                                    setTipoSelecionado(currentValue === tipoSelecionado ? "" : currentValue)
                                                    setOpenTipo(false)
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
                </div>
            </div>

            {/* Conteúdo principal */}
            <div className="w-full py-2 px-10">

            </div>
        </>
    );
}