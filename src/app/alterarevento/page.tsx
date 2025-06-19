'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { VerificacaoDePermissoes } from '../components/VerificacaoDePermissoes';
import { toast } from "sonner";
import { Toaster } from 'sonner';
import SearchBar from '../components/SearchBar';

// Import de icons
import { RiDeleteBin6Line } from "react-icons/ri";
import { MdOutlineEdit, MdClose, MdSave, MdSearch } from "react-icons/md";

// Shadcn/ui imports
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Evento = {
  id: string;
  nome: string;
  data_inicio: string;
  data_fim: string;
  criando_em: string;
  em_execucao: boolean;
};

function AlterarEvento() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  const [editingEvento, setEditingEvento] = useState<Evento | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Filtrar eventos baseado na pesquisa
  const filteredEventos = useMemo(() => {
    if (!search.trim()) return eventos;
    
    return eventos.filter(evento =>
      evento.nome.toLowerCase().includes(search.toLowerCase())
    );
  }, [eventos, search]);

  useEffect(() => {
    const fetchEventos = async () => {
      try {
        const { data, error } = await supabase
          .from('eventos')
          .select('*')
          .order('criando_em', { ascending: false });

        if (error) {
          console.error('Erro ao buscar eventos:', error);
          toast.error('Erro ao carregar eventos');
        } else {
          setEventos(data || []);
        }
      } catch (err) {
        console.error('Erro inesperado ao buscar eventos:', err);
        toast.error('Erro inesperado ao carregar eventos');
      } finally {
        setLoading(false);
      }
    };

    fetchEventos();
  }, []);

  const handleEditClick = (evento: Evento) => {
    setEditingEvento({ ...evento });
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    if (!editingEvento) return;
    
    setEditingEvento({ 
      ...editingEvento, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const handleCheckboxChange = (checked: boolean) => {
    if (!editingEvento) return;
    setEditingEvento({ 
      ...editingEvento, 
      em_execucao: checked 
    });
  };

  const handleSave = async () => {
    if (!editingEvento || !editingEvento.nome || !editingEvento.data_fim || !editingEvento.data_inicio) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setSaving(true);

    try {
      // Verificar se o nome já existe em outro evento
      const { data: existingEvents, error: checkError } = await supabase
        .from('eventos')
        .select('id')
        .ilike('nome', editingEvento.nome.trim())
        .neq('id', editingEvento.id);

      if (checkError) {
        toast.error('Erro ao verificar eventos existentes.');
        setSaving(false);
        return;
      }

      if (existingEvents && existingEvents.length > 0) {
        toast.error('Já existe outro evento com esse nome.');
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from('eventos')
        .update({
          nome: editingEvento.nome.trim(),
          data_inicio: editingEvento.data_inicio,
          data_fim: editingEvento.data_fim,
          em_execucao: editingEvento.em_execucao,
        })
        .eq('id', editingEvento.id);

      if (error) {
        if (error.message.includes('unico_evento_em_execucao')) {
          toast.error('Já existe um evento em execução. Finalize-o antes de marcar este como ativo.');
        } else {
          toast.error('Erro ao atualizar evento');
        }
        console.error('Erro ao atualizar evento:', error);
      } else {
        setEventos(eventos.map(ev => ev.id === editingEvento.id ? { ...editingEvento } : ev));
        toast.success('Evento atualizado com sucesso!');
        setIsModalOpen(false);
        setEditingEvento(null);
      }
    } catch (err) {
      console.error('Erro ao guardar evento:', err);
      toast.error('Erro desconhecido ao guardar o evento');
    }

    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('eventos').delete().eq('id', id);
      if (error) {
        toast.error('Erro ao excluir evento');
      } else {
        setEventos(eventos.filter(e => e.id !== id));
        toast.success('Evento excluído com sucesso!');
      }
    } catch (err) {
      toast.error('Erro inesperado ao excluir');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEvento(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#eaf2e9] flex items-center justify-center">
        <div className="text-[#032221] text-xl">Carregando eventos...</div>
      </div>
    );
  }

  const PlaceHolder = "Pesquisar eventos..." //Argumento para SearchBar;

  return (
    <div className="min-h-screen bg-[#eaf2e9] px-4 py-8">
      <Toaster position="bottom-right" />
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-[#032221] text-center">
          Gerir Eventos - Edição ou Exclusão
        </h1>

        {/* Barra de Pesquisa */}
        <div className="mb-6 flex flex-row justify-center items-center">
          <SearchBar search={search} setSearch={setSearch} PlaceHolder={PlaceHolder}/>
        </div>

        {filteredEventos.length === 0 ? (
          <div className="bg-[#FFFDF6] rounded-lg p-8 shadow-[1px_1px_3px_rgba(3,34,33,0.1)] text-center">
            <p className="text-[#032221] text-lg">
              {search.trim() ? 'Nenhum evento encontrado para a pesquisa.' : 'Nenhum evento encontrado.'}
            </p>
          </div>
        ) : (
          <div className="bg-[#FFFDF6] rounded-lg shadow-[1px_1px_3px_rgba(3,34,33,0.1)] overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-[#032221]/10">
                  <TableHead className="text-[#032221] font-semibold">Nome do Evento</TableHead>
                  <TableHead className="text-[#032221] font-semibold">Data Início</TableHead>
                  <TableHead className="text-[#032221] font-semibold">Data Fim</TableHead>
                  <TableHead className="text-[#032221] font-semibold">Criado em</TableHead>
                  <TableHead className="text-[#032221] font-semibold">Estado</TableHead>
                  <TableHead className="text-[#032221] font-semibold text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEventos.map((evento) => (
                  <TableRow 
                    key={evento.id} 
                    className="border-b border-[#032221]/5 hover:bg-[#eaf2e9]/30 transition-colors duration-200"
                  >
                    <TableCell className="font-medium text-[#032221]">
                      {evento.nome}
                    </TableCell>
                    <TableCell className="text-[#032221]/70">
                      {formatDate(evento.data_inicio)}
                    </TableCell>
                    <TableCell className="text-[#032221]/70">
                      {formatDate(evento.data_fim)}
                    </TableCell>
                    <TableCell className="text-[#032221]/70">
                      {formatDate(evento.criando_em)}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={evento.em_execucao ? "default" : "secondary"}
                        className={evento.em_execucao 
                          ? 'bg-[#DDEB9D] text-[#032221] hover:bg-[#DDEB9D]/80' 
                          : 'bg-[#f8d7da] text-[#032221] hover:bg-[#f8d7da]/80'
                        }
                      >
                        {evento.em_execucao ? 'Em Execução' : 'Não ativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          onClick={() => handleEditClick(evento)}
                          size="sm"
                          variant="botaoeditar"
                        >
                          <MdOutlineEdit className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="botaoeliminar"
                            >
                              <RiDeleteBin6Line className="w-4 h-4 mr-1" />
                              Eliminar
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-[#FFFDF6]">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-[#032221]">
                                Confirmar exclusão
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-[#032221]/70">
                                Tem certeza que deseja excluir o evento "{evento.nome}"? 
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-[#032221]/30 text-[#032221] hover:bg-[#032221]/5 cursor-pointer">
                                Cancelar
                              </AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDelete(evento.id)}
                                className="bg-[#7D0A0A] hover:bg-[#7D0A0A]/90 text-[#FFFDF6] cursor-pointer"
                              >
                                Confirmar exclusão
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Modal de Edição */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="bg-[#FFFDF6] max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold text-[#032221]">
                Editar Evento
              </DialogTitle>
            </DialogHeader>

            {editingEvento && (
              <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome" className="text-sm font-medium text-[#032221]">
                    Nome do Evento
                  </Label>
                  <Input
                    type="text"
                    id="nome"
                    name="nome"
                    value={editingEvento.nome}
                    onChange={handleInputChange}
                    className="border-[#032221] focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus:shadow-none"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_inicio" className="text-sm font-medium text-[#032221]">
                    Data de Início
                  </Label>
                  <Input
                    type="date"
                    id="data_inicio"
                    name="data_inicio"
                    value={editingEvento.data_inicio}
                    onChange={handleInputChange}
                    className="border-[#032221] focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus:shadow-none"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_fim" className="text-sm font-medium text-[#032221]">
                    Data de Fim
                  </Label>
                  <Input
                    type="date"
                    id="data_fim"
                    name="data_fim"
                    value={editingEvento.data_fim}
                    onChange={handleInputChange}
                    className="border-[#032221] focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus:shadow-none"
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="em_execucao"
                    checked={editingEvento.em_execucao}
                    onCheckedChange={handleCheckboxChange}
                    className="border-[#032221]/30 data-[state=checked]:bg-[#032221] data-[state=checked]:border-[#032221]"
                  />
                  <Label htmlFor="em_execucao" className="text-sm text-[#032221]">
                    Evento está em execução?
                  </Label>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    onClick={handleCloseModal}
                    variant="botaocancelar"
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    variant="botaoguardar"
                    className="flex-1"
                  >
                    {saving ? (
                      'Guardando...'
                    ) : (
                      <>
                        <MdSave className="w-4 h-4 mr-1" />
                        Guardar
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default VerificacaoDePermissoes(AlterarEvento, ['Administrador']);