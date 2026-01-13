# Omnichannel FastAPI Integration

Integração omnichannel para conectar múltiplos canais com a plataforma Lovable.

## Configuração

1. Clone o repositório
2. Copie `.env.example` para `.env`
3. Configure as variáveis de ambiente
4. Instale as dependências: `pip install -r requirements.txt`
5. Execute: `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`

## Endpoints

- `POST /webhook/omnichannel` - Webhook para receber mensagens
- `POST /admin/register_connection` - Registrar conexões de canal

## Canais Suportados

- WhatsApp
- Instagram (em desenvolvimento)
- Facebook (em desenvolvimento)
- TikTok (em desenvolvimento)
- LinkedIn (em desenvolvimento)

## executar

# Criar ambiente virtual (opcional)
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate  # Windows

# Instalar dependências
pip install -r requirements.txt

# Criar arquivo .env com suas configurações
cp .env.example .env
# Editar .env com suas credenciais

# Executar a aplicação
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000