'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

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

export const Navigation = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userType, setUserType] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const router = useRouter();

  const iconSize = 20;

  useEffect(() => {
    if (!isLoggedIn) {
      setIsExpanded(true);
    }
  }, [isLoggedIn]);

  const toggleSidebar = () => {
    if (isLoggedIn && !isTransitioning) {
      setIsTransitioning(true);
      setIsExpanded(!isExpanded);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 400);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const savedSession = localStorage.getItem('session');
        if (savedSession) {
          const session = JSON.parse(savedSession);
          const user = session?.user;
          
          setIsLoggedIn(!!user);
          
          if (user) {
            setUserId(user.id);
            const { data, error } = await supabase
              .from('profiles')
              .select('tipo, nome')
              .eq('id', user.id)
              .single();

            if (data && !error) {
              setUserType(data.tipo);
              setUserName(data.nome);
            }
          }
        }
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setIsLoggedIn(false);
      setUserType(null);
      localStorage.removeItem('session');
      router.push('/login');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleLogin = async (session: any) => {
    try {
      localStorage.setItem('session', JSON.stringify(session));
      setIsLoggedIn(true);
      setUserId(session?.user.id);

      const { data, error } = await supabase
        .from('profiles')
        .select('tipo, nome')
        .eq('id', session?.user.id)
        .single();

      if (data && !error) {
        setUserType(data.tipo);
        setUserName(data.nome);
      }
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        handleLogin(session);
      } else {
        localStorage.removeItem('session');
        setIsLoggedIn(false);
        setUserType(null);
      }
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

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
        return 'text-[#B2533E]';
      case 'Funcionario de Banca':
        return 'text-[#186F65]';
      default:
        return 'text-gray-800';
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
          className={`w-full ${
            isExpanded 
              ? 'justify-start gap-3 px-3 py-2 h-auto' 
              : 'justify-center p-2 h-10 w-10'
          } text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-300 hover:scale-105 group`}
        >
          <div className="relative flex items-center">
            <div className="transition-transform duration-300 group-hover:rotate-3">
              {icon}
            </div>
            {notifications && (
              <Badge 
                variant="secondary" 
                className="absolute -top-1 -right-1 w-4 h-4 p-0 flex items-center justify-center text-xs bg-blue-500 text-white"
              >
                {notifications}
              </Badge>
            )}
          </div>
          {isExpanded && (
            <span className="whitespace-nowrap text-base font-normal text-[#032221] transition-opacity duration-300 cursor-pointer">
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
        className={`flex flex-col h-screen bg-[#FFFDF6] border-r border-border transition-all duration-400 ease-in-out ${
          isExpanded ? 'w-[280px]' : 'w-[70px]'
        } shadow-lg relative overflow-hidden`}
      >
        {/* Subtle gradient overlay for smooth transitions */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/5 to-transparent pointer-events-none opacity-50" />
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border relative z-10">
          <div className={`overflow-hidden transition-all duration-400 ease-out ${
            isExpanded ? 'opacity-100 max-w-[200px] transform translate-x-0' : 'opacity-0 max-w-0 transform -translate-x-4'
          }`}>
            <Link href="/" className="block">
              <Image 
                src="/OsMosenses.png" 
                alt="Logo" 
                width={140} 
                height={45} 
                priority 
                className="transition-all duration-300 hover:scale-105"
              />
            </Link>
          </div>
          
          {isLoggedIn && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className={`p-2 hover:bg-accent transition-all duration-300 hover:scale-110 ${!isExpanded ? 'mx-auto' : ''}`}
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
            {(userType === 'Administrador' || userType === 'Funcionario de Banca') && (
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
        <div className="p-3 mt-auto space-y-1 relative z-10">
          {!isLoggedIn ? (
            <Link href="/login" className="block w-full">
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 hover:scale-105">
                Iniciar Sessão
              </Button>
            </Link>
          ) : (
            <div className="bg-card/50 backdrop-blur-sm rounded-lg py-2 transition-all duration-300 hover:bg-card/70">
              <div className="flex justify-between items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-border transition-all duration-300 hover:border-primary/50">
                  <AvatarImage src="" alt={userName || ''} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {userName?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                {isExpanded && (
                  <div className={`flex-1 min-w-0 transition-all duration-400 ${
                    isExpanded ? 'opacity-100 transform translate-x-0' : 'opacity-0 transform -translate-x-4'
                  }`}>
                    <p className="text-sm font-semibold text-foreground truncate">
                      {userName}
                    </p>
                    <Badge 
                      variant="default" 
                      className={`bg-transparent text-xs transition-colors duration-200 ${getUserTypeColor(userType)}`}
                    >
                      {userType}
                    </Badge>
                  </div>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 transition-all duration-300 hover:scale-110 hover:bg-accent">
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
          )}
        </div>
      </nav>
    </TooltipProvider>
  );
};