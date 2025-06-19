'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '../../../../lib/supabaseClient';

//shadcn/ui components
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

//Icons
import { MdOutlineMenu } from "react-icons/md";
import { LuNotebookPen, LuNotebook } from "react-icons/lu";
import { IoAddCircleOutline } from "react-icons/io5";
import { MdOutlineChangeCircle } from "react-icons/md";
import { AiOutlineUserAdd } from "react-icons/ai";
import { FaRegEye } from "react-icons/fa";
import { IoIosLogOut } from "react-icons/io";
import { TbProgressHelp } from "react-icons/tb";
import { FaUserLarge } from "react-icons/fa6";
import { MdOutlineEmojiEvents, MdOutlineEventRepeat } from "react-icons/md";
import { Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { profile } from 'console';

type profile = {
  id: string;
  nome: string;
  tipo: string;
};

type Props = {
  profiles: profile[];
};

export default function NavBar({ profiles }: Props){
    const[isExpanded, setIsExpanded] = useState<boolean>(true) //Responsável por saber se a navbar esta expadndida ou nao;
    const[session, setSession] = useState<boolean>(true) //Responsável por análisar a sessão do utilizador (loggado ou não);
    const[emTransicao, setEmTransicao] = useState<boolean>(false) //Responsável pela posição do botão de expandir ou recolher navbar;
    const[userType, setUserType] = useState<string>("") //Responsável por saber qual o tipo de utilizador para saber se tem permissões ou não;

    const handleMudancaNavbar = () => {
        if (session && emTransicao) {
            setEmTransicao(true); 
            setIsExpanded(!isExpanded);
            setTimeout(() => {
                setEmTransicao(false);
            }, 400);
        }
    };

    async function handleLogIn(email: string, password: string){  
        const { data: login, error } = await supabase.auth.signInWithPassword({email, password})
        if (error) throw error
        setSession(true)
    }

    async function handleLogOut(){
        const { error } = await supabase.auth.signOut()
        if(error) throw error
        setSession(false)
    }

    return(
        <nav className={`flex flex-col h-screen bg-[#FFFDF6] border-r border-border transition-all duration-400 ease-in-out 
                        ${isExpanded ? 'w-[calc(30%-280px)]' : 'w-[cacl(30%-70px)]'} shadow-lg relative overflow-hidden`}>
            
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border relative z-10">
                <div className={`overflow-hidden transition-all duration-400 ease-out 
                                ${isExpanded ? 'opacity-100 transform translate-x-0' : 'opacity-0 max-w-0 transform -translate-x-4'}`}>
                    <Link href="/" className="block">
                    <Image 
                        src="/OsMosenses.png" 
                        alt="Logo" 
                        width={140} 
                        height={45} 
                        priority 
                    />
                    </Link>
                </div>
            
                {session && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleMudancaNavbar}
                        className={`p-2 hover:bg-[#eaf2e9] transition-all duration-300 ease-in-out cursor-pointer ${!isExpanded ? 'mx-auto' : ''}`}
                        disabled={emTransicao}
                    >
                        <div className={`transition-transform duration-400 ${emTransicao ? 'rotate-180' : ''}`}>
                            {isExpanded ? (
                            <ChevronLeft size={18} />
                            ) : (
                            <ChevronRight size={18} />
                            )}
                        </div>
                    </Button>
                )}
            </div>  
        </nav>
    );
}