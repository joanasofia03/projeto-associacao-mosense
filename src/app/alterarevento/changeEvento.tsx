'use client';

import { useState, useMemo } from 'react';
import SearchBar from '../components/SearchBar';
import { updateEventoAction, deleteEventoAction } from './actions';

// Import de icons
import { RiDeleteBin6Line } from "react-icons/ri";
import { MdOutlineEdit, MdSave } from "react-icons/md";

// Shadcn/ui imports
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Toaster } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

type Evento = {
  id: string;
  nome: string;
  data_inicio: string;
  data_fim: string;
  criando_em: string;
  em_execucao: boolean;
};

interface AlterarEventoProps {
  initialEventos: Evento[];
}

export default function AlterarEvento({ initialEventos }: AlterarEventoProps) {
  const [editingEvento, setEditingEvento] = useState<Evento | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');

  const filteredEventos = useMemo(() => {
    if(!search.trim()) return initialEventos;

    return initialEventos.filter(evento =>
      evento.nome.toLowerCase().includes(search.toLowerCase())
    );

  }, [search, initialEventos]);

  const handleEditClick = (evento: Evento) => {
    //Formatar as datas para o formato de input date
    const formatDateForInput = (dateString: string) => {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    };

      setEditingEvento({
        ...evento,
        data_inicio: formatDateForInput(evento.data_inicio),
        data_fim: formatDateForInput(evento.data_fim)
      });
      setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingEvento) return;
    const { name, value } = e.target;
    setEditingEvento({
      ...editingEvento,
      [name]: value
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
    if(!editingEvento) return;
    setSaving(true);

    try{
      const formData = new FormData();
      formData.append('id', editingEvento.id);
      formData.append('nome', editingEvento.nome);
      formData.append('data_inicio', editingEvento.data_inicio);
      formData.append('data_fim', editingEvento.data_fim);
      formData.append('em_execucao', String(editingEvento.em_execucao));

      const result = await updateEventoAction(formData);

      if(result.success){
        toast.success(result.message);
        handleCloseModal();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Erro inesperado ao atualizar evento.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      const result = await deleteEventoAction(id);

      if(result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Erro inesperado ao excluir evento.");
    } finally {
      setDeleting(false);
    }
  };

  //Formatação para exibição visual
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEvento(null);
  };

  const PlaceHolder = "Pesquisar eventos..." //Argumento para SearchBar;

  return (
    <div className="min-h-screen bg-[#eaf2e9] px-4 py-8">
      <Toaster position="bottom-right" />
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-[var(--cor-texto)] text-center">
          Gerir Eventos - Edição ou Exclusão
        </h1>

        {/* Barra de Pesquisa */}
        <div className="mb-6 flex flex-row justify-center items-center">
          <SearchBar search={search} setSearch={setSearch} PlaceHolder={PlaceHolder} />
        </div>

        {filteredEventos.length === 0 ? (
          <div className="bg-[var(--cor-fundo2)] rounded-lg p-8 shadow-[3px_3px_3px_3px_var(--cor-texto)]/2 text-center">
            <p className="text-[var(--cor-texto)] text-lg">
              {search.trim() ? 'Nenhum evento encontrado para a pesquisa.' : 'Nenhum evento encontrado.'}
            </p>
          </div>
        ) : (
          <div className="bg-[var(--cor-fundo2)] rounded-lg shadow-[3px_3px_3px_3px_var(--cor-texto)]/2 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-[var(--cor-texto)]/90">
                  <TableHead className="text-[var(--cor-fundo2)] font-semibold">Nome do Evento</TableHead>
                  <TableHead className="text-[var(--cor-fundo2)] font-semibold">Data Início</TableHead>
                  <TableHead className="text-[var(--cor-fundo2)] font-semibold">Data Fim</TableHead>
                  <TableHead className="text-[var(--cor-fundo2)] font-semibold">Criado em</TableHead>
                  <TableHead className="text-[var(--cor-fundo2)] font-semibold">Estado</TableHead>
                  <TableHead className="text-[var(--cor-fundo2)] font-semibold text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEventos.map((evento) => (
                  <TableRow
                    key={evento.id}
                    className="border-b border-[var(--cor-texto)]/5 hover:bg-[#eaf2e9]/30 transition-colors duration-200"
                  >
                    <TableCell className="font-medium text-[var(--cor-texto)]">
                      {evento.nome}
                    </TableCell>
                    <TableCell className="text-[var(--cor-texto)]/70">
                      {formatDate(evento.data_inicio)}
                    </TableCell>
                    <TableCell className="text-[var(--cor-texto)]/70">
                      {formatDate(evento.data_fim)}
                    </TableCell>
                    <TableCell className="text-[var(--cor-texto)]/70">
                      {formatDate(evento.criando_em)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={evento.em_execucao ? "default" : "secondary"}
                        className={evento.em_execucao
                          ? 'bg-[#DDEB9D] text-[var(--cor-texto)] hover:bg-[#DDEB9D]/80'
                          : 'bg-[#f8d7da] text-[var(--cor-texto)] hover:bg-[#f8d7da]/80'
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
                          <AlertDialogContent className="bg-[var(--cor-fundo2)]">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-[var(--cor-texto)]">
                                Confirmar exclusão
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-[var(--cor-texto)]/70">
                                Tem certeza que deseja excluir o evento "{evento.nome}"?
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-[var(--cor-texto)]/30 text-[var(--cor-texto)] hover:bg-[var(--cor-texto)]/5 cursor-pointer">
                                Cancelar
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(evento.id)}
                                className="bg-[#7D0A0A] hover:bg-[#7D0A0A]/90 text-[var(--cor-fundo2)] cursor-pointer"
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
          <DialogContent className="w-full max-w-md bg-[var(--cor-fundo2)] shadow-[3px_3px_3px_3px_var(--cor-texto)]/2">
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold text-[var(--cor-texto)]">
                Editar Evento
              </DialogTitle>
              <DialogDescription className="text-[var(--cor-texto)]/70">
                Atualize facilmente os detalhes do evento.
              </DialogDescription>
            </DialogHeader>

            {editingEvento && (
              <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome" className="text-sm font-medium text-[var(--cor-texto)]">
                    Nome do Evento
                  </Label>
                  <Input
                    type="text"
                    id="nome"
                    name="nome"
                    value={editingEvento.nome}
                    onChange={handleInputChange}
                    className="border-[var(--cor-texto)] focus-visible:ring-0"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_inicio" className="text-sm font-medium text-[var(--cor-texto)]">
                    Data de Início
                  </Label>
                  <Input
                    type="date"
                    id="data_inicio"
                    name="data_inicio"
                    value={editingEvento.data_inicio}
                    onChange={handleInputChange}
                    className="border-[var(--cor-texto)] focus-visible:ring-0"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_fim" className="text-sm font-medium text-[var(--cor-texto)]">
                    Data de Fim
                  </Label>
                  <Input
                    type="date"
                    id="data_fim"
                    name="data_fim"
                    value={editingEvento.data_fim}
                    onChange={handleInputChange}
                    className="border-[var(--cor-texto)] focus-visible:ring-0"
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="em_execucao"
                    checked={editingEvento.em_execucao}
                    onCheckedChange={handleCheckboxChange}
                    className="border-[var(--cor-texto)]/30 data-[state=checked]:bg-[var(--cor-texto)] data-[state=checked]:border-[var(--cor-texto)]"
                  />
                  <Label htmlFor="em_execucao" className="text-sm text-[var(--cor-texto)]">
                    Evento está em execução?
                  </Label>
                </div>

                <div className="flex gap-3">
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
                      'A guardar...'
                    ) : (
                      <>
                        Guardar
                        <MdSave className="w-4 h-4" />
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
