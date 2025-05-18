'use client';

import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// Icons
import { MdOutlineMenu } from "react-icons/md";
import { LuNotebookPen, LuNotebook } from "react-icons/lu";
import { IoAddCircleOutline } from "react-icons/io5";
import { MdOutlineChangeCircle } from "react-icons/md";
import { AiOutlineUserAdd } from "react-icons/ai";
import { FaRegEye } from "react-icons/fa";
import { CgArrowLeftO } from "react-icons/cg";
import { IoIosLogOut } from "react-icons/io";
import { TbProgressHelp } from "react-icons/tb";
import { FaUserLarge } from "react-icons/fa6";
import { MdOutlineEmojiEvents, MdOutlineEventRepeat } from "react-icons/md";

export const Navigation = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userType, setUserType] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const router = useRouter();

  // Tamanho fixo para todos os ícones
  const iconSize = 20;

  // Quando a sessão finaliza -> forçar a expansão da navbar
  useEffect(() => {
    if (!isLoggedIn) {
      setIsExpanded(true);
    }
  }, [isLoggedIn]);

  const toggleSidebar = () => {
    // Só permitir encolher a navbar se o utilizador estiver logado
    if (isLoggedIn && !isTransitioning) {
      setIsTransitioning(true);
      setIsExpanded(!isExpanded);
      // Remover o estado de transição após a animação completar
      setTimeout(() => {
        setIsTransitioning(false);
      }, 600); // Tempo igual à duração da transição CSS
    }
  };

  // Classes para os links com alinhamento consistente e espaçamento fixo
  const linkClass = useMemo(() => 
    isExpanded 
      ? "flex items-center gap-3 w-full px-4 py-3 text-[#032221] hover:text-[#FFFDF6] hover:bg-[#032221] rounded-lg transition-all duration-200 hover:-translate-y-[4px]" 
      : "flex justify-center items-center w-full px-4 py-3 text-[#032221] hover:text-[#FFFDF6] hover:bg-[#032221] rounded-lg transition-all duration-200 hover:-translate-y-[4px]",
    [isExpanded]
  );

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
      <div className="flex items-center justify-center h-screen bg-[#FFFDF6]">
        <div className="animate-pulse text-[#032221]">A carregar...</div>
      </div>
    );
  }

  // Menu item com notificação opcional
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
  }) => (
    <Link href={href} className={linkClass}>
      <div className="relative">
        {icon}
        {notifications && (
          <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center text-xs bg-blue-500 text-white rounded-full">
            {notifications}
          </span>
        )}
      </div>
      <span className={`whitespace-nowrap transition-all duration-300 ease-in-out ease-out ${
        isExpanded 
          ? 'opacity-100 max-w-[200px]' 
          : 'opacity-0 max-w-0 overflow-hidden'
      }`}>
        {label}
      </span>
    </Link>
  );

  const MenuSection = ({ 
    title = null, 
    children 
  }: { 
    title?: string | null; 
    children: React.ReactNode 
  }) => (
    <div className={`w-full ${isExpanded ? 'space-y-1' : 'space-y-5'}`}>
      {title && (
        <div className={`transition-all duration-300 ease-in-out ease-out ${
          isExpanded 
            ? 'px-4 mt-6 mb-2' 
            : 'px-2 mt-6 mb-2'
        }`}>
          {isExpanded ? (
            <h3 className="text-xs font-medium text-gray-500 uppercase">
              {title}
            </h3>
          ) : (
            <div className="w-full h-px bg-gray-300 rounded"></div>
          )}
        </div>
      )}
      {children}
    </div>
  );

  return (
    <nav 
      className={`flex flex-col justify-between sticky top-0 left-0 h-screen bg-[#FFFDF6] transition-all duration-600 ease-in-out ease-out ${
        isExpanded ? 'w-[240px]' : 'w-[70px]'
      } shadow-md z-10`}
    >
      {/* Header */}
      <div className="px-4 py-6 border-b border-[rgba(114,120,133,0.1)]">
        <div className="flex items-center justify-between">
          <div className={`overflow-hidden transition-all duration-600 ease-in-out ease-out ${
            isExpanded ? 'opacity-100 max-w-[150px]' : 'opacity-0 max-w-0'
          }`}>
            <Link href="/">
              <Image 
                src="/OsMosenses.png" 
                alt="Logo" 
                width={120} 
                height={40} 
                priority 
                className="transition-all duration-300"
              />
            </Link>
          </div>
          {isLoggedIn && (
            <button 
              onClick={toggleSidebar} 
              className={`text-[#032221] hover:bg-gray-200 p-1 rounded-full transition-all ${
                isExpanded ? '' : 'mx-auto'
              }`}
              disabled={isTransitioning}
            >
              <CgArrowLeftO
                size={iconSize}
                className={`transition-transform duration-600 ease-in-out ease-out ${
                  !isExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>
          )}
        </div>
      </div>

      {/* Exibição do Menu */}
      <div className="flex-1 flex flex-col py-4 px-2 overflow-hidden">
        {/* Principais */}
        <MenuSection>
          <MenuItem 
            href="/menu" 
            icon={<MdOutlineMenu size={iconSize} />} 
            label="Menu" 
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

        {/* Pedidos - Apenas para Administradores e Funcionarios de Banca */}
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

        {/* Inventário - Apenas para Administradores */}
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

        {/* Administração - Apenas para Administradores */}
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
              label="Consutar Estatísticas" 
            />
          </MenuSection>
        )}

        {/* Login */}
        {!isLoggedIn && (
          <div className="px-2 mt-6">
            <Link 
              href="/login" 
              className="block w-full text-center px-4 py-2 rounded-md bg-[#03624c] text-[#f1f7f6] hover:opacity-90 transition-all duration-200"
            >
              Iniciar Sessão
            </Link>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-[rgba(114,120,133,0.1)] pt-3 pb-4 px-3 mt-auto">
        {/* Ajuda */}
        <MenuItem 
          href="/help" 
          icon={<TbProgressHelp size={iconSize} />} 
          label="Ajuda" 
        />

        {isLoggedIn && (
          <div className={`flex items-center ${
            isExpanded ? 'justify-between' : 'justify-center'
          } px-2 py-2 mt-3 bg-gray-100 rounded-lg hover:bg-[rgba(3,98,76,0.1)] transition-colors cursor-pointer`}>
            <Link
              href={`/editarperfil/${encodeURIComponent(userName || '')}`}
              className={`flex items-center ${
                isExpanded ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0'
              } transition-all duration-600 ease-in-out ease-out overflow-hidden`}
            >
              <FaUserLarge size={25} className='text-[#032221]'/>
              <div className="ml-3 truncate">
                <p className="text-xs font-semibold text-[#032221] truncate">{userName}</p>
                <p className="text-xs text-[#032221] opacity-75 truncate">{userType}</p>
              </div>
            </Link>

            <button
              onClick={handleLogout}
              className="p-1 text-[#032221] hover:text-[#dc3545] hover:bg-gray-200 rounded-full transition-all"
              title="Terminar sessão"
            >
              <IoIosLogOut size={iconSize} />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};