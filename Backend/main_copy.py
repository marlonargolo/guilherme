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
from typing import Dict, List, Optional
import json
import time

load_dotenv()

app = FastAPI(title="SocialFlow Backend", version="5.2.0")

# ==================== CORS CORRIGIDO ====================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://app.socialflow.aitonomy.ai",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:8080",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# ==================== HANDLER OPTIONS GLOBAL ====================
@app.options("/{full_path:path}")
async def options_handler(full_path: str):
    """Handler para requisições OPTIONS (preflight CORS)"""
    return JSONResponse(
        content={"message": "OK"},
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Max-Age": "3600",
        }
    )
# Configuração do Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqdndha3JtYWNjbmhoaWpra2dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjUxODU5MiwiZXhwIjoyMDc4MDk0NTkyfQ.GOnj5kG6FEOx9JpWEyiU5o3tiZBTLpqoJulWrPxd90Q"
supabase: Client = create_client(
    SUPABASE_URL, 
    SUPABASE_SERVICE_KEY
) if SUPABASE_URL and SUPABASE_SERVICE_KEY else None

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


# ==================== DM AUTOMATIONS MODELS ====================

class DMAutomationSequence(BaseModel):
    position: int
    type: str = "message"
    content: str
    delay_seconds: int = 0
    message_type: str = "text"
    media_url: Optional[str] = None
    is_followup: bool = False
    followup_delay_hours: Optional[int] = None
    use_ai_response: bool = False
    buttons: Optional[List[Dict[str, Any]]] = None

class CreateDMAutomation(BaseModel):
    name: str
    trigger: str
    trigger_filter: Optional[str] = None
    public_reply: Optional[str] = None
    platforms: List[str]
    sequences: List[DMAutomationSequence]
    active: bool = True

class UpdateDMAutomation(BaseModel):
    name: Optional[str] = None
    trigger: Optional[str] = None
    trigger_filter: Optional[str] = None
    public_reply: Optional[str] = None
    platforms: Optional[List[str]] = None
    active: Optional[bool] = None

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
        "version": "5.2.0", 
        "status": "running",
        "cors": "enabled"
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
    user_id = request.headers.get("x-user-id")
    
    if not META_APP_ID:
        return JSONResponse(content={"error": "Meta App ID não configurado"}, status_code=500)
    
    # State agora inclui user_id para rastreamento
    state = f"facebook_{user_id}_{int(datetime.now().timestamp())}" if user_id else f"facebook_{int(datetime.now().timestamp())}"
    
    # Scopes corretos para Facebook Pages
    scopes = [
        "pages_manage_posts",
        "pages_read_engagement", 
        "pages_manage_metadata",
        "pages_show_list"
    ]
    
    auth_url = (
        f"https://www.facebook.com/v21.0/dialog/oauth"
        f"?client_id={META_APP_ID}"
        f"&redirect_uri={META_REDIRECT_URI}"
        f"&scope={','.join(scopes)}"
        f"&response_type=code"
        f"&state={state}"
    )
    
    return JSONResponse(content={"auth_url": auth_url, "state": state})

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
    
# ==================== FACEBOOK CALLBACK ====================
@app.post("/oauth/facebook/callback")
async def facebook_callback(request: Request):
    print(f"📱 POST /oauth/facebook/callback")
    try:
        body = await request.json()
        code = body.get("code")
        state = body.get("state")
        
        # Extrair user_id do state
        state_parts = state.split("_") if state else []
        user_id = state_parts[1] if len(state_parts) > 1 else request.headers.get("x-user-id", "default_user")
        
        if not code:
            return JSONResponse(
                content={"error": "Código de autorização não fornecido"},
                status_code=400
            )
        
        # 1. Trocar code por access_token
        token_url = "https://graph.facebook.com/v21.0/oauth/access_token"
        token_params = {
            "client_id": META_APP_ID,
            "client_secret": META_APP_SECRET,
            "redirect_uri": META_REDIRECT_URI,
            "code": code
        }
        
        async with httpx.AsyncClient() as client:
            token_response = await client.get(token_url, params=token_params)
            
            if token_response.status_code != 200:
                error_text = token_response.text
                print(f"❌ Erro token Facebook: {error_text}")
                raise HTTPException(status_code=400, detail=f"Falha ao obter token: {error_text}")
            
            token_info = token_response.json()
            access_token = token_info.get("access_token")
            
            # 2. Buscar páginas do usuário
            pages_url = "https://graph.facebook.com/v21.0/me/accounts"
            pages_params = {
                "access_token": access_token,
                "fields": "id,name,access_token"
            }
            
            pages_response = await client.get(pages_url, params=pages_params)
            pages_data = pages_response.json()
            
            pages = pages_data.get("data", [])
            
            if not pages:
                return JSONResponse(
                    content={"error": "Nenhuma página do Facebook encontrada"},
                    status_code=400
                )
            
            # Usar primeira página (você pode implementar seleção depois)
            page = pages[0]
            page_access_token = page.get("access_token")
            
            # 3. Trocar por long-lived token
            long_token_url = "https://graph.facebook.com/v21.0/oauth/access_token"
            long_token_params = {
                "grant_type": "fb_exchange_token",
                "client_id": META_APP_ID,
                "client_secret": META_APP_SECRET,
                "fb_exchange_token": page_access_token
            }
            
            long_token_response = await client.get(long_token_url, params=long_token_params)
            long_token_data = long_token_response.json()
            long_lived_token = long_token_data.get("access_token", page_access_token)
            
            # 4. Salvar no banco
            integration_data = {
                "user_id": user_id,
                "channel": "facebook",
                "credentials": {
                    "access_token": long_lived_token,
                    "page_id": page.get("id"),
                    "page_name": page.get("name"),
                    "connected_at": datetime.now().isoformat()
                },
                "status": "connected",
                "last_sync": datetime.now().isoformat(),
            }
            
            if supabase:
                supabase.table("integrations").upsert(integration_data).execute()
            
            return JSONResponse(content={
                "success": True,
                "platform": "facebook",
                "account_name": page.get("name"),
                "message": "Facebook conectado com sucesso!"
            })
            
    except Exception as e:
        print(f"❌ Erro Facebook callback: {e}")
        import traceback
        traceback.print_exc()
        return JSONResponse(content={"error": str(e)}, status_code=500)

