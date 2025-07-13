'use client';

import { useState, useRef } from 'react';

//Import Shadcn components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
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

//Import icons
import { IoAddCircleOutline } from "react-icons/io5";
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
    adicionarItemAction: (formData: FormData) => Promise<{ success: boolean; message?: string; data?: any }>;
}

export default function AdicionarItem({ initialData, adicionarItemAction }: Props) {
    const [loading, setLoading] = useState<boolean>(false);
    const [openTipo, setOpenTipo] = useState<boolean>(false);
    const [openIva, setOpenIva] = useState<boolean>(false);
    const [tipoSelecionado, setTipoSelecionado] = useState<string>("");
    const [ivaSelecionado, setIvaSelecionado] = useState<string>("");
    const [isMenuChecked, setIsMenuChecked] = useState<boolean>(false);

    const formRef = useRef<HTMLFormElement>(null);
    const InputClassNames = "border-[var(--cor-texto)] focus-visible:ring-0";

    async function handleAddItem(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);

        try {
            const formData = new FormData(event.currentTarget)

            //Garantir que os valores selecionados estão no FormData
            formData.set('tipo', tipoSelecionado)
            formData.set('taxaIVA', ivaSelecionado)
            formData.set('isMenu', isMenuChecked.toString())

            const result = await adicionarItemAction(formData)
            if (result.success) {
                toast.success('Item adicionado com sucesso!');
                if (formRef.current) {
                    formRef.current.reset()
                }
                setTipoSelecionado("");
                setIvaSelecionado("");
                setIsMenuChecked(false);
            } else {
                toast.error(result.message || 'Erro ao adicionar item.');
            }

        } catch (error) {
            console.error("Erro ao adicionar item:", error);
            toast.error('Erro ao adicionar item. Tente novamente.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <Card className="w-full max-w-md bg-[var(--cor-fundo2)] shadow-[3px_3px_3px_3px_var(--cor-texto)]/2">
            <CardHeader>
                <CardTitle className="text-2xl font-semibold text-[var(--cor-texto)]">
                    Adicionar Novo Item
                </CardTitle>
                <CardDescription className="text-[var(--cor-texto)]/70">
                    Crie e gerencie um item do menu
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form ref={formRef} onSubmit={handleAddItem} className="space-y-3">
                    <div className="space-y-2">
                        <Label htmlFor="nome" className="text-sm font-medium text-[var(--cor-texto)]">
                            Nome do Item
                        </Label>
                        <Input
                            type="text"
                            id="nome"
                            name='nome'
                            placeholder="Nome do item"
                            className={InputClassNames}
                            maxLength={100}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="preco" className="text-sm font-medium text-[var(--cor-texto)]">
                            Preço (€)
                        </Label>
                        <Input
                            type="number"
                            id="preco"
                            name='preco'
                            className={InputClassNames}
                            required
                            step="0.1"
                            min="0"
                            placeholder='0.00'
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="tipoitem" className="text-sm font-medium text-[var(--cor-texto)]">
                            Tipo de Item *
                        </Label>
                        <Popover open={openTipo} onOpenChange={setOpenTipo}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="botaovoltar"
                                    role="combobox"
                                    aria-expanded={openTipo}
                                    className="w-full justify-between"
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

                    <div className="space-y-2">
                        <Label htmlFor="taxaIva" className="text-sm font-medium text-[var(--cor-texto)]">
                            Taxa de IVA *
                        </Label>
                        <Popover open={openIva} onOpenChange={setOpenIva}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="botaovoltar"
                                    role="combobox"
                                    aria-expanded={openIva}
                                    className="w-full justify-between"
                                    type="button"
                                >
                                    {ivaSelecionado
                                        ? initialData.taxaIVA.find((iva) => iva.value === Number(ivaSelecionado))?.label
                                        : "Selecionar Taxa de IVA..."}
                                    <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="min-w-[var(--radix-popover-trigger-width)] p-0">
                                <Command>
                                    <CommandInput placeholder="Procurar taxa..." />
                                    <CommandList>
                                        <CommandEmpty>Nenhuma taxa encontrada.</CommandEmpty>
                                        <CommandGroup>
                                            {initialData.taxaIVA.map((iva) => (
                                                <CommandItem
                                                    key={iva.value}
                                                    value={iva.value.toString()}
                                                    onSelect={(currentValue) => {
                                                        setIvaSelecionado(currentValue === ivaSelecionado ? "" : currentValue)
                                                        setOpenIva(false)
                                                    }}
                                                >
                                                    <CheckIcon
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            ivaSelecionado === iva.value.toString() ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {iva.label}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="imagem" className="text-sm font-medium text-[var(--cor-texto)]">
                            Imagem do Item (opcional)
                        </Label>
                        <Input
                            type="file"
                            id="imagem"
                            name='imagem'
                            accept="image/*"
                            className={cn(InputClassNames, "cursor-pointer")}
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="isMenu"
                            checked={isMenuChecked}
                            onCheckedChange={(checked) => setIsMenuChecked(checked as boolean)}
                            className="border-[#1a4d4a] data-[state=checked]:bg-[var(--cor-texto)] data-[state=checked]:border-[var(--cor-texto)] mt-1"
                        />
                        <Label htmlFor="isMenu" className="text-sm text-[var(--cor-texto)] leading-5">
                            Incluir no menu?
                        </Label>
                    </div>

                    <Button
                        type="submit"
                        disabled={loading || !tipoSelecionado || !ivaSelecionado}
                        variant="botaoadicionar"
                        className="w-full"
                    >
                        {loading ? 'A criar item...' : 'Adicionar Item'}<IoAddCircleOutline />
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}