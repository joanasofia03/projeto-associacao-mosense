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

interface Item {
    id: string,
    nome: string;
    preco: number;
    tipo: string;
    criado_em: string;
    isMenu: boolean;
    IVA?: number;
    imagem_url?: string | null;
}

interface Props {
    initialData: initialData;
    itens: Item[];
    updateItemAction: (formData: FormData) => Promise<any>;
    deleteItemAction: (id: string) => Promise<any>;
}

function formatDateTimeString(dateString: string) {
    const date = new Date(dateString);
    const data = date.toLocaleDateString('pt-PT');
    const hora = date.toLocaleTimeString('pt-PT', {
        hour: '2-digit',
        minute: '2-digit'
    });
    return { data, hora };
}


export default function AlterarItem({ initialData, itens, updateItemAction, deleteItemAction }: Props) {
    const [loading, setLoading] = useState<boolean>(true);
    const [openTipo, setOpenTipo] = useState<boolean>(false)
    const [tipoSelecionado, setTipoSelecionado] = useState<string>("Todos os Itens")
    const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

    //Filtrar itens com base no tipo selecionado e barra de pesquisa
    const itensFiltrados = useMemo(() => {
        let filtered = itens;

        //filtrar por tipo
        if (tipoSelecionado && tipoSelecionado !== "Todos os Itens") {
            filtered = filtered.filter(item => item.tipo === tipoSelecionado);
        }

        return filtered;
    }, [itens, tipoSelecionado]);

    //Função para deletar item
    const handleDeleteItem = async (itemId: string) => {
        setDeletingItemId(itemId);
        try {
            const result = await deleteItemAction(itemId);
            if (result.success) {
                toast.success(result.message)
            } else {
                toast.error(result.message)
            }
        } catch (error) {
            toast.error("Erro inesperado ao eliminar item.")
        } finally {
            setDeletingItemId(null);
        }
    };

    return (
        <>
            {/* Cabeçalho */}
            <div className="w-full text-[var(--cor-texto)] pt-5 px-5 flex flex-row justify-between items-center">
                <h1 className="text-3xl font-bold">
                    Gerir Produto - Edição ou Exclusão
                </h1>

                {/* Contador de itens e seleção do tipo */}
                <div className="flex items-center gap-4">
                    {/* Contador de itens */}
                    <div className="text-[var(--cor-texto)] font-medium">
                        {itensFiltrados.length}/{itens.length} itens
                    </div>

                    {/* Seleção do tipo */}
                    <div className="flex flex-col items-stretch gap-3">
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
                                                        setTipoSelecionado(currentValue)
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
            </div>

            {/* Conteúdo principal */}
            <div className="w-full h-full py-4 px-5">
                {itensFiltrados.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-[var(--cor-texto)]/70 text-lg">
                            {itens.length === 0
                                ? "Nenhum item encontrado."
                                : "Nenhum item corresponde aos filtros aplicados."
                            }
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
                        {itensFiltrados.map((item) => {
                            const formatDateTime = formatDateTimeString(item.criado_em);

                            return (
                                <Card key={item.id} className="bg-[var(--cor-fundo2)] shadow-[3px_3px_3px_3px_var(--cor-texto)]/2 pt-4 pb-2 w-full h-full">
                                    <CardHeader className="text-[var(--cor-texto)] border-b border-[rgba(32,41,55,0.15) w-full h-[50px]">
                                        <div className="flex justify-between items-center w-full h-full">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                {/* Avatar da imagem */}
                                                <div className="flex-shrink-0">
                                                    {item.imagem_url ? (
                                                        <img
                                                            src={item.imagem_url}
                                                            alt={`Imagem de ${item.nome}`}
                                                            className="w-10 h-10 rounded-full object-cover border-2 border-[var(--cor-texto)]/10"
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.style.display = 'none';
                                                                target.nextElementSibling?.classList.remove('hidden');
                                                            }}
                                                        />
                                                    ) : null}
                                                    {/* Fallback avatar quando não há imagem */}
                                                    <div className={`w-10 h-10 rounded-full bg-[#DDEB9D] border-2 border-[var(--cor-texto)]/10 flex items-center justify-center ${item.imagem_url ? 'hidden' : ''}`}>
                                                        <span className="text-[var(--cor-texto)] font-medium text-sm">
                                                            {item.nome.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Nome do item */}
                                                <CardTitle className="text-xl text-[var(--cor-texto)] truncate flex-1 min-w-0">
                                                    {item.nome}
                                                </CardTitle>
                                            </div>

                                            {/* Badge do tipo */}
                                            <span className="px-2 py-1 bg-[#DDEB9D] text-[var(--cor-texto)] text-xs font-medium rounded-full flex-shrink-0 ml-2">
                                                {item.tipo}
                                            </span>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="px-4 py-3">
                                        <div className="space-y-2 mb-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[var(--cor-texto)] text-sm">Preço:</span>
                                                <span className="text-[var(--cor-texto)] font-semibold">€{item.preco.toFixed(2)}</span>
                                            </div>

                                            {item.IVA !== undefined && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[var(--cor-texto)] text-sm">IVA:</span>
                                                    <span className="text-[var(--cor-texto)] font-semibold">{item.IVA}%</span>
                                                </div>
                                            )}

                                            <div className="flex justify-between items-center">
                                                <span className="text-[var(--cor-texto)] text-sm">Menu:</span>
                                                <span className={`font-medium text-sm ${item.isMenu ? 'text-[#1B4D3E]' : 'text-[#7D0A0A]'}`}>
                                                    {item.isMenu ? 'Incluído' : 'Não incluído'}
                                                </span>
                                            </div>

                                            <div className="flex justify-between items-center text-xs text-[var(--cor-texto)]/70">
                                                <span>Criado em:</span>
                                                <span>{formatDateTime.data} às {formatDateTime.hora}</span>
                                            </div>
                                        </div>

                                        {/* Botões de ação */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button
                                                variant="botaoeditar"
                                                size="sm"
                                                className="text-xs"
                                            >
                                                <MdOutlineEdit className="h-3 w-3 mr-1" />
                                                Editar
                                            </Button>

                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        variant="botaoeliminar"
                                                        size="sm"
                                                        className="text-xs"
                                                        disabled={deletingItemId === item.id}
                                                    >
                                                        <RiDeleteBin6Line className="h-3 w-3 mr-1" />
                                                        {deletingItemId === item.id ? 'Excluindo...' : 'Excluir'}
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent className="bg-[var(--cor-fundo2)]">
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle className="text-[var(--cor-texto)]">
                                                            Confirmar Exclusão
                                                        </AlertDialogTitle>
                                                        <AlertDialogDescription className="text-[var(--cor-texto)]/70">
                                                            Tem certeza que deseja excluir o item <strong>"{item.nome}"</strong>?
                                                            <br />
                                                            Esta ação não pode ser desfeita.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel className="border-[var(--cor-texto)]/20 text-[var(--cor-texto)] hover:bg-[var(--cor-texto)]/5 cursor-pointer">
                                                            Cancelar
                                                        </AlertDialogCancel>
                                                        <AlertDialogAction
                                                            className="bg-[#7D0A0A] text-[var(--cor-fundo2)] hover:bg-[#7D0A0A]/90 cursor-pointer"
                                                            onClick={() => handleDeleteItem(item.id)}
                                                            disabled={deletingItemId === item.id}
                                                        >
                                                            {deletingItemId === item.id ? 'Excluindo...' : 'Excluir'}
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
}