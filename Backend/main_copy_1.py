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
@app.get("/oauth/instagram/auth-url")
async def get_instagram_auth_url(request: Request):
    print(f"📸 GET /oauth/instagram/auth-url")
    
    if not META_APP_ID:
        return JSONResponse(content={"error": "Meta App ID não configurado"}, status_code=500)
    
    auth_url = (
        f"https://api.instagram.com/oauth/authorize"
        f"?client_id={META_APP_ID}"
        f"&redirect_uri={INSTAGRAM_REDIRECT_URI}"
        f"&scope=user_profile,user_media"
        f"&response_type=code"
        f"&state=instagram_{datetime.now().timestamp()}"
    )
    
    return JSONResponse(content={"auth_url": auth_url})

@app.post("/oauth/instagram/connect")
async def connect_instagram(credentials: IntegrationCredentials, request: Request):
    print(f"🔗 POST /oauth/instagram/connect")
    user_id = request.headers.get("x-user-id", "default_user")
    
    try:
        integration_data = {
            "user_id": user_id,
            "channel": "instagram",
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
            "platform": "instagram",
            "username": credentials.username,
            "message": "Instagram conectado com sucesso!"
        })
        
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

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
    