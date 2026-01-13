# main.py - FastAPI Backend SEM headers CORS
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

app = FastAPI(title="SocialFlow Backend", version="5.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://app.socialflow.aitonomy.ai"],  # Apenas seu frontend
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Configuração do Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ==================== REMOVA O CORS MIDDLEWARE DO FASTAPI ====================
# O Nginx vai lidar com CORS, então não precisamos aqui
# Comente ou remova completamente a configuração CORS do FastAPI

# ==================== CONFIGURAÇÕES ====================
WHATSAPP_SERVER_URL = os.getenv("WHATSAPP_SERVER_URL", "http://localhost:8001")
META_APP_ID = os.getenv("META_APP_ID", "")
META_APP_SECRET = os.getenv("META_APP_SECRET", "")
META_REDIRECT_URI = "https://app.socialflow.aitonomy.ai/oauth/callback"
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
    
    response = await call_next(request)
    
    print(f"   Response: {response.status_code}")
    
    # NÃO adicione headers CORS aqui - deixe o Nginx fazer isso
    return response

# ==================== ENDPOINTS SIMPLES SEM CORS ====================
@app.get("/")
async def root():
    return {"service": "SocialFlow Backend API", "version": "5.0.0", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "online", "version": "5.0.0", "timestamp": datetime.now().isoformat()}

# ==================== OAUTH ACCOUNTS ====================
@app.get("/oauth/accounts")
async def get_connected_accounts(request: Request):
    print(f"📊 GET /oauth/accounts")
    
    try:
        accounts = []
        
        # Buscar do Supabase
        try:
            result = supabase.table("integrations").select("*").execute()
            for integration in result.data:
                accounts.append({
                    "id": integration["id"],
                    "platform": integration["channel"],
                    "account_id": integration["credentials"].get("username", integration.get("id", "N/A")),
                    "account_name": integration["credentials"].get("username", "Conta Conectada"),
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
async def get_facebook_auth_url():
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
async def connect_facebook(credentials: IntegrationCredentials):
    print(f"🔗 POST /oauth/facebook/connect")
    
    try:
        user_id = "user_123"
        
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
async def get_instagram_auth_url():
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
async def connect_instagram(credentials: IntegrationCredentials):
    print(f"🔗 POST /oauth/instagram/connect")
    
    try:
        user_id = "user_123"
        
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
async def get_whatsapp_status():
    print(f"📱 GET /whatsapp/status")
    
    try:
        whatsapp_url = WHATSAPP_SERVER_URL
        if whatsapp_url.startswith("whatsapp.aitonomy.ai"):
            whatsapp_url = f"https://{whatsapp_url}"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{whatsapp_url}/whatsapp/status", timeout=10.0)
            data = response.json()
            
            return JSONResponse(content=data)
    except Exception as e:
        print(f"❌ Erro WhatsApp: {e}")
        return JSONResponse(content={
            "status": "disconnected",
            "ready": False,
            "requiresQR": False,
            "clientInfo": None
        })

@app.get("/whatsapp/qr")
async def get_whatsapp_qr():
    print(f"📱 GET /whatsapp/qr")
    
    try:
        whatsapp_url = WHATSAPP_SERVER_URL
        if whatsapp_url.startswith("whatsapp.aitonomy.ai"):
            whatsapp_url = f"https://{whatsapp_url}"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{whatsapp_url}/whatsapp/qr", timeout=10.0)
            data = response.json()
            
            return JSONResponse(content=data)
    except Exception as e:
        print(f"❌ Erro WhatsApp QR: {e}")
        return JSONResponse(content={"connected": False, "qrCode": None})

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

# ==================== MAIN ====================
if __name__ == "__main__":
    import uvicorn
    
    print("=" * 60)
    print("🚀 SocialFlow Backend - PRODUÇÃO")
    print("📌 IMPORTANTE: CORS gerenciado pelo Nginx")
    print("🌐 Frontend: https://app.socialflow.aitonomy.ai")
    print("🌐 Backend: https://api.aitonomy.ai")
    print("=" * 60)
    
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=9000,
        log_level="info"
    )