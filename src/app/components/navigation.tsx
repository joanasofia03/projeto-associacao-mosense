'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

//Import de Icons
import { MdOutlineMenu } from "react-icons/md";
import { MdOutlineCancel } from "react-icons/md";
import { IoAddCircleOutline } from "react-icons/io5";
import { CiEdit } from "react-icons/ci";
import { AiOutlineUserAdd } from "react-icons/ai";
import { FaRegEye } from "react-icons/fa";
import { CgArrowLeftO } from "react-icons/cg";
import { IoIosLogOut } from "react-icons/io";

export const Navigation = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userType, setUserType] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const checkSession = async () => {
      //Tenta recuperar o estado do localStorage - permite que a sessão seja restabelecida mesmo quando se muda de aba;
      const savedSession = localStorage.getItem('session');
      
      if (savedSession) {
        const session = JSON.parse(savedSession);
        const user = session?.user;
        setIsLoggedIn(!!user);
        
        if (user) {
          const { data, error } = await supabase
            .from('profiles')
            .select('tipo')
            .eq('id', user.id)
            .single();
          
          if (data && !error) {
            setUserType(data.tipo);
          }
        }
      }
      
      setLoading(false);
    };
    
    checkSession();
  }, []);

  //Função de Logout
  const handleLogout = async () => { 
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setUserType(null);
    localStorage.removeItem('session');
    router.push('/login');
  };

  //Função de Login
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

  //Listener de mudanças na autenticação tanto de login como de logout;
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        handleLogin(session); //Guardar a sessão ao fazer login;
      } else {
        localStorage.removeItem('session'); //Remover a sessão ao fazer logout;
        setIsLoggedIn(false);
        setUserType(null);
      }
    });
    
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  if (loading) return <div className="text-center">A carregar...</div>;

  return (
    <nav className="flex-col flex items-center justify-around min-w-75 sticky fixed" style={{ backgroundColor: '#f1f6f7' }}>
      <div className='py-6 flex flex-row justify-around items-center w-full'>
        <Link href="/">
          <Image src="/OsMosenses.png" alt="Logo" width={150} height={150} />
        </Link>
        <CgArrowLeftO size={20} color="#032221"/>
      </div>

      <div className="border-b border-[rgba(114,120,133,0.1)] py-0 w-65"></div>

      <div className="flex flex-col space-y-3 items-center py-10 h-full">
        <Link href="/menu" className="flex flex-row gap-2 items-center w-60 px-4 py-1 text-16 text-[#032221] hover:text-[#f1f6f7] hover:bg-[#032221] hover:rounded-xl">
          <MdOutlineMenu size={16}/>
          Menu
        </Link>
        
        <div className="border-b border-[rgba(114,120,133,0.1)] py-0 w-60"></div>

        {(userType === 'Administrador' || userType === 'Funcionario de Banca') && (
          <Link
            href="/registarpedido"
            className="flex flex-row w-60 gap-2 items-center text-16 px-4 py-1 text-[#032221] hover:text-[#f1f6f7] hover:bg-[#032221] hover:rounded-xl"
          >
            <CiEdit size={16}/>
            Registar Pedido
          </Link>
        )}

        {(userType === 'Administrador' || userType === 'Funcionario de Banca') && (
          <Link
            href="/anularpedido"
            className="flex flex-row w-60 gap-2 items-center text-16 px-4 py-1 text-[#032221] hover:text-[#f1f6f7] hover:bg-[#032221] hover:rounded-xl"
          >
            <MdOutlineCancel size={16}/>
            Anular Pedido
          </Link>
        )}

        {(userType === 'Administrador') && isLoggedIn && (
          <div className="border-b border-[rgba(114,120,133,0.1)] py-0 w-60"></div>
        )}

        {userType === 'Administrador' && (
          <Link
            href="/adicionaritem"
            className="flex flex-row w-60 gap-2 items-center text-16 px-4 py-1 text-[#032221] hover:text-[#f1f6f7] hover:bg-[#032221] hover:rounded-xl"
          >
            <IoAddCircleOutline size={16}/>
            Adicionar Item
          </Link>
        )}

        {userType === 'Administrador' && (
          <Link
            href="/alteraritem"
            className="flex flex-row w-60 gap-2 items-center text-16 px-4 py-1 text-[#032221] hover:text-[#f1f6f7] hover:bg-[#032221] hover:rounded-xl"
          >
            <CiEdit size={16}/>
            Alterar Item
          </Link>
        )}

        {(userType === 'Administrador') && isLoggedIn && (
          <div className="border-b border-[rgba(114,120,133,0.1)] py-0 w-60"></div>
        )}

        {userType === 'Administrador' && (
          <Link
            href="/adicionarutilizador"
            className="flex flex-row w-60 gap-2 items-center text-16 px-4 py-1 text-[#032221] hover:text-[#f1f6f7] hover:bg-[#032221] hover:rounded-xl"
          >
            <AiOutlineUserAdd size={16}/>
            Adicionar Utilizador
          </Link>
        )}

        {(userType === 'Administrador') && isLoggedIn && (
          <div className="border-b border-[rgba(114,120,133,0.1)] py-0 w-60"></div>
        )}

        {userType === 'Administrador' && (
          <Link
            href="/verestatisticas"
            className="flex flex-row w-60 gap-2 items-center text-16 px-4 py-1 text-[#032221] hover:text-[#f1f6f7] hover:bg-[#032221] hover:rounded-xl"
          >
            <FaRegEye size={16}/>
            Ver Estatísticas
          </Link>
        )}

        {(userType === 'Administrador') && isLoggedIn && (
          <div className="border-b border-[rgba(114,120,133,0.1)] py-0 w-60"></div>
        )}

        {!isLoggedIn && (
          <Link
            href="/login"
            className="flex justify-center w-60 px-4 py-2 rounded hover:opacity-90"
            style={{
              backgroundColor: '#03624c',
              color: '#f1f7f6',
            }}
          >
            Log In
          </Link>
        )}
      </div>

      {isLoggedIn && ( //Responsável pelo conteúdo do bottom navbar;
        <>
          <div className="border-b border-[rgba(114,120,133,0.1)] py-0 w-60"></div>

          <div className="flex flex-row items-center justify-between gap-3 w-65 py-6 px-2">
            <Image
              src="/SimboloOsMosenses.png"
              alt="Logo"
              width={30}
              height={30}
              className="rounded-full"
            />
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-xs text-[#032221] font-bold truncate">{userName}</span>
              <span className="text-xs text-[#032221] truncate">{userType}</span>
            </div>
            <IoIosLogOut
              onClick={handleLogout}
              size={20}
              className="cursor-pointer font-bold text-[#032221] hover:text-[#dc3545] transition duration-200 ease-in-out"
              title="Terminar sessão"
            />
          </div>
        </>
      )}
    </nav>
  );
};
