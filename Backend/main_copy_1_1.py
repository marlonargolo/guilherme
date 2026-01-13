# main.py - FastAPI Backend com CORS corrigido para desenvolvimento
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import httpx
from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="SocialFlow Backend", version="5.1.0")

# ==================== CORS CONFIGURADO PARA DESENVOLVIMENTO ====================
# Adicionar origens de desenvolvimento
allowed_origins = [
    "https://app.socialflow.aitonomy.ai",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:8080",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:8080",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Configuração do Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None

# ==================== CONFIGURAÇÕES ====================
WHATSAPP_SERVER_URL = os.getenv("WHATSAPP_SERVER_URL", "http://localhost:8001")
META_APP_ID = os.getenv("META_APP_ID", "")
META_APP_SECRET = os.getenv("META_APP_SECRET", "")
META_REDIRECT_URI = os.getenv("META_REDIRECT_URI", "https://app.socialflow.aitonomy.ai/oauth/callback")
INSTAGRAM_REDIRECT_URI = os.getenv("INSTAGRAM_REDIRECT_URI", "https://app.socialflow.aitonomy.ai/oauth/callback")

#novas features para tiktok linkedin e instagram

LINKEDIN_CLIENT_ID = os.getenv("LINKEDIN_CLIENT_ID", "")
LINKEDIN_CLIENT_SECRET = os.getenv("LINKEDIN_CLIENT_SECRET", "")
LINKEDIN_REDIRECT_URI = os.getenv("LINKEDIN_REDIRECT_URI", "https://app.socialflow.aitonomy.ai/oauth/callback")

TIKTOK_CLIENT_KEY = os.getenv("TIKTOK_CLIENT_KEY", "")
TIKTOK_CLIENT_SECRET = os.getenv("TIKTOK_CLIENT_SECRET", "")
TIKTOK_REDIRECT_URI = os.getenv("TIKTOK_REDIRECT_URI", "https://app.socialflow.aitonomy.ai/oauth/callback")

INSTAGRAM_CLIENT_ID = os.getenv("INSTAGRAM_CLIENT_ID", META_APP_ID)  # Mesmo do Meta
INSTAGRAM_CLIENT_SECRET = os.getenv("INSTAGRAM_CLIENT_SECRET", META_APP_SECRET)

INSTAGRAM_GRAPH_CLIENT_ID = "766470266421578"
INSTAGRAM_GRAPH_CLIENT_SECRET = "sfbb43a68e34d01eee1b121383d24a88f"
INSTAGRAM_GRAPH_REDIRECT_URI = "http://localhost:8000/oauth/instagram/callback"

# ==================== MODELS ====================
class IntegrationCredentials(BaseModel):
    username: str
    password: str

class Message(BaseModel):
    channel: str
    to: str
    message: str
    user_id: str
    meta: Optional[Dict[str, Any]] = {}

# ==================== MIDDLEWARE PARA LOGS ====================
@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"\n🌐 {request.method} {request.url.path}")
    print(f"   Origin: {request.headers.get('origin', 'N/A')}")
    print(f"   User-ID: {request.headers.get('x-user-id', 'N/A')}")
    
    response = await call_next(request)
    
    print(f"   Response: {response.status_code}")
    
    return response

# ==================== ENDPOINTS ====================
@app.get("/")
async def root():
    return {
        "service": "SocialFlow Backend API", 
        "version": "5.1.0", 
        "status": "running",
        "environment": "development" if "localhost" in allowed_origins[1] else "production"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "online", 
        "version": "5.1.0", 
        "timestamp": datetime.now().isoformat(),
        "whatsapp_server": WHATSAPP_SERVER_URL
    }

