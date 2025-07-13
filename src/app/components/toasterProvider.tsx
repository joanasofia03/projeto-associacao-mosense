// components/toaster-provider.tsx
'use client';
import { Toaster } from 'sonner';
import { toast } from 'sonner';

export function ToasterProvider() {
  return <Toaster position="bottom-right" />;
}

export function toastMessage(message: string, status: string) {
  if (status == 'error') {
    return toast.error(message)
  }
  return toast.success(message)
}
