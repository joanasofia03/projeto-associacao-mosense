'use client'

import { useState, useRef } from 'react';

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from "@/components/ui/label"
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
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

//Import de Icons
import { MdOutlineEdit } from "react-icons/md";
import { CheckIcon, ChevronsUpDownIcon, Save } from 'lucide-react'

interface TipoOption {
    value: string;
    label: string;
}

interface IvaOption {
    value: number;
    label: string;
}

interface initialData {
    tiposFiltro: TipoOption[];  // Para filtros
    tiposItem: TipoOption[];    // Para edição
    taxaIVA: IvaOption[];
}

interface Item {
    id: string
    nome: string
    preco: number
    tipo: string
    criado_em: string
    isMenu: boolean
    IVA?: number
    imagem_url?: string | null
}

interface Props {
    initialData: initialData;
    item: Item;
    updateItemAction: (formData: FormData) => Promise<{ success: boolean; message?: string; data?: any }>;
}

export function BotaoEditar({ initialData, item, updateItemAction }: Props) {
    const [loading, setLoading] = useState<boolean>(false);
    const [openTipo, setOpenTipo] = useState<boolean>(false);
    const [openIva, setOpenIva] = useState<boolean>(false);
    const [sheetOpen, setSheetOpen] = useState<boolean>(false);

    //Inicializar com os dados do item atual
    const [tipoSelecionado, setTipoSelecionado] = useState<string>(item.tipo);
    const [ivaSelecionado, setIvaSelecionado] = useState<string>(item.IVA?.toString() || "");
    const [isMenuChecked, setIsMenuChecked] = useState<boolean>(item.isMenu);

    const formRef = useRef<HTMLFormElement>(null);
    const InputClassNames = "border-[var(--cor-texto)] focus-visible:ring-0";

    //Resetar valores quando o sheet abre
    const handleSheetOpen = (open: boolean) => {
        setSheetOpen(open);
        if (open) {
            setTipoSelecionado(item.tipo)
            setIvaSelecionado(item.IVA?.toString() || "")
            setIsMenuChecked(item.isMenu)
        }
    };

    function sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function handleUpdateItem(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);

        try {
            const formData = new FormData(event.currentTarget)

            //Adicionar o ID do item ao FormData
            formData.set('id', item.id)

            //Garantir que os valores selecionados estão no FormData
            formData.set('tipo', tipoSelecionado)
            formData.set('taxaIVA', ivaSelecionado)
            formData.set('isMenu', isMenuChecked.toString())

            const result = await updateItemAction(formData)

            if (result.success) {
                toast.success('Item atualizado com sucesso!');
                await sleep(500); //esperar 500ms para fechar o sheet
                setSheetOpen(false);
            } else {
                toast.error(result.message || 'Erro ao atualizar item.');
                setSheetOpen(true);
            }

        } catch (error) {
            console.error("Erro ao atualizar item:", error);
            toast.error('Erro ao atualizar item. Tente novamente.');
            setSheetOpen(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Sheet open={sheetOpen} onOpenChange={handleSheetOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="botaoeditar"
                    size="sm"
                >
                    <MdOutlineEdit className="h-3 w-3 mr-1" />
                    Editar
                </Button>
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Editar produto</SheetTitle>
                    <SheetDescription>
                        Atualiza com precisão cada detalhe do produto para manter o site compreensível e funcional para todos.
                    </SheetDescription>
                </SheetHeader>
                <form ref={formRef} onSubmit={handleUpdateItem} className="space-y-3">
                    <div className="grid flex-1 auto-rows-min gap-6 px-4">
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
                                defaultValue={item.nome}
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
                                step="0.01"
                                min="0"
                                placeholder='0.00'
                                defaultValue={item.preco.toString()}
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
                                            ? initialData.tiposItem.find((tipo) => tipo.value === tipoSelecionado)?.label
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
                                                {initialData.tiposItem.map((tipo) => (
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
                            {item.imagem_url && (
                                <div className="text-sm text-[var(--cor-texto)]/70">
                                    Item atual possui imagem. Selecione uma nova para substituir.
                                </div>
                            )}
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
                    </div>
                    <SheetFooter>
                        <Button
                            type="submit"
                            disabled={loading || !tipoSelecionado || !ivaSelecionado}
                            variant="botaoadicionar"
                        >
                            {loading ? 'A guardar alterações...' : 'Guardar Alterações'}
                            <Save className="ml-2 h-4 w-4" />
                        </Button>
                        <SheetClose asChild>
                            <Button type="button" variant="botaocancelar">Cancelar</Button>
                        </SheetClose>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    )
}