# ==================== OAUTH ACCOUNTS ====================
@app.get("/oauth/accounts")
async def get_connected_accounts(request: Request):
    print(f"📊 GET /oauth/accounts")
    user_id = request.headers.get("x-user-id")
    
    try:
        accounts = []
        
        # Buscar do Supabase se configurado
        if supabase:
            try:
                query = supabase.table("integrations").select("*")
                
                # Filtrar por user_id se fornecido
                if user_id:
                    query = query.eq("user_id", user_id)
                
                result = query.execute()
                
                for integration in result.data:
                    accounts.append({
                        "id": integration["id"],
                        "platform": integration["channel"],
                        "account_id": integration.get("credentials", {}).get("username", integration.get("id", "N/A")),
                        "account_name": integration.get("credentials", {}).get("username", "Conta Conectada"),
                        "status": integration["status"],
                        "connected_at": integration.get("last_sync", datetime.now().isoformat())
                    })
            except Exception as e:
                print(f"❌ Erro Supabase: {e}")
        
        return JSONResponse(content=accounts)
        
    except Exception as e:
        print(f"❌ Erro geral: {e}")
        return JSONResponse(content=[])

# ==================== FACEBOOK ====================
@app.get("/oauth/facebook/auth-url")
async def get_facebook_auth_url(request: Request):
    print(f"📱 GET /oauth/facebook/auth-url")
    
    if not META_APP_ID:
        return JSONResponse(content={"error": "Meta App ID não configurado"}, status_code=500)
    
    auth_url = (
        f"https://www.facebook.com/v18.0/dialog/oauth"
        f"?client_id={META_APP_ID}"
        f"&redirect_uri={META_REDIRECT_URI}"
        f"&scope=pages_manage_posts,pages_read_engagement,pages_manage_metadata"
        f"&response_type=code"
        f"&state=facebook_{datetime.now().timestamp()}"
    )
    
    return JSONResponse(content={"auth_url": auth_url})

@app.post("/oauth/facebook/connect")
async def connect_facebook(credentials: IntegrationCredentials, request: Request):
    print(f"🔗 POST /oauth/facebook/connect")
    user_id = request.headers.get("x-user-id", "default_user")
    
    try:
        integration_data = {
            "user_id": user_id,
            "channel": "facebook",
            "credentials": {
                "username": credentials.username,
                "connected_at": datetime.now().isoformat()
            },
            "status": "connected",
            "last_sync": datetime.now().isoformat(),
        }
        
        if supabase:
            try:
                supabase.table("integrations").insert(integration_data).execute()
            except Exception as e:
                print(f"⚠️  Erro Supabase: {e}")
        
        return JSONResponse(content={
            "success": True,
            "platform": "facebook",
            "username": credentials.username,
            "message": "Facebook conectado com sucesso!"
        })
        
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

# ==================== INSTAGRAM ====================
# ==================== INSTAGRAM GRAPH API OAUTH ====================
@app.get("/oauth/instagram/auth-url")
async def get_instagram_auth_url(request: Request):
    print(f"📸 GET /oauth/instagram/auth-url")
    
    if not INSTAGRAM_GRAPH_CLIENT_ID:
        return JSONResponse(
            content={"error": "Instagram Client ID não configurado"}, 
            status_code=500
        )
    
    # Scopes necessários para Instagram Graph API
    # Para postar: instagram_basic, instagram_content_publish, pages_read_engagement
    scopes = [
        "instagram_basic",  # Para ler perfil básico
        "instagram_content_publish",  # Para publicar conteúdo
        "pages_read_engagement",  # Para acessar páginas conectadas
        "pages_show_list"  # Para listar páginas
    ]
    
    state = f"instagram_{datetime.now().timestamp()}"
    
    auth_url = (
        f"https://www.facebook.com/v21.0/dialog/oauth"
        f"?client_id={INSTAGRAM_GRAPH_CLIENT_ID}"
        f"&redirect_uri={INSTAGRAM_GRAPH_REDIRECT_URI}"
        f"&scope={','.join(scopes)}"
        f"&state={state}"
        f"&response_type=code"
    )
    
    return JSONResponse(content={"auth_url": auth_url, "state": state})

