import { Link } from "react-router-dom";

export default function TermsOfUse() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-16 space-y-8">
        <header className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Termos de Uso</h1>
          <p className="text-sm text-muted-foreground">Última atualização: 12 de novembro de 2025</p>
        </header>

        <section className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            Estes Termos regulam o uso da plataforma SocialFlow by Guilherme. Ao acessar ou utilizar o serviço,
            você concorda com as condições abaixo. Se não concordar, interrompa imediatamente o uso da plataforma.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">1. Serviços</h2>
          <p className="text-sm text-muted-foreground">
            Oferecemos recursos de gestão omnichannel, automações com IA, análises e integrações com redes sociais. A disponibilidade de cada
            recurso pode variar de acordo com o plano contratado e com aprovações de terceiros (Meta, TikTok, LinkedIn, etc.).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">2. Responsabilidades do usuário</h2>
          <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
            <li>Manter credenciais de acesso e tokens de integrações seguros e atualizados.</li>
            <li>Respeitar as políticas das plataformas integradas e a legislação aplicável.</li>
            <li>Garantir que possui autorização para processar dados pessoais dos contatos atendidos.</li>
            <li>Não utilizar a plataforma para envio de spam, atividades ilícitas ou conteúdo proibido.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">3. Limitação de responsabilidade</h2>
          <p className="text-sm text-muted-foreground">
            O serviço é fornecido "como está". Embora adotemos boas práticas de segurança e disponibilidade, não garantimos operação ininterrupta.
            Não nos responsabilizamos por perdas indiretas, lucros cessantes ou danos causados por interrupções de terceiros.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">4. Encerramento</h2>
          <p className="text-sm text-muted-foreground">
            Você pode cancelar a assinatura a qualquer momento. Podemos suspender ou encerrar o acesso em caso de violação destes Termos
            ou de leis aplicáveis. Dados serão tratados de acordo com nossa Política de Privacidade e Política de Exclusão.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">5. Contato</h2>
          <p className="text-sm text-muted-foreground">
            Para dúvidas ou negociações específicas, envie um e-mail para
            <a href="mailto:contato@socialflow.ai" className="text-primary hover:underline ml-1">contato@socialflow.ai</a>.
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
