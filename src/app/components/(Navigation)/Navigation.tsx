'use client'

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { redirect, useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '../../../utils/supabase/client'

import { getCurrentUser, LogOutAction } from './actions'

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Toaster } from 'sonner';

// Icons
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

export type UserType = 'Cliente' | 'Administrador' | 'Funcionario Banca'

export const Navigation = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false); //Flag responsável pelo estado do login
  const [isExpanded, setIsExpanded] = useState<boolean>(true); //Flag responsável pela extensão da NavBar
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false); //Flag responsável pelo botão de expansão da NavBar
  const [userType, setUserType] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  const [message, setMessage] = useState<string>('') //Flag responsável pelas mensagem de erro ou sucesso
  const [loading, setLoading] = useState<boolean>(false) //Flag responsável pelo loading dos componentes

  const iconSize = 20;

  useEffect(() => {
    checkAuthStatus()

    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          await checkAuthStatus();
        } else if (event === 'SIGNED_OUT') {
          handleAuth(false, null, null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [])

  async function checkAuthStatus() {
    setLoading(true)

    try {
      const result = await getCurrentUser()

      if (result.error || !result.user || !result.profile) {
        handleAuth(false, null, null)
        toast.error(result.error)
      } else {
        handleAuth(true, result.profile.nome, result.profile.tipo)
      }
    }
    catch (error) {
      console.error('Erro ao verificar a sessão do utilziador', error)
      handleAuth(false, null, null)
    }
    finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    setLoading(true)
    setMessage('')

    try {
      const result = await LogOutAction()

      if (result.LogOutError) {
        setMessage(result.LogOutError)
        toast.error(result.LogOutError)
      } else {
        handleAuth(false, null, null)
        toast.success('Sessão terminada com sucesso!')
        redirect('/login')
      }
    }
    catch (error) {
      console.error('Erro no logout', error)
      toast.error('Erro inesperado ao terminiar sessão')
    }
    finally {
      setLoading(false)
    }
  }

  const handleAuth = (LoggedIn: boolean, name: string | null, type: string | null) => {
    setIsLoggedIn(LoggedIn)
    setUserName(name)
    setUserType(type)
  }

  const toggleSidebar = () => {
    if (isLoggedIn && !isTransitioning) {
      setIsTransitioning(true);
      setIsExpanded(!isExpanded);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 400);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-pulse text-muted-foreground">A carregar...</div>
      </div>
    );
  }

  const getUserTypeColor = (type: string | null) => {
    switch (type) {
      case 'Administrador':
        return 'text-[#FF6969]';
      case 'Funcionario Banca':
        return 'text-[#7AE2CF]';
      default:
        return 'text-[#EEDF7A]';
    }
  };

  const MenuItem = ({
    href,
    icon,
    label,
    notifications = null
  }: {
    href: string;
    icon: React.ReactNode;
    label: string;
    notifications?: string | null
  }) => {
    const content = (
      <Link href={href} className="w-full">
        <Button
          variant="ghost"
          className={`w-full ${isExpanded
            ? 'justify-start gap-3 px-3 py-2 h-auto'
            : 'justify-center p-2 h-10 w-10'
            } text-[var(--cor-texto)] hover:bg-[var(--cor-texto)]/7 transition-all duration-300 hover:-translate-y-[1px] group`}
        >
          <div className="relative flex items-center">
            <div className="transition-transform duration-300 group-hover:rotate-3">
              {icon}
            </div>
            {notifications && (
              <Badge
                variant="secondary"
                className="absolute -top-1 -right-1 w-4 h-4 p-0 flex items-center justify-center text-xs bg-[var(--cor-texto)]/10 text-white"
              >
                {notifications}
              </Badge>
            )}
          </div>
          {isExpanded && (
            <span className="whitespace-nowrap text-base font-normal text-[var(--cor-texto)] transition-opacity duration-300 cursor-pointer">
              {label}
            </span>
          )}
        </Button>
      </Link>
    );

    if (!isExpanded) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {content}
            </TooltipTrigger>
            <TooltipContent side="right" className="ml-2">
              <p>{label}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return content;
  };

  const MenuSection = ({
    title = null,
    children
  }: {
    title?: string | null;
    children: React.ReactNode
  }) => (
    <div className="w-full space-y-1">
      {title && (
        <div className="px-3 py-2 group">
          {isExpanded ? (
            <div className="flex items-center gap-2">
              <h3 className="text-sm text-[#186F65] font-medium uppercase tracking-wider transition-colors duration-200">
                {title}
              </h3>
              <div className="flex-1 h-px bg-border transition-colors duration-200 group-hover:bg-accent-foreground/20"></div>
            </div>
          ) : (
            <Separator className="my-2 transition-colors duration-200 group-hover:bg-accent-foreground/20" />
          )}
        </div>
      )}
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );

  return (
    <TooltipProvider>
      <nav
        className={`flex flex-col h-screen bg-[#FFFDF6] border-r border-border transition-all duration-400 ease-in-out ${isExpanded ? 'w-[280px]' : 'w-[70px]'
          } shadow-lg relative overflow-hidden`}
      >
        {/* Subtle gradient overlay for smooth transitions */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/5 to-transparent pointer-events-none opacity-50" />

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border relative z-10">
          <div className={`overflow-hidden transition-all duration-400 ease-out ${isExpanded ? 'opacity-100 max-w-[200px] transform translate-x-0' : 'opacity-0 max-w-0 transform -translate-x-4'
            }`}>
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

          {isLoggedIn && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className={`p-2 hover:bg-[var(--cor-texto)]/7 cursor-pointer transition-all duration-200 ${!isExpanded ? 'mx-auto' : ''}`}
              disabled={isTransitioning}
            >
              <div className={`transition-transform duration-400 ${isTransitioning ? 'rotate-180' : ''}`}>
                {isExpanded ? (
                  <ChevronLeft size={18} />
                ) : (
                  <ChevronRight size={18} />
                )}
              </div>
            </Button>
          )}
        </div>

        {/* Menu Content */}
        <ScrollArea className="flex-1 px-2 py-4 relative z-10">
          <div className="space-y-4">
            {/* Principais */}
            <MenuSection>
              <MenuItem
                href="/menu"
                icon={<MdOutlineMenu size={iconSize} />}
                label="Menu Principal"
              />
            </MenuSection>

            {/* Eventos - Apenas para Administradores */}
            {userType === 'Administrador' && (
              <MenuSection title="Gestão de Eventos">
                <MenuItem
                  href="/adicionarevento"
                  icon={<MdOutlineEmojiEvents size={iconSize} />}
                  label="Adicionar Evento"
                />
                <MenuItem
                  href="/alterarevento"
                  icon={<MdOutlineEventRepeat size={iconSize} />}
                  label="Editar Evento"
                />
              </MenuSection>
            )}

            {/* Pedidos */}
            {(userType === 'Administrador' || userType === 'Funcionario Banca') && (
              <MenuSection title="Gestão de Pedidos">
                <MenuItem
                  href="/registarpedido"
                  icon={<LuNotebook size={iconSize} />}
                  label="Adicionar Pedido"
                />
                <MenuItem
                  href="/anularpedido"
                  icon={<LuNotebookPen size={iconSize} />}
                  label="Editar Pedido"
                />
              </MenuSection>
            )}

            {/* Inventário */}
            {userType === 'Administrador' && (
              <MenuSection title="Gestão de Inventário">
                <MenuItem
                  href="/adicionaritem"
                  icon={<IoAddCircleOutline size={iconSize} />}
                  label="Adicionar Produto"
                />
                <MenuItem
                  href="/alteraritem"
                  icon={<MdOutlineChangeCircle size={iconSize} />}
                  label="Editar Produto"
                />
              </MenuSection>
            )}

            {/* Administração */}
            {userType === 'Administrador' && (
              <MenuSection title="Administração">
                <MenuItem
                  href="/adicionarutilizador"
                  icon={<AiOutlineUserAdd size={iconSize} />}
                  label="Adicionar Utilizador"
                />
                <MenuItem
                  href="/verestatisticas"
                  icon={<FaRegEye size={iconSize} />}
                  label="Consultar Estatísticas"
                />
              </MenuSection>
            )}

            {/* Ajuda */}
            <MenuSection title="Suporte">
              <MenuItem
                href="/help"
                icon={<TbProgressHelp size={iconSize} />}
                label="Ajuda & Suporte"
              />
            </MenuSection>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-3 mt-auto w-full relative z-10">
          <div
            className={`transition-all duration-300 rounded-lg py-2 ${isExpanded ? 'w-full bg-[var(--cor-texto)]' : 'bg-transparent'
              }`}
          >
            <div className={`flex items-center space-x-3 transition-all duration-300 ${isExpanded ? 'px-2' : 'px-0'}`}>
              {/* Avatar */}
              <Avatar
                className={`h-10 w-10 border-2 transition-all duration-300 ${isExpanded
                    ? 'border-[var(--cor-fundo1)]/50 hover:border-[var(--cor-fundo1)]'
                    : 'border-[var(--cor-texto)]/50 hover:border-[var(--cor-texto)]'
                  }`}
              >
                <AvatarImage src="" alt={userName || ''} />
                <AvatarFallback
                  className={`transition-all duration-300 font-semibold ${isExpanded
                      ? 'bg-[var(--cor-texto)] text-[var(--cor-fundo1)]'
                      : 'bg-transparent text-[var(--cor-texto)]'
                    }`}
                >
                  {userName?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>

              {/* Info Utilizador (nome + tipo) */}
              {isExpanded && (
                <div className="flex flex-col justify-center items-center w-full transition-all duration-300">
                  <p className="text-sm text-[var(--cor-fundo1)] font-semibold truncate">
                    {userName}
                  </p>
                  <Badge
                    variant="default"
                    className={`bg-transparent text-xs transition-colors duration-200 truncate ${getUserTypeColor(userType)}`}
                  >
                    {userType}
                  </Badge>
                </div>
              )}

              {/* Botão das Definições (Roda Dentada) */}
              <div className="ml-auto">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[var(--cor-fundo1)] hover:text-[var(--cor-texto)] h-8 w-8 p-0 transition-all duration-300 hover:bg-[var(--cor-fundo1)] cursor-pointer"
                    >
                      <Settings size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link href={`/editarperfil/${encodeURIComponent(userName || '')}`}>
                        <FaUserLarge size={14} className="mr-2" />
                        Editar Perfil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-destructive focus:text-destructive"
                    >
                      <IoIosLogOut size={16} className="mr-2" />
                      Terminar Sessão
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </TooltipProvider>
  );
};