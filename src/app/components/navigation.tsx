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
import { IoSettingsOutline } from "react-icons/io5";

export const Navigation = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userType, setUserType] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [isExpanded, setIsExpanded] = useState(true);

  // Quando a sessão é finalizada, force a expansão da navbar
  useEffect(() => {
    if (!isLoggedIn) {
      setIsExpanded(true);
    }
  }, [isLoggedIn]);

  const toggleSidebar = () => {
    // Só permite encolher a navbar se o usuário estiver logado
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

  if (loading) return <div className="text-center">A carregar...</div>;

  // Tamanho fixo para todos os ícones
  const iconSize = 20;
  
  // Classes para os links com alinhamento consistente
  const linkClass = isExpanded 
    ? "flex items-center gap-2 w-full px-4 py-2 text-[#032221] hover:text-[#f1f6f7] hover:bg-[#032221] rounded-xl transition-all duration-200" 
    : "flex justify-center items-center w-full px-4 text-[#032221] hover:text-[#f1f6f7] hover:bg-[#032221] rounded-xl transition-all duration-200";
  
  const separator = <div className="border-b border-[rgba(114,120,133,0.1)] w-full my-1" />;

  return (
    <nav className={`flex flex-col justify-between sticky fixed top-0 left-0 h-screen bg-[#f1f6f7] transition-all duration-500 ${isExpanded ? 'w-75' : 'w-20'} shadow-md`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-6">
        <div className={`transition-opacity duration-500 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
          <Link href="/">
            <Image src="/OsMosenses.png" alt="Logo" width={120} height={40} />
          </Link>
        </div>
        {isLoggedIn && (
          <button onClick={toggleSidebar} className={isExpanded ? '' : 'mx-auto'}>
            <CgArrowLeftO
              size={iconSize}
              className={`text-[#032221] transition-transform duration-500 ${!isExpanded ? 'rotate-180' : ''}`}
            />
          </button>
        )}
      </div>

      {/* Menu */}
      <div className="flex-1 flex flex-col items-start gap-2 px-2 overflow-y-auto">
        <Link href="/menu" className={linkClass}>
          <MdOutlineMenu size={iconSize} />
          <span className={`transition-all duration-500 ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'}`}>Menu</span>
        </Link>

        {(userType === 'Administrador' || userType === 'Funcionario de Banca') && (
          <>
            {separator}
            <Link href="/registarpedido" className={linkClass}>
              <CiEdit size={iconSize} />
              <span className={`transition-all duration-500 ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'}`}>Registar Pedido</span>
            </Link>
            <Link href="/anularpedido" className={linkClass}>
              <MdOutlineCancel size={iconSize} />
              <span className={`transition-all duration-500 ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'}`}>Anular Pedido</span>
            </Link>
          </>
        )}

        {(userType === 'Administrador') && (
          <>
            {separator}
            <Link href="/adicionaritem" className={linkClass}>
              <IoAddCircleOutline size={iconSize} />
              <span className={`transition-all duration-500 ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'}`}>Adicionar Item</span>
            </Link>
            <Link href="/alteraritem" className={linkClass}>
              <CiEdit size={iconSize} />
              <span className={`transition-all duration-500 ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'}`}>Alterar Item</span>
            </Link>
            {separator}
            <Link href="/adicionarutilizador" className={linkClass}>
              <AiOutlineUserAdd size={iconSize} />
              <span className={`transition-all duration-500 ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'}`}>Adicionar Utilizador</span>
            </Link>
            <Link href="/verestatisticas" className={linkClass}>
              <FaRegEye size={iconSize} />
              <span className={`transition-all duration-500 ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'}`}>Ver Estatísticas</span>
            </Link>
          </>
        )}

        {!isLoggedIn && (
          <>
            {separator}
            <div className="w-full flex">
              <Link href="/login" className="w-full text-center px-4 py-2 rounded-md bg-[#03624c] text-[#f1f7f6] hover:opacity-90 transition-all duration-200">
                Log In
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      {isLoggedIn && (
        <div className="px-2 py-6">
          {(userType === 'Administrador' || userType === 'Funcionario de Banca') && (
            <>
              <Link href="/settings" className={linkClass}>
                <IoSettingsOutline size={iconSize} />
                <span className={`transition-all duration-500 ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden py-3'}`}>Definições</span>
              </Link>
            </>
          )}

          <div className={`flex items-center ${isExpanded ? 'justify-between' : 'justify-center'} mt-3 border-t border-[rgba(114,120,133,0.1)] pt-4 px-2`}>
            <div className={`flex items-center transition-all duration-500 ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'}`}>
              <Image src="/SimboloOsMosenses.png" alt="User Icon" width={30} height={30} className="rounded-full" />
              <div className="ml-3 truncate">
                <p className="text-xs font-semibold text-[#032221] truncate">{userName}</p>
                <p className="text-xs text-[#032221] truncate">{userType}</p>
              </div>
            </div>
            <IoIosLogOut
              onClick={handleLogout}
              size={iconSize}
              className="text-[#032221] hover:text-[#dc3545] cursor-pointer"
              title="Terminar sessão"
            />
          </div>
        </div>
      )}
    </nav>
  );
};