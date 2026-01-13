import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-16 space-y-8">
        <header className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Política de Privacidade – Social Flow</h1>
        </header>

        <section className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <h2 className="text-xl font-semibold text-foreground">1. Introdução</h2>
          <p>
            Bem-vindo ao Social Flow. Esta Política de Privacidade descreve como coletamos, utilizamos, armazenamos e protegemos suas informações ao utilizar nossa plataforma, serviços e integrações. Ao acessar o Social Flow, você concorda com as práticas descritas neste documento.
          </p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <h2 className="text-xl font-semibold text-foreground">2. Informações Coletadas</h2>
          <p>Coletamos informações para garantir o funcionamento adequado do Social Flow e oferecer uma experiência personalizada.</p>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">2.1 Informações fornecidas pelo usuário</h3>
            <ul className="space-y-1 list-disc list-inside">
              <li>Nome</li>
              <li>E-mail</li>
              <li>Telefone</li>
              <li>Dados de login</li>
              <li>Informações de empresa ou negócio</li>
              <li>Preferências de uso</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">2.2 Informações coletadas automaticamente</h3>
            <ul className="space-y-1 list-disc list-inside">
              <li>Endereço IP</li>
              <li>Tipo de dispositivo</li>
              <li>Dados de navegação</li>
              <li>Cookies e tecnologias similares</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">2.3 Dados provenientes de integrações externas</h3>
            <p>
              Ao conectar redes sociais ou serviços de terceiros (Facebook/Meta, Instagram, TikTok, WhatsApp, LinkedIn, Telegram, entre outros), poderemos coletar:
            </p>
            <ul className="space-y-1 list-disc list-inside">
              <li>IDs de contas</li>
              <li>Tokens de autenticação</li>
              <li>Métricas de páginas</li>
              <li>Dados de interação</li>
              <li>Conteúdos autorizados</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <h2 className="text-xl font-semibold text-foreground">3. Finalidade do Uso das Informações</h2>
          <p>Usamos os dados para:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Operar o Social Flow e suas funcionalidades</li>
            <li>Gerar conteúdos, automações e análises</li>
            <li>Melhorar desempenho, segurança e personalização</li>
            <li>Realizar suporte técnico e atendimento ao cliente</li>
            <li>Cumprir obrigações legais</li>
          </ul>
        </section>

        <section className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <h2 className="text-xl font-semibold text-foreground">4. Compartilhamento de Informações</h2>
          <p>Podemos compartilhar informações apenas quando necessário:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Com prestadores de serviço essenciais (ex.: servidores, APIs externas)</li>
            <li>Com plataformas integradas</li>
            <li>Para cumprimento de obrigações legais</li>
          </ul>
          <p>Nunca vendemos ou comercializamos dados pessoais.</p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <h2 className="text-xl font-semibold text-foreground">5. Armazenamento e Segurança</h2>
          <p>
            Adotamos medidas técnicas e administrativas para proteger seus dados contra acesso não autorizado, perda ou destruição. Utilizamos criptografia, autenticação segura e políticas rígidas de acesso interno.
          </p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <h2 className="text-xl font-semibold text-foreground">6. Retenção de Dados</h2>
          <p>
            Mantemos os dados pelo tempo necessário para atender às finalidades previstas nesta Política, respeitando prazos legais e regulatórios.
          </p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <h2 className="text-xl font-semibold text-foreground">7. Direitos do Usuário</h2>
          <p>Você pode, a qualquer momento:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Solicitar acesso aos seus dados</li>
            <li>Corrigir informações incorretas</li>
            <li>Solicitar exclusão de dados</li>
            <li>Revogar consentimentos</li>
            <li>Solicitar portabilidade</li>
          </ul>
          <p>Para exercer seus direitos, entre em contato pelo suporte oficial do Social Flow.</p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <h2 className="text-xl font-semibold text-foreground">8. Cookies e Tecnologias Semelhantes</h2>
          <p>Utilizamos cookies para melhorar a experiência do usuário. Você pode gerenciar suas preferências pelo navegador.</p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <h2 className="text-xl font-semibold text-foreground">9. Integrações com Terceiros</h2>
          <p>
            O Social Flow integra serviços externos. Cada plataforma conectada possui sua própria política de privacidade. Recomendamos que o usuário verifique essas políticas.
          </p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <h2 className="text-xl font-semibold text-foreground">10. Transferência Internacional de Dados</h2>
          <p>
            Dependendo das integrações e serviços utilizados, seus dados podem ser processados fora do Brasil. Em todos os casos, seguimos padrões de segurança equivalentes ou superiores aos exigidos pela LGPD.
          </p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <h2 className="text-xl font-semibold text-foreground">11. Alterações na Política de Privacidade</h2>
          <p>Podemos atualizar esta Política a qualquer momento. Notificaremos mudanças significativas dentro da plataforma.</p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <h2 className="text-xl font-semibold text-foreground">12. Contato</h2>
          <p>
            Em caso de dúvidas, solicitações ou exercício de direitos relacionados à privacidade, entre em contato:
          </p>
          <p>
            <strong>E-mail:</strong>{" "}
            <a href="mailto:suporte@socialflow.com" className="text-primary hover:underline">
              suporte@socialflow.com
            </a>
          </p>
        </section>

        <footer className="pt-6 border-t border-border flex flex-wrap gap-4 text-sm text-muted-foreground">
          <Link to="/politica-de-privacidade" className="hover:text-primary">Política de Privacidade</Link>
          <Link to="/politica-de-privacidade/exclusao" className="hover:text-primary">Exclusão de Dados</Link>
          <Link to="/politica-de-privacidade/termos" className="hover:text-primary">Termos de Uso</Link>
        </footer>
      </div>
    </div>
  );
}