@app.post("/oauth/instagram/callback")
async def instagram_callback(request: Request):
    print(f"📸 POST /oauth/instagram/callback")
    
    try:
        body = await request.json()
        code = body.get("code")
        user_id = request.headers.get("x-user-id", "default_user")
        
        if not code:
            return JSONResponse(
                content={"error": "Código de autorização não fornecido"}, 
                status_code=400
            )
        
        # 1. Trocar código por token de acesso
        token_url = "https://graph.facebook.com/v21.0/oauth/access_token"
        token_params = {
            "client_id": INSTAGRAM_GRAPH_CLIENT_ID,
            "client_secret": INSTAGRAM_GRAPH_CLIENT_SECRET,
            "redirect_uri": INSTAGRAM_GRAPH_REDIRECT_URI,
            "code": code
        }
        
        async with httpx.AsyncClient() as client:
            # Obter access_token
            token_response = await client.get(token_url, params=token_params)
            
            if token_response.status_code != 200:
                print(f"❌ Erro token: {token_response.text}")
                raise HTTPException(
                    status_code=400, 
                    detail="Falha ao obter token do Instagram"
                )
            
            token_info = token_response.json()
            access_token = token_info.get("access_token")
            
            if not access_token:
                raise HTTPException(
                    status_code=400,
                    detail="Token de acesso não recebido"
                )
            
            # 2. Obter informações do usuário
            user_url = f"https://graph.facebook.com/v21.0/me"
            user_params = {
                "access_token": access_token,
                "fields": "id,name,accounts{id,name,instagram_business_account{id,username,profile_picture_url}}"
            }
            
            user_response = await client.get(user_url, params=user_params)
            user_data = user_response.json()
            
            # 3. Encontrar conta do Instagram vinculada
            accounts = user_data.get("accounts", {}).get("data", [])
            instagram_account = None
            page_id = None
            
            for account in accounts:
                instagram_business_account = account.get("instagram_business_account")
                if instagram_business_account:
                    page_id = account.get("id")
                    instagram_account = instagram_business_account
                    break
            
            if not instagram_account:
                raise HTTPException(
                    status_code=400,
                    detail="Nenhuma conta do Instagram Business vinculada encontrada"
                )
            
            # 4. Obter token de longa duração (60 dias)
            long_lived_token_url = f"https://graph.facebook.com/v21.0/oauth/access_token"
            long_lived_params = {
                "grant_type": "fb_exchange_token",
                "client_id": INSTAGRAM_GRAPH_CLIENT_ID,
                "client_secret": INSTAGRAM_GRAPH_CLIENT_SECRET,
                "fb_exchange_token": access_token
            }
            
            long_lived_response = await client.get(long_lived_token_url, params=long_lived_params)
            long_lived_data = long_lived_response.json()
            long_lived_token = long_lived_data.get("access_token")
            
            # 5. Salvar no banco
            integration_data = {
                "user_id": user_id,
                "channel": "instagram",
                "credentials": {
                    "access_token": long_lived_token,
                    "instagram_account_id": instagram_account.get("id"),
                    "username": instagram_account.get("username"),
                    "profile_picture_url": instagram_account.get("profile_picture_url"),
                    "page_id": page_id,
                    "connected_at": datetime.now().isoformat(),
                    "expires_in": long_lived_data.get("expires_in", 5184000)  # 60 dias
                },
                "status": "connected",
                "last_sync": datetime.now().isoformat(),
            }
            
            if supabase:
                supabase.table("integrations").upsert(integration_data).execute()
            
            return JSONResponse(content={
                "success": True,
                "platform": "instagram",
                "account_name": instagram_account.get("username"),
                "account_id": instagram_account.get("id"),
                "profile_picture": instagram_account.get("profile_picture_url")
            })
            
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"❌ Erro Instagram callback: {e}")
        return JSONResponse(
            content={"error": str(e)}, 
            status_code=500
        )

