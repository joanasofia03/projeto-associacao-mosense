'use client'

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '../../../utils/supabase/client'

import { LogOutAction, refreshUserData } from './actions'
import type { UserType } from './actions'

//shadcn/ui components
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

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

interface InitialUserData {
  isLoggedIn: boolean;
  userName: string | null;
  userType: string | null;
  error: string | null;
}

interface NavigationClientProps {
  initialUserData: InitialUserData;
}

const iconSize = 20;

export const Navigation = ({ initialUserData }: NavigationClientProps) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(initialUserData.isLoggedIn)
  const [isExpanded, setIsExpanded] = useState<boolean>(true)
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false)
  const [userType, setUserType] = useState<string | null>(initialUserData.userType)
  const [userName, setUserName] = useState<string | null>(initialUserData.userName)
  const [loading, setLoading] = useState<boolean>(false)

  const router = useRouter();

  //Função para atualizar dados do utilizador
  const updateUserData = useCallback(async () => {
    try {
      const userData = await refreshUserData()

      if (userData.error) {
        console.error('Erro ao atualizar dados', userData.error)
        if (userData.error.includes('Sessão inválida')) {
          handleAuth(false, null, null)
          router.push('/login')
        }
        return
      }

      if (userData.user && userData.profile) {
        handleAuth(true, userData.profile.nome, userData.profile.tipo)
      } else {
        handleAuth(false, null, null)
      }
    } catch (error) {
      console.error('Erro ao buscar utilizador:', error)
      toast.error('Erro ao carregar dados do utilizador')
    }
  }, [router])

  useEffect(() => {
    if (initialUserData.error) {
      toast.error(initialUserData.error)
    }

    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          setIsLoggedIn(true)
          await updateUserData();
          setIsLoggedIn(false)
          router.refresh();
        } else if (event === 'SIGNED_OUT') {
          handleAuth(false, null, null);
          router.push('/login');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [initialUserData.error, router, updateUserData]);

  //Sincronizar o estado do utilizador com os dados iniciais
  useEffect(() => {
    setIsLoggedIn(initialUserData.isLoggedIn);
    setUserName(initialUserData.userName);
    setUserType(initialUserData.userType);
  }, [initialUserData]);

  const handleLogout = useCallback(async () => {
    setLoading(true)

    try {
      const result = await LogOutAction()

      if (result.success) {
        handleAuth(false, null, null)
        toast.success('Sessão terminada com sucesso!')
        router.push('/login')
      } else {
        toast.error(result.error || 'Erro ao terminar sessão')
      }
    } catch (error) {
      console.error('Erro no logout:', error)
      toast.error('Erro inesperado ao terminar sessão')
    } finally {
      setLoading(false)
    }
  }, [router])

  const handleAuth = useCallback((LoggedIn: boolean, name: string | null, type: UserType | null) => {
    setIsLoggedIn(LoggedIn)
    setUserName(name)
    setUserType(type)
  }, [])

  const toggleSidebar = useCallback(() => {
    if (isLoggedIn && !isTransitioning) {
      setIsTransitioning(true);
      setIsExpanded(!isExpanded);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 400);
    }
  }, [isLoggedIn, isTransitioning, isExpanded]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <div className="text-muted-foreground">A carregar...</div>
        </div>
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
        className={`flex flex-col h-screen bg-[var(--cor-fundo2)] transition-all duration-400 ease-in-out ${isExpanded ? 'w-[280px]' : 'w-[70px]'
          } shadow-lg relative overflow-hidden`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/5 to-transparent pointer-events-none opacity-50" />

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

        <ScrollArea className="flex-1 px-2 py-4 relative z-10">
          <div className="space-y-4">
            <MenuSection>
              <MenuItem
                href="/menu"
                icon={<MdOutlineMenu size={iconSize} />}
                label="Menu Principal"
              />
            </MenuSection>

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

            {(userType === 'Administrador' || userType === 'Funcionario Banca') && (
              <MenuSection title="Gestão de Pedidos">
                <MenuItem
                  href="/adicionarpedido"
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

            <MenuSection title="Suporte">
              <MenuItem
                href="/help"
                icon={<TbProgressHelp size={iconSize} />}
                label="Ajuda & Suporte"
              />
            </MenuSection>
          </div>
        </ScrollArea>

        <div className="p-3 mt-auto w-full relative z-10">
          {!isLoggedIn ? (
            <Link href="/login" className="block w-full">
              <Button className="mt-3 w-full bg-[var(--cor-texto)] text-[#FFFDF6] hover:bg-[var(--cor-texto)]/90 cursor-pointer transition-all duration-300">
                Iniciar Sessão
              </Button>
            </Link>
          ) : (
            <div
              className={`transition-all duration-300 rounded-lg py-2 ${isExpanded ? 'w-full bg-[var(--cor-texto)]' : 'bg-transparent'}`}
            >
              <div className={`flex items-center space-x-3 transition-all duration-300 ${isExpanded ? 'px-2' : 'px-0'}`}>
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

                {isExpanded && (
                  <div className="flex flex-col justify-center items-center w-full transition-all duration-300">
                    <p className="text-sm text-[var(--cor-fundo1)] font-semibold truncate">{userName}</p>
                    <Badge
                      variant="default"
                      className={`bg-transparent text-xs transition-colors duration-200 truncate ${getUserTypeColor(userType)}`}
                    >
                      {userType}
                    </Badge>
                  </div>
                )}

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
                      <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                        <IoIosLogOut size={16} className="mr-2" />
                        Terminar Sessão
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
    </TooltipProvider>
  );
};