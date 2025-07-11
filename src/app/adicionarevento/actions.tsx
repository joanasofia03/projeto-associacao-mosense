'use server'

import { createClient } from '../../utils/supabase/server'

export async function adicionarEventoAction(prevState: any, formData: FormData) {
  const nome = formData.get('nome') as string
  const data_inicio_str = formData.get('data_inicio') as string
  const data_fim_str = formData.get('data_fim') as string
  const em_execucao = formData.get('em_execucao') === 'true'

  //Validar os campos obrigatórios
  if(!nome || !data_inicio_str || !data_fim_str){
    return { success: false, message: 'Por favor, preencha todos os campos obrigatórios.' }
  }

  //Converter as string em formato Date
  const data_inicio = new Date(data_inicio_str)
  const data_fim = new Date(data_fim_str)

  //Validar as datas 
  if (isNaN(data_inicio.getTime()) || isNaN(data_fim.getTime())) {
    return { success: false, message: 'Datas inválidas. Por favor, verifique as datas de início e fim.' }
  }

  //Validar se a data final é posterior á data inicial
  if (data_fim <= data_inicio){
    return { success: false, message: 'A data final deve ser posterior à data inicial.' }
  }

  const supabase = await createClient()

  //Verificar se o evento já existe através do nome
  const { error: checkEventoError, data: checkEvento } = await supabase
    .from('eventos')
    .select('id')
    .ilike('nome', nome.trim())
    .single()

  //Se não houve algum erro na query e encontrou um evento -> significa que esse evento já existe
  if(!checkEventoError && checkEvento) {
    return { success: false, message: 'Já existe um evento com esse nome.' }
  }

  //Inserir um novo evento no Supabase
  const { error: addEventoError, data: addEventoData } = await supabase
    .from('eventos')
    .insert({
      nome: nome.trim(),
      data_inicio,
      data_fim,
      em_execucao,
    })
    .select()

  if (addEventoError || !addEventoData) {
    console.error('Erro ao adicionar evento', addEventoError)
    return { success: false, message: 'Erro ao adicionar evento. Por favor, tente novamente.' }
  }

  return { success: true, message: 'Evento adicionado com sucesso!' }
}