# Função para postar no Instagram
@app.post("/instagram/post")
async def post_to_instagram(request: Request):
    print(f"📸 POST /instagram/post")
    
    try:
        body = await request.json()
        user_id = request.headers.get("x-user-id")
        
        if not user_id:
            return JSONResponse(
                content={"error": "User ID não fornecido"},
                status_code=400
            )
        
        # Buscar credenciais do usuário
        if supabase:
            result = supabase.table("integrations") \
                .select("*") \
                .eq("user_id", user_id) \
                .eq("channel", "instagram") \
                .execute()
            
            if not result.data:
                return JSONResponse(
                    content={"error": "Instagram não conectado"},
                    status_code=400
                )
            
            credentials = result.data[0]["credentials"]
            access_token = credentials.get("access_token")
            instagram_account_id = credentials.get("instagram_account_id")
            
            # Criar container de mídia
            if body.get("image_url"):
                # Para imagem
                create_container_url = f"https://graph.facebook.com/v21.0/{instagram_account_id}/media"
                container_data = {
                    "image_url": body.get("image_url"),
                    "caption": body.get("caption", ""),
                    "access_token": access_token
                }
            elif body.get("video_url"):
                # Para vídeo
                create_container_url = f"https://graph.facebook.com/v21.0/{instagram_account_id}/media"
                container_data = {
                    "video_url": body.get("video_url"),
                    "caption": body.get("caption", ""),
                    "media_type": "REELS" if body.get("is_reel") else "VIDEO",
                    "access_token": access_token
                }
            else:
                # Apenas texto
                create_container_url = f"https://graph.facebook.com/v21.0/{instagram_account_id}/media"
                container_data = {
                    "caption": body.get("caption", ""),
                    "access_token": access_token
                }
            
            async with httpx.AsyncClient() as client:
                # Criar container
                container_response = await client.post(create_container_url, data=container_data)
                container_result = container_response.json()
                
                if "id" not in container_result:
                    return JSONResponse(
                        content={"error": "Falha ao criar container de mídia"},
                        status_code=400
                    )
                
                container_id = container_result["id"]
                
                # Publicar container
                publish_url = f"https://graph.facebook.com/v21.0/{instagram_account_id}/media_publish"
                publish_data = {
                    "creation_id": container_id,
                    "access_token": access_token
                }
                
                publish_response = await client.post(publish_url, data=publish_data)
                publish_result = publish_response.json()
                
                if "id" in publish_result:
                    return JSONResponse(content={
                        "success": True,
                        "post_id": publish_result["id"],
                        "message": "Post publicado com sucesso!"
                    })
                else:
                    return JSONResponse(
                        content={"error": "Falha ao publicar"},
                        status_code=400
                    )
                
    except Exception as e:
        print(f"❌ Erro ao postar no Instagram: {e}")
        return JSONResponse(
            content={"error": str(e)},
            status_code=500
        )

# ==================== WHATSAPP ====================
@app.get("/whatsapp/status")
async def get_whatsapp_status(request: Request):
    print(f"📱 GET /whatsapp/status")
    user_id = request.headers.get("x-user-id", "default_user")
    
    try:
        whatsapp_url = WHATSAPP_SERVER_URL
        
        # Ajustar URL se necessário
        if not whatsapp_url.startswith("http"):
            whatsapp_url = f"http://{whatsapp_url}"
        
        headers = {"X-User-ID": user_id}
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{whatsapp_url}/whatsapp/status",
                headers=headers
            )
            data = response.json()
            
            print(f"   ✅ WhatsApp Status: {data.get('status', 'unknown')}")
            return JSONResponse(content=data)
            
    except httpx.TimeoutException:
        print(f"   ⏱️ Timeout ao conectar com WhatsApp Server")
        return JSONResponse(content={
            "userId": user_id,
            "status": "disconnected",
            "ready": False,
            "requiresQR": False,
            "error": "Timeout: Servidor WhatsApp não respondeu"
        })
    except httpx.ConnectError:
        print(f"   ❌ Erro de conexão com WhatsApp Server")
        return JSONResponse(content={
            "userId": user_id,
            "status": "error",
            "ready": False,
            "requiresQR": False,
            "error": "Servidor WhatsApp não está rodando"
        })
    except Exception as e:
        print(f"   ❌ Erro WhatsApp: {e}")
        return JSONResponse(content={
            "userId": user_id,
            "status": "error",
            "ready": False,
            "requiresQR": False,
            "error": str(e)
        })

@app.get("/whatsapp/qr")
async def get_whatsapp_qr(request: Request):
    print(f"📱 GET /whatsapp/qr")
    user_id = request.headers.get("x-user-id", "default_user")
    
    try:
        whatsapp_url = WHATSAPP_SERVER_URL
        
        if not whatsapp_url.startswith("http"):
            whatsapp_url = f"http://{whatsapp_url}"
        
        headers = {"X-User-ID": user_id}
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{whatsapp_url}/whatsapp/qr",
                headers=headers
            )
            data = response.json()
            
            print(f"   ✅ QR Code: {'disponível' if data.get('qrCode') else 'não disponível'}")
            return JSONResponse(content=data)
            
    except Exception as e:
        print(f"   ❌ Erro WhatsApp QR: {e}")
        return JSONResponse(content={
            "connected": False, 
            "qrCode": None,
            "error": str(e)
        })