# ==================== INSTAGRAM GRAPH API ====================
@app.get("/oauth/instagram/auth-url")
async def get_instagram_auth_url(request: Request):
    print(f"📸 GET /oauth/instagram/auth-url")
    user_id = request.headers.get("x-user-id")
    
    if not META_APP_ID:
        return JSONResponse(
            content={"error": "Instagram Client ID não configurado"}, 
            status_code=500
        )
    
    # Usar mesmo App ID do Facebook
    scopes = [
        "instagram_basic",
        "instagram_content_publish",
        "pages_read_engagement",
        "pages_show_list"
    ]
    
    state = f"instagram_{user_id}_{int(datetime.now().timestamp())}" if user_id else f"instagram_{int(datetime.now().timestamp())}"
    
    auth_url = (
        f"https://www.facebook.com/v21.0/dialog/oauth"
        f"?client_id={META_APP_ID}"
        f"&redirect_uri={INSTAGRAM_REDIRECT_URI}"
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
        state = body.get("state")
        
        # Extrair user_id do state
        state_parts = state.split("_") if state else []
        user_id = state_parts[1] if len(state_parts) > 1 else request.headers.get("x-user-id", "default_user")
        
        if not code:
            return JSONResponse(
                content={"error": "Código de autorização não fornecido"}, 
                status_code=400
            )
        
        # 1. Trocar código por token
        token_url = "https://graph.facebook.com/v21.0/oauth/access_token"
        token_params = {
            "client_id": META_APP_ID,
            "client_secret": META_APP_SECRET,
            "redirect_uri": INSTAGRAM_REDIRECT_URI,
            "code": code
        }
        
        async with httpx.AsyncClient() as client:
            token_response = await client.get(token_url, params=token_params)
            
            if token_response.status_code != 200:
                print(f"❌ Erro token: {token_response.text}")
                raise HTTPException(status_code=400, detail="Falha ao obter token")
            
            token_info = token_response.json()
            access_token = token_info.get("access_token")
            
            # 2. Buscar páginas com Instagram Business Account
            pages_url = "https://graph.facebook.com/v21.0/me/accounts"
            pages_params = {
                "access_token": access_token,
                "fields": "id,name,instagram_business_account{id,username,profile_picture_url}"
            }
            
            pages_response = await client.get(pages_url, params=pages_params)
            pages_data = pages_response.json()
            
            # Encontrar página com Instagram conectado
            instagram_account = None
            page_id = None
            page_access_token = None
            
            for page in pages_data.get("data", []):
                ig_account = page.get("instagram_business_account")
                if ig_account:
                    instagram_account = ig_account
                    page_id = page.get("id")
                    
                    # Pegar token da página
                    page_token_url = f"https://graph.facebook.com/v21.0/{page_id}"
                    page_token_params = {
                        "fields": "access_token",
                        "access_token": access_token
                    }
                    page_token_response = await client.get(page_token_url, params=page_token_params)
                    page_access_token = page_token_response.json().get("access_token")
                    break
            
            if not instagram_account:
                raise HTTPException(
                    status_code=400,
                    detail="Nenhuma conta do Instagram Business vinculada encontrada"
                )
            
            # 3. Long-lived token
            long_token_url = "https://graph.facebook.com/v21.0/oauth/access_token"
            long_token_params = {
                "grant_type": "fb_exchange_token",
                "client_id": META_APP_ID,
                "client_secret": META_APP_SECRET,
                "fb_exchange_token": page_access_token or access_token
            }
            
            long_token_response = await client.get(long_token_url, params=long_token_params)
            long_token_data = long_token_response.json()
            long_lived_token = long_token_data.get("access_token", page_access_token or access_token)
            
            # 4. Salvar
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
                    "expires_in": long_token_data.get("expires_in", 5184000)
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
        import traceback
        traceback.print_exc()
        return JSONResponse(content={"error": str(e)}, status_code=500)


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
# ==================== ENDPOINT MESSAGES - CORRIGIDO ====================
@app.get("/api/messages/")
async def get_messages(request: Request, limit: int = 200):
    """
    Busca mensagens do Supabase
    """
    print(f"📬 GET /api/messages/?limit={limit}")
    user_id = request.headers.get("x-user-id")
    
    if not supabase:
        print(f"   ❌ Supabase não configurado")
        return JSONResponse(content=[])
    
    try:
        # Buscar mensagens do Supabase
        query = supabase.table("messages") \
            .select("""
                *,
                conversation:conversations!inner(
                    *,
                    contact:contacts(*)
                )
            """) \
            .order("created_at", desc=True) \
            .limit(limit)
        
        # Filtrar por user_id se fornecido
        if user_id:
            query = query.eq("conversation.user_id", user_id)
        
        result = query.execute()
        
        messages = result.data or []
        
        print(f"   ✅ {len(messages)} mensagens encontradas")
        
        # Formatar mensagens para o frontend
        formatted_messages = []
        for msg in messages:
            formatted_messages.append({
                "id": msg["id"],
                "conversation_id": msg["conversation_id"],
                "contact_id": msg["contact_id"],
                "platform": msg["platform"],
                "sender_name": msg["sender_name"],
                "sender_type": msg["sender_type"],
                "message": msg["message"],
                "message_type": msg["message_type"],
                "created_at": msg["created_at"],
                "status": msg.get("status"),
                "metadata": {
                    "contact_username": msg.get("metadata", {}).get("phone"),
                    "raw": msg.get("metadata", {}),
                    "conversation": msg.get("conversation", {})
                }
            })
        
        return JSONResponse(content=formatted_messages)
        
    except Exception as e:
        print(f"   ❌ Erro ao buscar mensagens: {e}")
        import traceback
        traceback.print_exc()
        return JSONResponse(content=[])

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
        print(f"   📦 Dados completos: {json.dumps(data, indent=2)}")
        
        # Processar mensagem recebida
        if data.get("event") == "message_received":
            message_data = data.get("message", {})
            phone = message_data.get("phone", message_data.get("from"))
            text = message_data.get("text", message_data.get("body"))
            message_id = message_data.get("id")
            timestamp = message_data.get("timestamp")
            
            print(f"   💾 Mensagem de: {phone}")
            print(f"   💬 Texto: {text}")
            
            if not phone or not text:
                print(f"   ⚠️ Mensagem sem phone ou text")
                return JSONResponse(content={"success": True})
            
            # Buscar ou criar contato
            if supabase:
                try:
                    # 1. Buscar contato existente
                    contact_result = supabase.table("contacts") \
                        .select("*") \
                        .eq("phone", phone) \
                        .execute()
                    
                    if contact_result.data and len(contact_result.data) > 0:
                        contact = contact_result.data[0]
                        contact_id = contact["id"]
                        print(f"   ✅ Contato encontrado: {contact_id}")
                    else:
                        # Criar novo contato
                        contact_data = {
                            "phone": phone,
                            "name": message_data.get("pushname", phone),
                            "platform": "whatsapp",
                            "created_at": datetime.now().isoformat()
                        }
                        
                        contact_insert = supabase.table("contacts").insert(contact_data).execute()
                        contact_id = contact_insert.data[0]["id"]
                        print(f"   ✅ Contato criado: {contact_id}")
                    
                    # 2. Buscar ou criar conversa
                    conversation_result = supabase.table("conversations") \
                        .select("*") \
                        .eq("contact_id", contact_id) \
                        .eq("platform", "whatsapp") \
                        .eq("status", "active") \
                        .execute()
                    
                    if conversation_result.data and len(conversation_result.data) > 0:
                        conversation = conversation_result.data[0]
                        conversation_id = conversation["id"]
                        print(f"   ✅ Conversa encontrada: {conversation_id}")
                        
                        # Atualizar conversa
                        supabase.table("conversations").update({
                            "last_message_at": datetime.now().isoformat(),
                            "last_message_preview": text[:100],
                            "unread_count": conversation.get("unread_count", 0) + 1
                        }).eq("id", conversation_id).execute()
                        
                    else:
                        # Criar nova conversa
                        conversation_data = {
                            "contact_id": contact_id,
                            "platform": "whatsapp",
                            "status": "active",
                            "last_message_at": datetime.now().isoformat(),
                            "last_message_preview": text[:100],
                            "unread_count": 1,
                            "created_at": datetime.now().isoformat()
                        }
                        
                        conversation_insert = supabase.table("conversations").insert(conversation_data).execute()
                        conversation_id = conversation_insert.data[0]["id"]
                        print(f"   ✅ Conversa criada: {conversation_id}")
                    
                    # 3. Salvar mensagem
                    if timestamp:
                        # Converter segundos Unix para string ISO
                        # timestamp_iso = datetime.fromtimestamp(timestamp).isoformat() + "Z"  # Alternativa
                        timestamp_iso = datetime.utcfromtimestamp(timestamp).strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'
                    else:
                        timestamp_iso = datetime.now().isoformat() + "Z"

                    message_insert_data = {
                        "conversation_id": conversation_id,
                        "contact_id": contact_id,
                        "platform": "whatsapp",
                        "sender_name": message_data.get("pushname", phone),
                        "sender_type": "contact",  # Mensagem do contato
                        "message": text,
                        "message_type": "text",
                        "created_at": timestamp_iso,  # Usar a versão convertida aqui
                        "status": "received",
                        "external_id": message_id,
                        "metadata": {
                            "phone": phone,
                            "raw": message_data
                        }
                    }
                    
                    message_insert = supabase.table("messages").insert(message_insert_data).execute()
                    
                    print(f"   ✅ Mensagem salva no Supabase: {message_insert.data[0]['id']}")
                    
                except Exception as e:
                    print(f"   ❌ Erro ao salvar no Supabase: {e}")
                    import traceback
                    traceback.print_exc()
        
        return JSONResponse(content={"success": True})
        
    except Exception as e:
        print(f"   ❌ Erro no webhook: {e}")
        import traceback
        traceback.print_exc()
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
    user_id = request.headers.get("x-user-id")
    
    if not LINKEDIN_CLIENT_ID:
        return JSONResponse(
            content={"error": "LinkedIn Client ID não configurado"}, 
            status_code=500
        )
    
    scopes = ["openid", "profile", "email", "w_member_social"]
    state = f"linkedin_{user_id}_{int(datetime.now().timestamp())}" if user_id else f"linkedin_{int(datetime.now().timestamp())}"
    
    auth_url = (
        f"https://www.linkedin.com/oauth/v2/authorization"
        f"?response_type=code"
        f"&client_id={LINKEDIN_CLIENT_ID}"
        f"&redirect_uri={LINKEDIN_REDIRECT_URI}"
        f"&scope={' '.join(scopes)}"
        f"&state={state}"
    )
    
    return JSONResponse(content={"auth_url": auth_url, "state": state})

@app.post("/oauth/linkedin/callback")
async def linkedin_callback(request: Request):
    print(f"💼 POST /oauth/linkedin/callback")
    
    try:
        body = await request.json()
        code = body.get("code")
        state = body.get("state")
        
        # Extrair user_id
        state_parts = state.split("_") if state else []
        user_id = state_parts[1] if len(state_parts) > 1 else request.headers.get("x-user-id", "default_user")
        
        if not code:
            return JSONResponse(
                content={"error": "Código não fornecido"}, 
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
                print(f"❌ Erro token LinkedIn: {token_response.text}")
                raise HTTPException(status_code=400, detail="Falha ao obter token")
            
            token_info = token_response.json()
            access_token = token_info.get("access_token")
            
            # Buscar perfil
            profile_response = await client.get(
                "https://api.linkedin.com/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            
            profile_data = profile_response.json()
            
            # Salvar
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
        import traceback
        traceback.print_exc()
        return JSONResponse(content={"error": str(e)}, status_code=500)

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

# ==================== COMMENTS ENDPOINTS ====================

@app.get("/api/comments/pending")
async def get_pending_comments(request: Request, limit: int = 200):
    """
    Busca comentários pendentes de aprovação
    """
    print(f"📝 GET /api/comments/pending?limit={limit}")
    user_id = request.headers.get("x-user-id")
    
    if not user_id:
        return JSONResponse(
            content={"error": "User ID não fornecido"}, 
            status_code=400
        )
    
    if not supabase:
        return JSONResponse(
            content={"error": "Supabase não configurado"}, 
            status_code=500
        )
    
    try:
        # Buscar integrações conectadas do usuário
        integrations_result = supabase.table("integrations") \
            .select("channel, credentials") \
            .eq("user_id", user_id) \
            .eq("status", "connected") \
            .execute()
        
        connected_platforms = [
            integration["channel"] 
            for integration in integrations_result.data
        ]
        
        if not connected_platforms:
            return JSONResponse(content=[])
        
        # Buscar comentários das plataformas conectadas
        # NOTA: Ajuste a query conforme sua estrutura de banco
        comments_result = supabase.table("social_comments") \
            .select("*") \
            .eq("user_id", user_id) \
            .in_("platform", connected_platforms) \
            .order("created_at", desc=True) \
            .limit(limit) \
            .execute()
        
        # Formatar resposta
        formatted_comments = []
        for comment in comments_result.data:
            formatted_comments.append({
                "comment": {
                    "id": comment.get("id"),
                    "platform": comment.get("platform"),
                    "post_id": comment.get("post_id"),
                    "author_username": comment.get("author_username"),
                    "text": comment.get("text"),
                    "status": comment.get("status", "pending"),
                    "confidence": comment.get("confidence", 0.0),
                    "created_at": comment.get("created_at")
                },
                "ai_response": {
                    "text": comment.get("ai_response_text"),
                    "confidence": comment.get("ai_confidence", 0.0)
                } if comment.get("ai_response_text") else None
            })
        
        print(f"   ✅ Retornando {len(formatted_comments)} comentários")
        return JSONResponse(content=formatted_comments)
        
    except Exception as e:
        print(f"   ❌ Erro ao buscar comentários: {e}")
        return JSONResponse(
            content={"error": str(e)}, 
            status_code=500
        )


@app.get("/api/comments/stats")
async def get_comments_stats(request: Request, days: int = 14):
    """
    Busca estatísticas de comentários
    """
    print(f"📊 GET /api/comments/stats?days={days}")
    user_id = request.headers.get("x-user-id")
    
    if not user_id:
        return JSONResponse(
            content={"error": "User ID não fornecido"}, 
            status_code=400
        )
    
    if not supabase:
        return JSONResponse(
            content={"error": "Supabase não configurado"}, 
            status_code=500
        )
    
    try:
        from datetime import timedelta
        
        # Calcular data de início
        start_date = (datetime.now() - timedelta(days=days)).isoformat()
        
        # Buscar integrações conectadas
        integrations_result = supabase.table("integrations") \
            .select("channel") \
            .eq("user_id", user_id) \
            .eq("status", "connected") \
            .execute()
        
        connected_platforms = [
            integration["channel"] 
            for integration in integrations_result.data
        ]
        
        if not connected_platforms:
            return JSONResponse(content=[{
                "total_comments": 0,
                "responded_by_ai": 0,
                "pending_review": 0,
                "engagement_rate": 0.0
            }])
        
        # Buscar estatísticas
        comments_result = supabase.table("social_comments") \
            .select("status, ai_response_text, created_at") \
            .eq("user_id", user_id) \
            .in_("platform", connected_platforms) \
            .gte("created_at", start_date) \
            .execute()
        
        total_comments = len(comments_result.data)
        responded_by_ai = len([
            c for c in comments_result.data 
            if c.get("ai_response_text")
        ])
        pending_review = len([
            c for c in comments_result.data 
            if c.get("status") == "pending"
        ])
        
        # Calcular taxa de engajamento (exemplo simples)
        engagement_rate = (responded_by_ai / total_comments) if total_comments > 0 else 0.0
        
        stats = [{
            "total_comments": total_comments,
            "responded_by_ai": responded_by_ai,
            "pending_review": pending_review,
            "engagement_rate": engagement_rate
        }]
        
        print(f"   ✅ Stats: {total_comments} comentários, {responded_by_ai} respondidos")
        return JSONResponse(content=stats)
        
    except Exception as e:
        print(f"   ❌ Erro ao buscar stats: {e}")
        return JSONResponse(
            content={"error": str(e)}, 
            status_code=500
        )


@app.post("/api/comments/generate-responses")
async def generate_comment_responses(request: Request):
    """
    Gera respostas com IA para comentários pendentes
    """
    print(f"🤖 POST /api/comments/generate-responses")
    user_id = request.headers.get("x-user-id")
    
    if not user_id:
        return JSONResponse(
            content={"error": "User ID não fornecido"}, 
            status_code=400
        )
    
    if not supabase:
        return JSONResponse(
            content={"error": "Supabase não configurado"}, 
            status_code=500
        )
    
    try:
        # Buscar comentários pendentes
        comments_result = supabase.table("social_comments") \
            .select("*") \
            .eq("user_id", user_id) \
            .eq("status", "pending") \
            .is_("ai_response_text", "null") \
            .limit(10) \
            .execute()
        
        if not comments_result.data:
            return JSONResponse(content={
                "success": True,
                "message": "Nenhum comentário pendente para processar"
            })
        
        # Aqui você integraria com a IA (ChatGPT, Claude, etc)
        # Por enquanto, vou simular respostas
        updated_count = 0
        
        for comment in comments_result.data:
            # Simular geração de resposta com IA
            # Em produção, você chamaria a API da OpenAI ou outra IA
            ai_response = f"Obrigado pelo seu comentário! Vou verificar isso para você. 😊"
            
            # Atualizar comentário com resposta da IA
            supabase.table("social_comments") \
                .update({
                    "ai_response_text": ai_response,
                    "ai_confidence": 0.85,
                    "status": "pending"  # Ainda precisa de aprovação humana
                }) \
                .eq("id", comment["id"]) \
                .execute()
            
            updated_count += 1
        
        print(f"   ✅ {updated_count} respostas geradas")
        return JSONResponse(content={
            "success": True,
            "message": f"{updated_count} respostas geradas com sucesso"
        })
        
    except Exception as e:
        print(f"   ❌ Erro ao gerar respostas: {e}")
        return JSONResponse(
            content={"error": str(e)}, 
            status_code=500
        )


@app.post("/api/comments/{comment_id}/approve")
async def approve_comment(comment_id: str, request: Request):
    """
    Aprova um comentário e envia a resposta
    """
    print(f"✅ POST /api/comments/{comment_id}/approve")
    user_id = request.headers.get("x-user-id")
    
    if not user_id:
        return JSONResponse(
            content={"error": "User ID não fornecido"}, 
            status_code=400
        )
    
    if not supabase:
        return JSONResponse(
            content={"error": "Supabase não configurado"}, 
            status_code=500
        )
    
    try:
        body = await request.json()
        custom_response = body.get("response")
        
        # Buscar comentário
        comment_result = supabase.table("social_comments") \
            .select("*") \
            .eq("id", comment_id) \
            .eq("user_id", user_id) \
            .single() \
            .execute()
        
        if not comment_result.data:
            return JSONResponse(
                content={"error": "Comentário não encontrado"}, 
                status_code=404
            )
        
        comment = comment_result.data
        platform = comment.get("platform")
        post_id = comment.get("post_id")
        comment_text = comment.get("text")
        response_text = custom_response or comment.get("ai_response_text")
        
        if not response_text:
            return JSONResponse(
                content={"error": "Nenhuma resposta disponível"}, 
                status_code=400
            )
        
        # Buscar credenciais da plataforma
        integration_result = supabase.table("integrations") \
            .select("credentials") \
            .eq("user_id", user_id) \
            .eq("channel", platform) \
            .eq("status", "connected") \
            .single() \
            .execute()
        
        if not integration_result.data:
            return JSONResponse(
                content={"error": f"Plataforma {platform} não conectada"}, 
                status_code=400
            )
        
        credentials = integration_result.data["credentials"]
        access_token = credentials.get("access_token")
        
        # Enviar resposta conforme a plataforma
        if platform == "instagram":
            # Instagram Graph API - responder comentário
            instagram_account_id = credentials.get("instagram_account_id")
            
            async with httpx.AsyncClient() as client:
                reply_url = f"https://graph.facebook.com/v21.0/{comment_id}/replies"
                reply_data = {
                    "message": response_text,
                    "access_token": access_token
                }
                
                reply_response = await client.post(reply_url, data=reply_data)
                
                if reply_response.status_code != 200:
                    raise Exception(f"Falha ao responder: {reply_response.text}")
        
        elif platform == "facebook":
            # Facebook Graph API - responder comentário
            async with httpx.AsyncClient() as client:
                reply_url = f"https://graph.facebook.com/v21.0/{comment_id}/comments"
                reply_data = {
                    "message": response_text,
                    "access_token": access_token
                }
                
                reply_response = await client.post(reply_url, data=reply_data)
                
                if reply_response.status_code != 200:
                    raise Exception(f"Falha ao responder: {reply_response.text}")
        
        # Atualizar status do comentário
        supabase.table("social_comments") \
            .update({
                "status": "approved",
                "approved_at": datetime.now().isoformat(),
                "response_sent": response_text
            }) \
            .eq("id", comment_id) \
            .execute()
        
        print(f"   ✅ Comentário aprovado e resposta enviada")
        return JSONResponse(content={
            "success": True,
            "message": "Resposta enviada com sucesso"
        })
        
    except Exception as e:
        print(f"   ❌ Erro ao aprovar comentário: {e}")
        return JSONResponse(
            content={"error": str(e)}, 
            status_code=500
        )


@app.post("/api/comments/{comment_id}/ignore")
async def ignore_comment(comment_id: str, request: Request):
    """
    Marca um comentário como ignorado
    """
    print(f"🚫 POST /api/comments/{comment_id}/ignore")
    user_id = request.headers.get("x-user-id")
    
    if not user_id:
        return JSONResponse(
            content={"error": "User ID não fornecido"}, 
            status_code=400
        )
    
    if not supabase:
        return JSONResponse(
            content={"error": "Supabase não configurado"}, 
            status_code=500
        )
    
    try:
        # Atualizar status do comentário
        supabase.table("social_comments") \
            .update({
                "status": "ignored",
                "ignored_at": datetime.now().isoformat()
            }) \
            .eq("id", comment_id) \
            .eq("user_id", user_id) \
            .execute()
        
        print(f"   ✅ Comentário marcado como ignorado")
        return JSONResponse(content={
            "success": True,
            "message": "Comentário ignorado"
        })
        
    except Exception as e:
        print(f"   ❌ Erro ao ignorar comentário: {e}")
        return JSONResponse(
            content={"error": str(e)}, 
            status_code=500
        )

@app.post("/webhook/instagram/comments")
async def instagram_comments_webhook(request: Request):
    """
    Webhook para receber notificações de comentários do Instagram
    Configure este webhook no Facebook Developer App
    """
    print(f"📸 POST /webhook/instagram/comments")
    
    try:
        body = await request.json()
        
        # Validar webhook (primeiro request do Facebook)
        if body.get("object") == "instagram":
            entries = body.get("entry", [])
            
            for entry in entries:
                changes = entry.get("changes", [])
                
                for change in changes:
                    if change.get("field") == "comments":
                        value = change.get("value")
                        
                        # Extrair informações do comentário
                        comment_id = value.get("id")
                        text = value.get("text")
                        from_user = value.get("from", {})
                        media_id = value.get("media", {}).get("id")
                        
                        # Buscar usuário que possui esta integração
                        # Você precisa mapear o instagram_account_id para o user_id
                        instagram_account_id = entry.get("id")
                        
                        if supabase:
                            # Buscar integração
                            integration_result = supabase.table("integrations") \
                                .select("user_id") \
                                .eq("channel", "instagram") \
                                .contains("credentials", {"instagram_account_id": instagram_account_id}) \
                                .single() \
                                .execute()
                            
                            if integration_result.data:
                                user_id = integration_result.data["user_id"]
                                
                                # Salvar comentário
                                supabase.table("social_comments").insert({
                                    "user_id": user_id,
                                    "platform": "instagram",
                                    "post_id": media_id,
                                    "comment_id_external": comment_id,
                                    "author_username": from_user.get("username"),
                                    "author_id": from_user.get("id"),
                                    "text": text,
                                    "status": "pending",
                                    "metadata": {
                                        "raw_webhook": value
                                    }
                                }).execute()
                                
                                print(f"   ✅ Comentário salvo: {comment_id}")
        
        return JSONResponse(content={"success": True})
        
    except Exception as e:
        print(f"   ❌ Erro no webhook: {e}")
        return JSONResponse(content={"error": str(e)}, status_code=500)


@app.get("/webhook/instagram/comments")
async def instagram_comments_webhook_verify(request: Request):
    """
    Verificação do webhook do Instagram/Facebook
    """
    hub_mode = request.query_params.get("hub.mode")
    hub_verify_token = request.query_params.get("hub.verify_token")
    hub_challenge = request.query_params.get("hub.challenge")
    
    # Defina um token de verificação no .env
    WEBHOOK_VERIFY_TOKEN = os.getenv("WEBHOOK_VERIFY_TOKEN", "meu_token_secreto_123")
    
    if hub_mode == "subscribe" and hub_verify_token == WEBHOOK_VERIFY_TOKEN:
        print(f"✅ Webhook verificado com sucesso")
        return int(hub_challenge)
    
    return JSONResponse(
        content={"error": "Token de verificação inválido"}, 
        status_code=403
    )


# ==================== POLLING DE COMENTÁRIOS (ALTERNATIVA) ====================

@app.post("/api/comments/fetch-new")
async def fetch_new_comments(request: Request):
    """
    Busca novos comentários das plataformas conectadas
    Use este endpoint se webhooks não estiverem disponíveis
    """
    print(f"🔄 POST /api/comments/fetch-new")
    user_id = request.headers.get("x-user-id")
    
    if not user_id:
        return JSONResponse(
            content={"error": "User ID não fornecido"}, 
            status_code=400
        )
    
    if not supabase:
        return JSONResponse(
            content={"error": "Supabase não configurado"}, 
            status_code=500
        )
    
    try:
        # Buscar integrações ativas
        integrations_result = supabase.table("integrations") \
            .select("*") \
            .eq("user_id", user_id) \
            .eq("status", "connected") \
            .execute()
        
        new_comments_count = 0
        
        for integration in integrations_result.data:
            platform = integration["channel"]
            credentials = integration["credentials"]
            
            if platform == "instagram":
                # Buscar comentários do Instagram
                access_token = credentials.get("access_token")
                instagram_account_id = credentials.get("instagram_account_id")
                
                if not access_token or not instagram_account_id:
                    continue
                
                async with httpx.AsyncClient() as client:
                    # Buscar posts recentes
                    media_url = f"https://graph.facebook.com/v21.0/{instagram_account_id}/media"
                    media_params = {
                        "fields": "id,caption,timestamp,media_type",
                        "access_token": access_token,
                        "limit": 10
                    }
                    
                    media_response = await client.get(media_url, params=media_params)
                    media_data = media_response.json()
                    
                    for media in media_data.get("data", []):
                        media_id = media["id"]
                        
                        # Buscar comentários do post
                        comments_url = f"https://graph.facebook.com/v21.0/{media_id}/comments"
                        comments_params = {
                            "fields": "id,text,username,timestamp,from",
                            "access_token": access_token
                        }
                        
                        comments_response = await client.get(comments_url, params=comments_params)
                        comments_data = comments_response.json()
                        
                        for comment in comments_data.get("data", []):
                            # Verificar se comentário já existe
                            existing = supabase.table("social_comments") \
                                .select("id") \
                                .eq("user_id", user_id) \
                                .eq("comment_id_external", comment["id"]) \
                                .execute()
                            
                            if not existing.data:
                                # Inserir novo comentário
                                supabase.table("social_comments").insert({
                                    "user_id": user_id,
                                    "platform": "instagram",
                                    "post_id": media_id,
                                    "comment_id_external": comment["id"],
                                    "author_username": comment.get("username"),
                                    "author_id": comment.get("from", {}).get("id"),
                                    "text": comment.get("text"),
                                    "status": "pending",
                                    "created_at": comment.get("timestamp"),
                                    "metadata": {
                                        "media_caption": media.get("caption"),
                                        "media_type": media.get("media_type")
                                    }
                                }).execute()
                                
                                new_comments_count += 1
            
            elif platform == "facebook":
                # Buscar comentários do Facebook
                access_token = credentials.get("access_token")
                page_id = credentials.get("page_id")
                
                if not access_token or not page_id:
                    continue
                
                async with httpx.AsyncClient() as client:
                    # Buscar posts da página
                    posts_url = f"https://graph.facebook.com/v21.0/{page_id}/posts"
                    posts_params = {
                        "fields": "id,message,created_time",
                        "access_token": access_token,
                        "limit": 10
                    }
                    
                    posts_response = await client.get(posts_url, params=posts_params)
                    posts_data = posts_response.json()
                    
                    for post in posts_data.get("data", []):
                        post_id = post["id"]
                        
                        # Buscar comentários do post
                        comments_url = f"https://graph.facebook.com/v21.0/{post_id}/comments"
                        comments_params = {
                            "fields": "id,message,from,created_time",
                            "access_token": access_token
                        }
                        
                        comments_response = await client.get(comments_url, params=comments_params)
                        comments_data = comments_response.json()
                        
                        for comment in comments_data.get("data", []):
                            # Verificar se comentário já existe
                            existing = supabase.table("social_comments") \
                                .select("id") \
                                .eq("user_id", user_id) \
                                .eq("comment_id_external", comment["id"]) \
                                .execute()
                            
                            if not existing.data:
                                # Inserir novo comentário
                                supabase.table("social_comments").insert({
                                    "user_id": user_id,
                                    "platform": "facebook",
                                    "post_id": post_id,
                                    "comment_id_external": comment["id"],
                                    "author_username": comment.get("from", {}).get("name"),
                                    "author_id": comment.get("from", {}).get("id"),
                                    "text": comment.get("message"),
                                    "status": "pending",
                                    "created_at": comment.get("created_time"),
                                    "metadata": {
                                        "post_message": post.get("message")
                                    }
                                }).execute()
                                
                                new_comments_count += 1
        
        print(f"   ✅ {new_comments_count} novos comentários capturados")
        return JSONResponse(content={
            "success": True,
            "new_comments": new_comments_count
        })
        
    except Exception as e:
        print(f"   ❌ Erro ao buscar comentários: {e}")
        return JSONResponse(
            content={"error": str(e)}, 
            status_code=500
        )
    

# ==================== DM AUTOMATIONS ENDPOINTS ====================

@app.get("/api/dm-automations")
async def get_dm_automations(request: Request):
    """
    Lista todas as automações DM do usuário
    """
    print(f"📋 GET /api/dm-automations")
    user_id = request.headers.get("x-user-id")
    
    if not user_id:
        return JSONResponse(
            content={"error": "User ID não fornecido"}, 
            status_code=400
        )
    
    if not supabase:
        return JSONResponse(
            content={"error": "Supabase não configurado"}, 
            status_code=500
        )
    
    try:
        # Buscar automações
        result = supabase.table("dm_automations") \
            .select("*") \
            .eq("user_id", user_id) \
            .order("created_at", desc=True) \
            .execute()
        
        automations = result.data or []
        
        print(f"   ✅ {len(automations)} automações encontradas")
        return JSONResponse(content=automations)
        
    except Exception as e:
        print(f"   ❌ Erro ao buscar automações: {e}")
        return JSONResponse(
            content={"error": str(e)}, 
            status_code=500
        )


@app.post("/api/dm-automations")
async def create_dm_automation(request: Request):
    """
    Cria uma nova automação DM
    """
    print(f"➕ POST /api/dm-automations")
    user_id = request.headers.get("x-user-id")
    
    if not user_id:
        print(f"   ❌ User ID não fornecido")
        return JSONResponse(
            content={"error": "User ID não fornecido"}, 
            status_code=400
        )
    
    if not supabase:
        print(f"   ❌ Supabase não configurado")
        return JSONResponse(
            content={"error": "Supabase não configurado"}, 
            status_code=500
        )
    
    try:
        # Tentar obter o corpo da requisição
        body = await request.body()
        body_str = body.decode('utf-8')
        print(f"   📦 Body raw string: {body_str[:500]}...")  # Mostra apenas os primeiros 500 chars
        
        body_json = await request.json()
        print(f"   📦 Body JSON completo: {json.dumps(body_json, indent=2)}")  # Usando json.dumps para melhor formatação
        
        # Verificar se sequences existe e seu tipo
        if "sequences" in body_json:
            sequences = body_json["sequences"]
            print(f"   🔍 Sequences type: {type(sequences)}")
            print(f"   🔍 Sequences length: {len(sequences) if isinstance(sequences, list) else 'not a list'}")
            if sequences and isinstance(sequences, list):
                print(f"   🔍 First sequence item: {sequences[0]}")
                print(f"   🔍 First sequence item type: {type(sequences[0])}")
        
        # Tentar processar sem validação rígida primeiro
        name = body_json.get("name")
        trigger = body_json.get("trigger")
        trigger_filter = body_json.get("trigger_filter")
        public_reply = body_json.get("public_reply")
        platforms = body_json.get("platforms", [])
        sequences_data = body_json.get("sequences", [])
        active = body_json.get("active", True)
        
        # Validar campos obrigatórios
        if not name:
            return JSONResponse(
                content={"error": "Nome é obrigatório"}, 
                status_code=400
            )
        
        if not platforms or not isinstance(platforms, list):
            return JSONResponse(
                content={"error": "Plataformas é obrigatório e deve ser uma lista"}, 
                status_code=400
            )
        
        # Validar plataformas conectadas
        integrations_result = supabase.table("integrations") \
            .select("channel") \
            .eq("user_id", user_id) \
            .eq("status", "connected") \
            .execute()
        
        connected_platforms = [i["channel"] for i in integrations_result.data]
        print(f"   🔌 Plataformas conectadas: {connected_platforms}")
        print(f"   🔌 Plataformas solicitadas: {platforms}")
        
        disconnected = [p for p in platforms if p not in connected_platforms]
        if disconnected:
            print(f"   ❌ Plataformas não conectadas: {disconnected}")
            return JSONResponse(
                content={"error": f"Plataformas não conectadas: {', '.join(disconnected)}"}, 
                status_code=400
            )
        
        # Criar automação
        automation_data = {
            "user_id": user_id,
            "name": name,
            "trigger": trigger,
            "trigger_filter": trigger_filter,
            "public_reply": public_reply,
            "platforms": platforms,
            "active": active,
            "created_at": datetime.now().isoformat(),
        }
        
        print(f"   📝 Inserindo automação: {automation_data}")
        
        automation_result = supabase.table("dm_automations") \
            .insert(automation_data) \
            .execute()
        
        if not automation_result.data:
            print(f"   ❌ Falha ao inserir automação")
            return JSONResponse(
                content={"error": "Falha ao criar automação"}, 
                status_code=500
            )
        
        created_automation = automation_result.data[0]
        automation_id = created_automation["id"]
        
        print(f"   ✅ Automação criada com ID: {automation_id}")
        
        # Criar sequências se existirem
        if sequences_data and isinstance(sequences_data, list):
            for i, seq in enumerate(sequences_data):
                try:
                    sequence_data = {
                        "automation_id": automation_id,
                        "position": seq.get("position", i + 1),
                        "type": seq.get("type", "message"),
                        "message_type": seq.get("message_type", "text"),
                        "content": seq.get("content", ""),
                        "media_url": seq.get("media_url"),
                        "delay_seconds": seq.get("delay_seconds", 0),
                        "is_followup": seq.get("is_followup", False),
                        "followup_delay_hours": seq.get("followup_delay_hours"),
                        "use_ai_response": seq.get("use_ai_response", False),
                        "buttons": seq.get("buttons"),
                    }
                    
                    print(f"   📝 Inserindo sequência {i+1}: {sequence_data}")
                    
                    supabase.table("dm_automation_messages") \
                        .insert(sequence_data) \
                        .execute()
                    
                except Exception as seq_error:
                    print(f"   ⚠️ Erro ao inserir sequência {i+1}: {seq_error}")
                    # Continuar com as outras sequências
        
        print(f"   ✅ Automação criada: {name}")
        return JSONResponse(content=created_automation)
        
    except Exception as e:
        print(f"   ❌ Erro ao criar automação: {e}")
        import traceback
        traceback.print_exc()
        return JSONResponse(
            content={"error": str(e)}, 
            status_code=500
        )

@app.post("/api/test-automation")
async def test_automation(request: Request):
    """
    Endpoint de teste para criar automação
    """
    print(f"🧪 POST /api/test-automation")
    
    try:
        body = await request.json()
        print(f"   📦 Body recebido: {body}")
        
        # Verificar estrutura mínima
        if not body.get("name"):
            return JSONResponse(
                content={"error": "Nome é obrigatório"}, 
                status_code=400
            )
        
        if not body.get("platforms") or not isinstance(body.get("platforms"), list):
            return JSONResponse(
                content={"error": "Plataformas é obrigatório e deve ser uma lista"}, 
                status_code=400
            )
        
        return JSONResponse(content={
            "success": True,
            "message": "Teste bem-sucedido",
            "data_received": body
        })
        
    except Exception as e:
        print(f"   ❌ Erro no teste: {e}")
        return JSONResponse(
            content={"error": str(e)}, 
            status_code=500
        )

@app.put("/api/dm-automations/{automation_id}")
async def update_dm_automation(
    automation_id: int, 
    automation: UpdateDMAutomation, 
    request: Request
):
    """
    Atualiza uma automação DM
    """
    print(f"✏️ PUT /api/dm-automations/{automation_id}")
    user_id = request.headers.get("x-user-id")
    
    if not user_id:
        return JSONResponse(
            content={"error": "User ID não fornecido"}, 
            status_code=400
        )
    
    if not supabase:
        return JSONResponse(
            content={"error": "Supabase não configurado"}, 
            status_code=500
        )
    
    try:
        # Preparar dados para atualização
        update_data = {k: v for k, v in automation.dict().items() if v is not None}
        
        if not update_data:
            return JSONResponse(
                content={"error": "Nenhum dado para atualizar"}, 
                status_code=400
            )
        
        # Atualizar
        result = supabase.table("dm_automations") \
            .update(update_data) \
            .eq("id", automation_id) \
            .eq("user_id", user_id) \
            .execute()
        
        if not result.data:
            return JSONResponse(
                content={"error": "Automação não encontrada"}, 
                status_code=404
            )
        
        print(f"   ✅ Automação atualizada")
        return JSONResponse(content=result.data[0])
        
    except Exception as e:
        print(f"   ❌ Erro ao atualizar automação: {e}")
        return JSONResponse(
            content={"error": str(e)}, 
            status_code=500
        )


@app.delete("/api/dm-automations/{automation_id}")
async def delete_dm_automation(automation_id: int, request: Request):
    """
    Deleta uma automação DM
    """
    print(f"🗑️ DELETE /api/dm-automations/{automation_id}")
    user_id = request.headers.get("x-user-id")
    
    if not user_id:
        return JSONResponse(
            content={"error": "User ID não fornecido"}, 
            status_code=400
        )
    
    if not supabase:
        return JSONResponse(
            content={"error": "Supabase não configurado"}, 
            status_code=500
        )
    
    try:
        # Deletar mensagens primeiro (cascade)
        supabase.table("dm_automation_messages") \
            .delete() \
            .eq("automation_id", automation_id) \
            .execute()
        
        # Deletar automação
        result = supabase.table("dm_automations") \
            .delete() \
            .eq("id", automation_id) \
            .eq("user_id", user_id) \
            .execute()
        
        if not result.data:
            return JSONResponse(
                content={"error": "Automação não encontrada"}, 
                status_code=404
            )
        
        print(f"   ✅ Automação deletada")
        return JSONResponse(content={"success": True})
        
    except Exception as e:
        print(f"   ❌ Erro ao deletar automação: {e}")
        return JSONResponse(
            content={"error": str(e)}, 
            status_code=500
        )


@app.get("/api/dm-automations/{automation_id}/messages")
async def get_automation_messages(automation_id: int, request: Request):
    """
    Lista mensagens de uma automação
    """
    print(f"📋 GET /api/dm-automations/{automation_id}/messages")
    user_id = request.headers.get("x-user-id")
    
    if not user_id:
        return JSONResponse(
            content={"error": "User ID não fornecido"}, 
            status_code=400
        )
    
    if not supabase:
        return JSONResponse(
            content={"error": "Supabase não configurado"}, 
            status_code=500
        )
    
    try:
        # Verificar se automação pertence ao usuário
        automation_result = supabase.table("dm_automations") \
            .select("id") \
            .eq("id", automation_id) \
            .eq("user_id", user_id) \
            .execute()
        
        if not automation_result.data:
            return JSONResponse(
                content={"error": "Automação não encontrada"}, 
                status_code=404
            )
        
        # Buscar mensagens
        messages_result = supabase.table("dm_automation_messages") \
            .select("*") \
            .eq("automation_id", automation_id) \
            .order("position") \
            .execute()
        
        messages = messages_result.data or []
        
        print(f"   ✅ {len(messages)} mensagens encontradas")
        return JSONResponse(content=messages)
        
    except Exception as e:
        print(f"   ❌ Erro ao buscar mensagens: {e}")
        return JSONResponse(
            content={"error": str(e)}, 
            status_code=500
        )


@app.post("/api/dm-automations/{automation_id}/messages")
async def add_automation_message(automation_id: int, request: Request):
    """
    Adiciona uma mensagem a uma automação
    """
    print(f"➕ POST /api/dm-automations/{automation_id}/messages")
    user_id = request.headers.get("x-user-id")
    
    if not user_id:
        return JSONResponse(
            content={"error": "User ID não fornecido"}, 
            status_code=400
        )
    
    if not supabase:
        return JSONResponse(
            content={"error": "Supabase não configurado"}, 
            status_code=500
        )
    
    try:
        body = await request.json()
        
        # Verificar se automação pertence ao usuário
        automation_result = supabase.table("dm_automations") \
            .select("id") \
            .eq("id", automation_id) \
            .eq("user_id", user_id) \
            .execute()
        
        if not automation_result.data:
            return JSONResponse(
                content={"error": "Automação não encontrada"}, 
                status_code=404
            )
        
        # Adicionar mensagem
        message_data = {
            "automation_id": automation_id,
            "position": body.get("position", 1),
            "type": body.get("type", "message"),
            "message_type": body.get("message_type", "text"),
            "content": body.get("content", ""),
            "media_url": body.get("media_url"),
            "delay_seconds": body.get("delay_seconds", 0),
            "is_followup": body.get("is_followup", False),
            "followup_delay_hours": body.get("followup_delay_hours"),
            "use_ai_response": body.get("use_ai_response", False),
            "buttons": body.get("buttons"),
        }
        
        result = supabase.table("dm_automation_messages") \
            .insert(message_data) \
            .execute()
        
        print(f"   ✅ Mensagem adicionada")
        return JSONResponse(content=result.data[0])
        
    except Exception as e:
        print(f"   ❌ Erro ao adicionar mensagem: {e}")
        return JSONResponse(
            content={"error": str(e)}, 
            status_code=500
        )


@app.delete("/api/dm-automations/{automation_id}/messages/{message_id}")
async def delete_automation_message(
    automation_id: int, 
    message_id: int, 
    request: Request
):
    """
    Deleta uma mensagem de uma automação
    """
    print(f"🗑️ DELETE /api/dm-automations/{automation_id}/messages/{message_id}")
    user_id = request.headers.get("x-user-id")
    
    if not user_id:
        return JSONResponse(
            content={"error": "User ID não fornecido"}, 
            status_code=400
        )
    
    if not supabase:
        return JSONResponse(
            content={"error": "Supabase não configurado"}, 
            status_code=500
        )
    
    try:
        # Verificar se automação pertence ao usuário
        automation_result = supabase.table("dm_automations") \
            .select("id") \
            .eq("id", automation_id) \
            .eq("user_id", user_id) \
            .execute()
        
        if not automation_result.data:
            return JSONResponse(
                content={"error": "Automação não encontrada"}, 
                status_code=404
            )
        
        # Deletar mensagem
        result = supabase.table("dm_automation_messages") \
            .delete() \
            .eq("id", message_id) \
            .eq("automation_id", automation_id) \
            .execute()
        
        if not result.data:
            return JSONResponse(
                content={"error": "Mensagem não encontrada"}, 
                status_code=404
            )
        
        print(f"   ✅ Mensagem deletada")
        return JSONResponse(content={"success": True})
        
    except Exception as e:
        print(f"   ❌ Erro ao deletar mensagem: {e}")
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
    