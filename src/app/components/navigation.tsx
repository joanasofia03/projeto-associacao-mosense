'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// Importar Icons
import { MdOutlineMenu } from "react-icons/md";
import { MdOutlineCancel } from "react-icons/md";
import { IoAddCircleOutline } from "react-icons/io5";
import { CiEdit } from "react-icons/ci";
import { AiOutlineUserAdd } from "react-icons/ai";
import { FaRegEye } from "react-icons/fa";
import { CgArrowLeftO } from "react-icons/cg";
import { IoIosLogOut } from "react-icons/io";
import { TbProgressHelp } from "react-icons/tb";

export const Navigation = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userType, setUserType] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  //Quando a sessão finaliza ---> forçar a expansão da navbar
  useEffect(() => {
    if (!isLoggedIn) {
      setIsExpanded(true);
    }
  }, [isLoggedIn]);

  const toggleSidebar = () => { //Só permitir encolher a navbar se o utilizador estiver login
    if (isLoggedIn) {
      setIsExpanded(!isExpanded);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
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
      setLoading(false);
    };

    checkSession();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setUserType(null);
    localStorage.removeItem('session');
    router.push('/login');
  };

  const handleLogin = async (session: any) => {
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

  if (loading) return <div className="flex items-center justify-center h-screen">A carregar...</div>;

  //Tamanho fixo para todos os ícones
  const iconSize = 20;
  
  //Classes para os links com alinhamento consistente
  const linkClass = isExpanded 
    ? "flex items-center gap-3 w-full px-4 py-3 text-[#032221] hover:text-[#f1f6f7] hover:bg-[#032221] rounded-lg transition-all duration-200" 
    : "flex justify-center items-center w-full px-4 py-3 text-[#032221] hover:text-[#f1f6f7] hover:bg-[#032221] rounded-lg transition-all duration-200";

  //Menu item com notificação opcional
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
      <span className={`transition-all duration-300 ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'}`}>
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
    <div className="w-full space-y-1">
      {title && isExpanded && (
        <h3 className="text-xs font-medium text-gray-500 uppercase px-4 mt-3 mb-2">{title}</h3>
      )}
      {children}
    </div>
  );

  return (
    <nav className={`flex flex-col justify-between sticky top-0 left-0 h-screen bg-[#f1f6f7] transition-all duration-500 ${isExpanded ? 'w-75' : 'w-20'} shadow-md z-10`}>
      {/* Header */}
      <div className="px-4 py-6 border-b border-[rgba(114,120,133,0.1)]">
        <div className="flex items-center justify-between">
          <div className={`transition-opacity duration-500 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
            <Link href="/">
              <Image src="/OsMosenses.png" alt="Logo" width={120} height={40} />
            </Link>
          </div>
          {isLoggedIn && (
            <button 
              onClick={toggleSidebar} 
              className={`text-[#032221] hover:bg-gray-200 p-1 rounded-full transition-all ${isExpanded ? '' : 'mx-auto'}`}
            >
              <CgArrowLeftO
                size={iconSize}
                className={`transition-transform duration-500 ${!isExpanded ? 'rotate-180' : ''}`}
              />
            </button>
          )}
        </div>
      </div>

      {/* Exibição do Menu */}
      <div className="flex-1 flex flex-col space-y-2 py-4 px-2 overflow-y-auto">
        {/* Principais */}
        <MenuSection>
          <MenuItem 
            href="/menu" 
            icon={<MdOutlineMenu size={iconSize} />} 
            label="Menu" 
          />
        </MenuSection>

        {/* Pedidos - Apenas para Administradores e Funcionarios de Banca */}
        {(userType === 'Administrador' || userType === 'Funcionario de Banca') && (
          <MenuSection title={isExpanded ? "Gestão de Pedidos" : null}>
            <MenuItem 
              href="/registarpedido" 
              icon={<CiEdit size={iconSize} />} 
              label="Registar Pedido" 
            />
            <MenuItem 
              href="/anularpedido" 
              icon={<MdOutlineCancel size={iconSize} />} 
              label="Anular Pedido" 
            />
          </MenuSection>
        )}

        {/* Inventário - Apenas para Administradores */}
        {userType === 'Administrador' && (
          <MenuSection title={isExpanded ? "Gestão de Inventário" : null}>
            <MenuItem 
              href="/adicionaritem" 
              icon={<IoAddCircleOutline size={iconSize} />} 
              label="Adicionar Item" 
            />
            <MenuItem 
              href="/alteraritem" 
              icon={<CiEdit size={iconSize} />} 
              label="Alterar Item" 
            />
          </MenuSection>
        )}

        {/* Administração - Apenas para Administradores */}
        {userType === 'Administrador' && (
          <MenuSection title={isExpanded ? "Administração" : null}>
            <MenuItem 
              href="/adicionarutilizador" 
              icon={<AiOutlineUserAdd size={iconSize} />} 
              label="Adicionar Utilizador" 
            />
            <MenuItem 
              href="/verestatisticas" 
              icon={<FaRegEye size={iconSize} />} 
              label="Ver Estatísticas" 
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

            <Link 
              href="/registar"
              className="block w-full text-center px-4 py-2 my-5 rounded-md bg-[#03624c] text-[#f1f7f6] hover:opacity-90 transition-all duration-200"
            >
              Registar
            </Link>
          </div>
        )}
      </div>

{/* Footer */}
<div className="border-t border-[rgba(114,120,133,0.1)] pt-3 pb-4 px-3 mt-auto">
  {/* Ajuda visível sempre */}
  <Link href="/help" className={`${linkClass} mb-3`}>
    <TbProgressHelp size={iconSize} />
    <span className={`transition-all duration-300 ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'}`}>
      Ajuda
    </span>
  </Link>

  {isLoggedIn && (
    <>
      <div className={`flex items-center ${isExpanded ? 'justify-between' : 'justify-center'} px-2 py-2 mt-1 bg-gray-100 rounded-lg`}>
        <Link
  href={`/editarperfil/${encodeURIComponent(userName || '')}`} // fallback to empty string if userName is null
  className={`flex items-center transition-all duration-500 ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'}`}
>
  <Image src="/SimboloOsMosenses.png" alt="User Icon" width={30} height={30} className="rounded-full" />
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
    </>
  )}
</div>



    </nav>
  );
};