@app.post("/whatsapp/restart")
async def restart_whatsapp(request: Request):
    print(f"🔄 POST /whatsapp/restart")
    user_id = request.headers.get("x-user-id", "default_user")
    
    try:
        whatsapp_url = WHATSAPP_SERVER_URL
        
        if not whatsapp_url.startswith("http"):
            whatsapp_url = f"http://{whatsapp_url}"
        
        headers = {
            "X-User-ID": user_id,
            "Content-Type": "application/json"
        }
        
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                f"{whatsapp_url}/whatsapp/restart",
                headers=headers
            )
            data = response.json()
            
            print(f"   ✅ Reiniciado com sucesso")
            return JSONResponse(content=data)
            
    except Exception as e:
        print(f"   ❌ Erro ao reiniciar: {e}")
        return JSONResponse(content={
            "success": False,
            "error": str(e)
        }, status_code=500)

@app.post("/whatsapp/send-message")
async def send_whatsapp_message(request: Request):
    print(f"📤 POST /whatsapp/send-message")
    user_id = request.headers.get("x-user-id", "default_user")
    
    try:
        body = await request.json()
        phone = body.get("phone")
        message = body.get("message")
        
        if not phone or not message:
            return JSONResponse(
                content={"success": False, "error": "Phone e message são obrigatórios"},
                status_code=400
            )
        
        whatsapp_url = WHATSAPP_SERVER_URL
        
        if not whatsapp_url.startswith("http"):
            whatsapp_url = f"http://{whatsapp_url}"
        
        headers = {
            "X-User-ID": user_id,
            "Content-Type": "application/json"
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{whatsapp_url}/whatsapp/send-message",
                headers=headers,
                json={"phone": phone, "message": message}
            )
            data = response.json()
            
            print(f"   ✅ Mensagem enviada")
            return JSONResponse(content=data)
            
    except Exception as e:
        print(f"   ❌ Erro ao enviar mensagem: {e}")
        return JSONResponse(content={
            "success": False,
            "error": str(e)
        }, status_code=500)

# ==================== MESSAGES ====================
@app.get("/api/messages/")
async def get_messages(limit: int = 200):
    return []

@app.post("/api/messages/send")
async def send_message(message: Message):
    return {
        "success": True,
        "message_id": f"msg_{datetime.now().timestamp()}",
        "status": "sent"
    }

# ==================== WEBHOOK ====================
@app.post("/webhook/whatsapp")
async def whatsapp_webhook(request: Request):
    print(f"🔔 POST /webhook/whatsapp")
    
    try:
        data = await request.json()
        print(f"   📩 Webhook recebido: {data.get('event', 'unknown')}")
        
        # Aqui você pode processar o webhook e salvar no banco
        if supabase and data.get("event") == "message_received":
            try:
                message_data = data.get("message", {})
                # Salvar mensagem no Supabase se necessário
                print(f"   💾 Mensagem de: {message_data.get('phone')}")
            except Exception as e:
                print(f"   ⚠️ Erro ao salvar webhook: {e}")
        
        return JSONResponse(content={"success": True})
        
    except Exception as e:
        print(f"   ❌ Erro no webhook: {e}")
        return JSONResponse(content={"success": False, "error": str(e)})

# ==================== ERROR HANDLER ====================
@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(
        content={"error": "Endpoint não encontrado", "path": request.url.path},
        status_code=404
    )


