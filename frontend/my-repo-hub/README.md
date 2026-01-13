# SocialFlow Frontend

PWA em React/Vite que serve o painel oficial do SocialFlow. Aqui os usuários administram inbox omnichannel, automações de DM, prompts da IA e integrações (Meta, TikTok, LinkedIn, Telegram, etc).

## Principais recursos
- Inbox e automações de DM utilizando as APIs do backend FastAPI.
- Gestão de planos via Supabase (`subscription_plans`, `ai_prompts`, `integrations`).
- Assistentes de IA (chat, conteúdo, prompts) conectados diretamente ao OpenAI.
- Integrações com WhatsApp/Instagram/Facebook/TikTok/LinkedIn/Telegram e provedores de e-mail.

## Stack
- React 18 + Vite + TypeScript
- Tailwind + shadcn/ui
- Supabase JS SDK
- Framer Motion / Lucide Icons

## Pré‑requisitos
- Node.js 18+
- Conta Supabase (para `SUPABASE_URL`/`SUPABASE_ANON_KEY`)
- Chave OpenAI (`OPENAI_API_KEY`)

## Configuração
```bash
npm install
cp .env.example .env.local   # preencha SUPABASE_URL/KEY e OPENAI_API_KEY
npm run dev                  # http://localhost:5173
npm run build                # build de produção
```

## Variáveis usadas no front
| Variável | Descrição |
| --- | --- |
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | chave pública Supabase |
| `VITE_API_URL` | URL do backend FastAPI (App Runner) |

No Supabase (Edge Functions) configure também:
- `OPENAI_API_KEY`
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `WEBHOOK_SECRET` para webhooks omnichannel

## Testes e lint
```bash
npm run lint
npm run build
```

Qualquer ajuste em IA ou integrações deve ser refletido nas funções em `supabase/functions` e nos módulos em `src/lib`. Dúvidas? Abra uma issue no repositório principal. 
