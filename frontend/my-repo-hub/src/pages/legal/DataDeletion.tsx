import { Link } from "react-router-dom";

export default function DataDeletion() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-16 space-y-8">
        <header className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Política de Exclusão de Dados</h1>
          <p className="text-sm text-muted-foreground">Última atualização: 12 de novembro de 2025</p>
        </header>

        <section className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            A SocialFlow by Guilherme fornece mecanismos para que clientes e usuários solicitem a exclusão definitiva
            de dados processados em nossa plataforma. As solicitações podem ser enviadas pelo e-mail
            <a href="mailto:privacidade@socialflow.ai" className="text-primary hover:underline ml-1">privacidade@socialflow.ai</a>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">1. Procedimento</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Envie um e-mail com o assunto "Exclusão de Dados" informando CPF/CNPJ, e-mail cadastrado e ambiente (produção/teste).</li>
            <li>Validaremos a titularidade e, se necessário, solicitaremos comprovação adicional.</li>
            <li>Após a confirmação, iniciaremos a exclusão em até 7 dias úteis.</li>
            <li>Você receberá confirmação final quando o processo for concluído.</li>
          </ol>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">2. Dados impactados</h2>
          <p className="text-sm text-muted-foreground">
            A exclusão abrange registros armazenados em nossa infraestrutura, incluindo mensagens, comentários, credenciais de integração,
            automações e artefatos analíticos associados ao titular. Dados exigidos por lei ou necessários para resguardar direitos poderão ser
            mantidos pelo período legal, sendo posteriormente descartados.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">3. Backups</h2>
          <p className="text-sm text-muted-foreground">
            Backups criptografados são sobrescritos automaticamente conforme a política de retenção da SocialFlow. Em até 30 dias após a exclusão,
            nenhuma cópia residual fica disponível em nossos sistemas.
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