# ==================== LINKEDIN OAUTH ====================
@app.get("/oauth/linkedin/auth-url")
async def get_linkedin_auth_url(request: Request):
    print(f"💼 GET /oauth/linkedin/auth-url")
    
    if not LINKEDIN_CLIENT_ID:
        return JSONResponse(
            content={"error": "LinkedIn Client ID não configurado"}, 
            status_code=500
        )
    
    # Scopes necessários para o LinkedIn
    scopes = [
        "openid",
        "profile",
        "email",
        "w_member_social"  # Para postar conteúdo
    ]
    
    state = f"linkedin_{datetime.now().timestamp()}"
    
    auth_url = (
        f"https://www.linkedin.com/oauth/v2/authorization"
        f"?response_type=code"
        f"&client_id={LINKEDIN_CLIENT_ID}"
        f"&redirect_uri={LINKEDIN_REDIRECT_URI}"
        f"&scope={'+'.join(scopes)}"
        f"&state={state}"
    )
    
    return JSONResponse(content={"auth_url": auth_url, "state": state})

@app.post("/oauth/linkedin/callback")
async def linkedin_callback(request: Request):
    print(f"💼 POST /oauth/linkedin/callback")
    
    try:
        body = await request.json()
        code = body.get("code")
        user_id = request.headers.get("x-user-id", "default_user")
        
        if not code:
            return JSONResponse(
                content={"error": "Código de autorização não fornecido"}, 
                status_code=400
            )
        
        # Trocar código por token
        token_url = "https://www.linkedin.com/oauth/v2/accessToken"
        token_data = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": LINKEDIN_REDIRECT_URI,
            "client_id": LINKEDIN_CLIENT_ID,
            "client_secret": LINKEDIN_CLIENT_SECRET
        }
        
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                token_url,
                data=token_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            if token_response.status_code != 200:
                raise HTTPException(
                    status_code=400, 
                    detail="Falha ao obter token do LinkedIn"
                )
            
            token_info = token_response.json()
            access_token = token_info.get("access_token")
            
            # Buscar informações do perfil
            profile_response = await client.get(
                "https://api.linkedin.com/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            
            profile_data = profile_response.json()
            
            # Salvar no banco
            integration_data = {
                "user_id": user_id,
                "channel": "linkedin",
                "credentials": {
                    "access_token": access_token,
                    "profile_id": profile_data.get("sub"),
                    "name": profile_data.get("name"),
                    "email": profile_data.get("email"),
                    "picture": profile_data.get("picture"),
                    "connected_at": datetime.now().isoformat()
                },
                "status": "connected",
                "last_sync": datetime.now().isoformat(),
            }
            
            if supabase:
                supabase.table("integrations").upsert(integration_data).execute()
            
            return JSONResponse(content={
                "success": True,
                "platform": "linkedin",
                "account_name": profile_data.get("name"),
                "account_id": profile_data.get("sub")
            })
            
    except Exception as e:
        print(f"❌ Erro LinkedIn callback: {e}")
        return JSONResponse(
            content={"error": str(e)}, 
            status_code=500
        )

# ==================== TIKTOK OAUTH ====================
@app.get("/oauth/tiktok/auth-url")
async def get_tiktok_auth_url(request: Request):
    print(f"🎵 GET /oauth/tiktok/auth-url")
    
    if not TIKTOK_CLIENT_KEY:
        return JSONResponse(
            content={"error": "TikTok Client Key não configurado"}, 
            status_code=500
        )
    
    # Scopes necessários para o TikTok
    scopes = [
        "user.info.basic",
        "video.list",
        "video.upload"
    ]
    
    state = f"tiktok_{datetime.now().timestamp()}"
    
    auth_url = (
        f"https://www.tiktok.com/v2/auth/authorize/"
        f"?client_key={TIKTOK_CLIENT_KEY}"
        f"&scope={','.join(scopes)}"
        f"&response_type=code"
        f"&redirect_uri={TIKTOK_REDIRECT_URI}"
        f"&state={state}"
    )
    
    return JSONResponse(content={"auth_url": auth_url, "state": state})

@app.post("/oauth/tiktok/callback")
async def tiktok_callback(request: Request):
    print(f"🎵 POST /oauth/tiktok/callback")
    
    try:
        body = await request.json()
        code = body.get("code")
        user_id = request.headers.get("x-user-id", "default_user")
        
        if not code:
            return JSONResponse(
                content={"error": "Código de autorização não fornecido"}, 
                status_code=400
            )
        
        # Trocar código por token
        token_url = "https://open.tiktokapis.com/v2/oauth/token/"
        token_data = {
            "client_key": TIKTOK_CLIENT_KEY,
            "client_secret": TIKTOK_CLIENT_SECRET,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": TIKTOK_REDIRECT_URI
        }
        
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                token_url,
                json=token_data,
                headers={"Content-Type": "application/json"}
            )
            
            if token_response.status_code != 200:
                raise HTTPException(
                    status_code=400, 
                    detail="Falha ao obter token do TikTok"
                )
            
            token_info = token_response.json()
            access_token = token_info.get("data", {}).get("access_token")
            open_id = token_info.get("data", {}).get("open_id")
            
            # Buscar informações do usuário
            user_response = await client.get(
                "https://open.tiktokapis.com/v2/user/info/",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json"
                },
                params={"fields": "open_id,union_id,avatar_url,display_name"}
            )
            
            user_data = user_response.json().get("data", {}).get("user", {})
            
            # Salvar no banco
            integration_data = {
                "user_id": user_id,
                "channel": "tiktok",
                "credentials": {
                    "access_token": access_token,
                    "open_id": open_id,
                    "display_name": user_data.get("display_name"),
                    "avatar_url": user_data.get("avatar_url"),
                    "connected_at": datetime.now().isoformat()
                },
                "status": "connected",
                "last_sync": datetime.now().isoformat(),
            }
            
            if supabase:
                supabase.table("integrations").upsert(integration_data).execute()
            
            return JSONResponse(content={
                "success": True,
                "platform": "tiktok",
                "account_name": user_data.get("display_name"),
                "account_id": open_id
            })
            
    except Exception as e:
        print(f"❌ Erro TikTok callback: {e}")
        return JSONResponse(
            content={"error": str(e)}, 
            status_code=500
        )

