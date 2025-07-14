'use client'

import { useState, useRef } from 'react';

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
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

//Import de Icons
import { ShoppingCart, ListOrdered } from 'lucide-react';


export function CheckoutComponent() {
    const [loading, setLoading] = useState<boolean>(false);
    const [sheetOpen, setSheetOpen] = useState<boolean>(false);

    const formRef = useRef<HTMLFormElement>(null);

    //Resetar valores quando o sheet abre
    const handleSheetOpen = (open: boolean) => {
        setSheetOpen(open);
    };

    async function handleRegistarPedido() {
        return <></>
    }

    return (
        <Sheet open={sheetOpen} onOpenChange={handleSheetOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="ghost"
                    size="lg"
                >
                    <ShoppingCart />
                </Button>
            </SheetTrigger>
            <SheetContent className="flex flex-col h-full justify-between">
                <SheetHeader>
                    <SheetTitle className="flex flex-row items-center text-lg">
                        Checkout <ShoppingCart className="ml-2 h-4 w-4" />
                    </SheetTitle>
                    <SheetDescription>
                        Revê o teu pedido e finaliza a compra com segurança.
                    </SheetDescription>
                </SheetHeader>

                <Separator />

                <div className="flex-1">
                    <form ref={formRef} onSubmit={handleRegistarPedido} className="space-y-4 px-4">
                        <div className="space-y-2">
                            <Label htmlFor="nome" className="text-sm font-medium text-[var(--cor-texto)]">
                                Nome do cliente
                            </Label>
                            <Input
                                type="text"
                                id="nome"
                                name="nome"
                                placeholder="Nome & sobrenome"
                                maxLength={100}
                                required
                            />
                        </div>

                        <div className="flex flex-row flex-1 gap-4">
                            <div className='space-y-2'>
                                <Label htmlFor="contacto" className="text-sm font-medium text-[var(--cor-texto)]">
                                    Contacto do Cliente
                                </Label>
                                <Input
                                    type="text"
                                    id="contacto"
                                    name="contacto"
                                    placeholder="9xxxxxxxx"
                                    maxLength={100}
                                    required
                                />
                            </div>

                            <div className='space-y-2'>
                                <Label htmlFor="tipo" className="text-sm font-medium text-[var(--cor-texto)]">
                                    Tipo de Pedido
                                </Label>
                                <Select>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Selecione um tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>Tipo de Pedido</SelectLabel>
                                            <SelectItem value="comer_aqui">Comer Aqui</SelectItem>
                                            <SelectItem value="take_away">Take-Away</SelectItem>
                                            <SelectItem value="entrega">Entrega</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div >
                            <Textarea placeholder="Notas sobre o pedido..." />
                        </div>
                    </form>
                </div>

                <SheetFooter className="px-4 pb-4">
                    <Button
                        type="submit"
                        form={formRef.current?.id}
                        disabled={loading}
                        variant="botaoadicionar"
                    >
                        {loading ? 'A registrar...' : 'Registar Pedido'}
                        <ListOrdered className="ml-2 h-4 w-4" />
                    </Button>
                    <SheetClose asChild>
                        <Button type="button" variant="botaocancelar">
                            Cancelar
                        </Button>
                    </SheetClose>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}
