import Link from 'next/link';

export default function TermosPage() {
  return (
    <div className="min-h-screen pt-5 bg-[#f6faf5] text-[#032221] px-6 py-12 overflow-y-scroll">
        


        <div className="max-w-3xl mx-auto">
  <section className="mb-8">
    <p>
      Ao utilizar esta aplicação, o utilizador concorda em cumprir estes termos de utilização e a nossa política de privacidade.
      Reservamo-nos o direito de alterar estes termos a qualquer momento. Sempre que houver alterações relevantes, notificaremos os utilizadores.
      Para qualquer questão, <Link href="/" className="text-[#064e3b] underline hover:text-[#043d2c]">contacte os desenvolvedores</Link>.
    </p>
  </section>
  <h1 className="text-3xl font-bold mb-6">Política de privacidade</h1>

        <section className="mb-8">
  <h2 className="text-xl font-semibold mb-2">1. Recolha de Informação e Dados Pessoais</h2>
  <p>
    Para utilizar os nossos serviços, é necessário recolher e tratar alguns dados pessoais durante o processo de registo de conta na plataforma. 
    Recolhemos as seguintes informações: <strong>nome</strong>, <strong>e-mail</strong> e <strong>número de telemóvel</strong>.
    Estes dados são armazenados de forma segura e não são partilhados com terceiros sem o consentimento do utilizador.
  </p>
</section>

        <section className="mb-8">
  <h2 className="text-xl font-semibold mb-2">2. Tratamento e Finalidade dos Dados Recolhidos</h2>
  <p className="mb-4">
    Cada dado recolhido serve um propósito específico e contribui para o funcionamento eficaz e seguro da plataforma:
  </p>
  <ul className="list-disc list-inside space-y-2">
    <li>
      <strong>Nome:</strong> Utilizado para personalizar a experiência do utilizador e identificar os participantes nos eventos.
    </li>
    <li>
      <strong>E-mail:</strong> Necessário para comunicações importantes, como confirmação de registo, notificações de eventos e recuperação de conta.
    </li>
    <li>
      <strong>Número de telemóvel:</strong> Pode ser utilizado para contactos urgentes relacionados com eventos, garantindo um canal de comunicação direto e rápido.
    </li>
  </ul>
  <p className="mt-4">
    Estes dados não serão utilizados para fins comerciais nem partilhados com terceiros sem o consentimento explícito do utilizador. Apenas o nome e número de telefone serão públicos para os funcionários prestadores do serviços, os restantes servirão apenas para o correto funcionamento da aplicação, nunca sendo partilhados com outros utilizadores e clientes.
  </p>
</section>

<section className="mb-8">
  <h2 className="text-xl font-semibold mb-2">3. Prazo de Conservação dos Dados Pessoais</h2>
  <p>
    Conforme o <strong>Regulamento Geral de Proteção de Dados (RGPD)</strong>, os dados pessoais serão mantidos enquanto forem necessários e relevantes para a utilização contínua da aplicação, ou seja, enquanto o utilizador estiver registado nos serviços.
  </p>
</section>

<section className="mb-8">
  <h2 className="text-xl font-semibold mb-2">4. Eliminação de Conta e Revogação do Consentimento</h2>
  <p>
    O utilizador pode, a qualquer momento, revogar o seu consentimento e eliminar permanentemente os seus dados do sistema. Após a eliminação, nenhuma informação ficará acessível para outros utilizadores ou administradores. Também é possível solicitar a retificação dos dados.
  </p>
</section>

<section className="mb-8">
  <h2 className="text-xl font-semibold mb-2">5. Direitos do Utilizador</h2>
  <p className="mb-2">O utilizador possui os seguintes direitos em relação aos seus dados pessoais, conforme o RGPD:</p>
  <ul className="list-disc list-inside space-y-1">
    <li><strong>Direito à Informação:</strong> acesso a dados sobre o responsável pelo tratamento, finalidades, fundamentos legais, destinatários, transferências, prazos de conservação e demais direitos.</li>
    <li><strong>Direito à Informação (dados não recolhidos junto do titular):</strong> o titular será informado no prazo razoável, no máximo até 1 mês, ou na primeira comunicação.</li>
    <li><strong>Direito de Acesso:</strong> o utilizador pode solicitar uma cópia dos seus dados e informações sobre o tratamento.</li>
    <li><strong>Direito de Retificação:</strong> pode corrigir dados incorretos ou incompletos sem demora injustificada.</li>
    <li><strong>Direito ao Apagamento:</strong> pode solicitar a eliminação dos seus dados, exceto em casos legais, de interesse público ou defesa judicial.</li>
    <li><strong>Direito à Limitação do Tratamento:</strong> pode limitar o tratamento dos seus dados em determinadas situações, como oposição ou tratamento ilícito.</li>
    <li><strong>Direito à Portabilidade dos Dados:</strong> pode receber os seus dados em formato estruturado e transmiti-los a outro responsável.</li>
    <li><strong>Direito à Minimização de Dados:</strong> asseguramos a recolha apenas dos dados estritamente necessários para cada finalidade.</li>
  </ul>
  <p className="mt-2">
    Estes direitos podem ser exercidos através do acesso ao perfil disponível na barra de navegação da aplicação.
  </p>
</section>

        <h1 className="text-3xl font-bold mb-6">Termos de Uso</h1>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">1. Responsabilidades do Utilizador</h2>
          <p>
            O utilizador compromete-se a fornecer informações verdadeiras durante o registo e a não utilizar a aplicação para fins ilícitos ou abusivos. 
            Não nos responsabilizamos por danos causados pela utilização indevida da conta de utilizador (por exemplo, compartilhar a conta com terceiros) nem por ações ou contrangimentos provocados por terceiros que não estejam diretamente relacionados com os nossos serviços.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">2. Responsabilidade pela conta</h2>
          <p>
          O utilizador é responsável pela confidencialidade da sua palavra-passe e outras informações da conta. Caso haja suspeita de uso não autorizado, deve notificar-nos imediatamente.
          </p>
        </section>

        <p className="text-sm mt-10 pb-5 text-gray-600">Última atualização: 8 de maio de 2025</p>



      </div>

      

    </div>
  );
}