# ==================== INSTAGRAM (INDIVIDUAL) OAUTH ====================
@app.get("/oauth/instagram-individual/auth-url")
async def get_instagram_individual_auth_url(request: Request):
    print(f"📸 GET /oauth/instagram-individual/auth-url")
    
    if not INSTAGRAM_CLIENT_ID:
        return JSONResponse(
            content={"error": "Instagram Client ID não configurado"}, 
            status_code=500
        )
    
    # Scopes para Instagram Basic Display API (conta pessoal)
    scopes = [
        "user_profile",
        "user_media"
    ]
    
    state = f"instagram_individual_{datetime.now().timestamp()}"
    
    auth_url = (
        f"https://api.instagram.com/oauth/authorize"
        f"?client_id={INSTAGRAM_CLIENT_ID}"
        f"&redirect_uri={INSTAGRAM_REDIRECT_URI}"
        f"&scope={','.join(scopes)}"
        f"&response_type=code"
        f"&state={state}"
    )
    
    return JSONResponse(content={"auth_url": auth_url, "state": state})

@app.post("/oauth/instagram-individual/callback")
async def instagram_individual_callback(request: Request):
    print(f"📸 POST /oauth/instagram-individual/callback")
    
    try:
        body = await request.json()
        code = body.get("code")
        user_id = request.headers.get("x-user-id", "default_user")
        
        if not code:
            return JSONResponse(
                content={"error": "Código de autorização não fornecido"}, 
                status_code=400
            )
        
        # Trocar código por token (short-lived)
        token_url = "https://api.instagram.com/oauth/access_token"
        token_data = {
            "client_id": INSTAGRAM_CLIENT_ID,
            "client_secret": INSTAGRAM_CLIENT_SECRET,
            "grant_type": "authorization_code",
            "redirect_uri": INSTAGRAM_REDIRECT_URI,
            "code": code
        }
        
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                token_url,
                data=token_data
            )
            
            if token_response.status_code != 200:
                raise HTTPException(
                    status_code=400, 
                    detail="Falha ao obter token do Instagram"
                )
            
            token_info = token_response.json()
            short_token = token_info.get("access_token")
            ig_user_id = token_info.get("user_id")
            
            # Trocar short-lived token por long-lived token (60 dias)
            long_token_url = "https://graph.instagram.com/access_token"
            long_token_params = {
                "grant_type": "ig_exchange_token",
                "client_secret": INSTAGRAM_CLIENT_SECRET,
                "access_token": short_token
            }
            
            long_token_response = await client.get(
                long_token_url,
                params=long_token_params
            )
            
            long_token_data = long_token_response.json()
            access_token = long_token_data.get("access_token", short_token)
            
            # Buscar informações do perfil
            profile_response = await client.get(
                f"https://graph.instagram.com/{ig_user_id}",
                params={
                    "fields": "id,username,account_type,media_count",
                    "access_token": access_token
                }
            )
            
            profile_data = profile_response.json()
            
            # Salvar no banco
            integration_data = {
                "user_id": user_id,
                "channel": "instagram",
                "credentials": {
                    "access_token": access_token,
                    "instagram_user_id": ig_user_id,
                    "username": profile_data.get("username"),
                    "account_type": profile_data.get("account_type"),
                    "media_count": profile_data.get("media_count"),
                    "connected_at": datetime.now().isoformat()
                },
                "status": "connected",
                "last_sync": datetime.now().isoformat(),
            }
            
            if supabase:
                supabase.table("integrations").upsert(integration_data).execute()
            
            return JSONResponse(content={
                "success": True,
                "platform": "instagram",
                "account_name": profile_data.get("username"),
                "account_id": ig_user_id
            })
            
    except Exception as e:
        print(f"❌ Erro Instagram callback: {e}")
        return JSONResponse(
            content={"error": str(e)}, 
            status_code=500
        )

