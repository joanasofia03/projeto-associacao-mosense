'use client';

import { useEffect, useState, ComponentType } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';

export function VerificacaoDePermissoes<P extends object>(
  WrappedComponent: ComponentType<P>,
  allowedTypes: string[] = []
) {
  const ProtectedComponent = (props: P) => {
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
      const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;

        if (!user) {
          router.push('/login');
          return;
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('tipo')
          .eq('id', user.id)
          .single();

        if (error || !data || (allowedTypes.length > 0 && !allowedTypes.includes(data.tipo))) {
          router.push('/login');
          return;
        }

        setLoading(false);
      };

      checkAuth();
    }, [router]);

    if (loading) return null;

    return <WrappedComponent {...props} />;
  };

  return ProtectedComponent;
}