# ==================== ENDPOINT PARA REFRESH DE TOKENS ====================
@app.post("/oauth/refresh-token/{platform}")
async def refresh_oauth_token(platform: str, request: Request):
    """
    Endpoint para renovar tokens expirados
    Útil para manter as integrações ativas
    """
    user_id = request.headers.get("x-user-id", "default_user")
    
    if not supabase:
        return JSONResponse(
            content={"error": "Supabase não configurado"}, 
            status_code=500
        )
    
    try:
        # Buscar integração atual
        result = supabase.table("integrations")\
            .select("*")\
            .eq("user_id", user_id)\
            .eq("channel", platform)\
            .execute()
        
        if not result.data:
            return JSONResponse(
                content={"error": "Integração não encontrada"}, 
                status_code=404
            )
        
        integration = result.data[0]
        credentials = integration.get("credentials", {})
        
        # Renovar token conforme a plataforma
        if platform == "instagram":
            # Instagram: renovar long-lived token
            async with httpx.AsyncClient() as client:
                refresh_url = "https://graph.instagram.com/refresh_access_token"
                refresh_params = {
                    "grant_type": "ig_refresh_token",
                    "access_token": credentials.get("access_token")
                }
                
                response = await client.get(refresh_url, params=refresh_params)
                new_token_data = response.json()
                
                credentials["access_token"] = new_token_data.get("access_token")
                credentials["token_refreshed_at"] = datetime.now().isoformat()
                
                supabase.table("integrations")\
                    .update({"credentials": credentials})\
                    .eq("id", integration["id"])\
                    .execute()
                
                return JSONResponse(content={
                    "success": True,
                    "message": "Token renovado com sucesso"
                })
        
        # Adicionar lógica para outras plataformas conforme necessário
        
        return JSONResponse(
            content={"error": "Refresh não implementado para esta plataforma"}, 
            status_code=501
        )
        
    except Exception as e:
        print(f"❌ Erro ao renovar token: {e}")
        return JSONResponse(
            content={"error": str(e)}, 
            status_code=500
        )
    
# ==================== MAIN ====================
if __name__ == "__main__":
    import uvicorn
    
    print("=" * 60)
    print("🚀 SocialFlow Backend v5.1.0")
    print("=" * 60)
    print(f"🌐 Servidor: http://localhost:9000")
    print(f"📱 WhatsApp Server: {WHATSAPP_SERVER_URL}")
    print(f"✅ CORS habilitado para desenvolvimento")
    print(f"   • localhost:3000")
    print(f"   • localhost:5173")
    print(f"   • localhost:8080")
    print(f"   • app.socialflow.aitonomy.ai")
    print("=" * 60)
    
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=9000,
        log_level="info"
    )
    