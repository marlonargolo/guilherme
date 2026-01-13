// whatsapp_server_multiuser.js - Servidor WhatsApp Multi-usuário CORRIGIDO
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8001;
const BACKEND_WEBHOOK_URL = process.env.BACKEND_WEBHOOK_URL || 'http://127.0.0.1:9000/webhook/whatsapp';

console.log(`
╔════════════════════════════════════════╗
║   WHATSAPP SERVER v3.0 - MULTI-USER   ║
╚════════════════════════════════════════╝
`);

// ==================== CORS CONFIGURATION ====================
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:8080',
    'https://app.socialflow.aitonomy.ai',
    'https://api.aitonomy.ai'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log(`⚠️ CORS bloqueado para origem: ${origin}`);
            callback(null, true);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-User-ID'],
    exposedHeaders: ['Content-Length', 'Content-Type'],
    maxAge: 86400
}));

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));

// ==================== GERENCIAMENTO DE SESSÕES POR USUÁRIO ====================
const userSessions = new Map(); // userId -> { client, state, qrCode, etc }

function getUserSession(userId) {
    if (!userSessions.has(userId)) {
        console.log(`📝 [SESSION] Criando nova sessão para: ${userId}`);
        userSessions.set(userId, {
            client: null,
            state: {
                isReady: false,
                isConnected: false,
                isAuthenticated: false,
                qrCode: null,
                qrCodeDataURL: null,
                clientInfo: null,
                lastConnection: null,
                messageCount: 0,
                errorCount: 0,
                isInitializing: false
            },
            lidCache: new Map(),
            numberToLidCache: new Map()
        });
    }
    return userSessions.get(userId);
}

// ==================== FUNÇÕES AUXILIARES ====================
function isBrazilianNumber(digits) {
    const clean = digits.replace(/\D/g, '');
    if (clean.startsWith('55')) {
        return clean.length >= 12 && clean.length <= 13;
    }
    return clean.length >= 10 && clean.length <= 11;
}

function formatPhoneNumber(phone) {
    if (phone.includes('@lid') || phone.endsWith('@c.us')) {
        return phone;
    }
    
    let digits = phone.replace(/\D/g, '');
    
    if (!digits) {
        throw new Error('Número inválido');
    }
    
    if (digits.length >= 10 && digits.length <= 11 && !digits.startsWith('55')) {
        digits = '55' + digits;
    }
    
    return `${digits}@c.us`;
}

async function extractRealPhoneNumber(message, session) {
    try {
        const fromId = message.from;
        
        if (fromId.endsWith('@lid')) {
            const cachedPhone = session.lidCache.get(fromId);
            if (cachedPhone) return cachedPhone;
            
            try {
                const contact = await message.getContact();
                if (contact.number) {
                    const cleanNumber = contact.number.replace(/\D/g, '');
                    if (cleanNumber.length >= 10) {
                        session.lidCache.set(fromId, cleanNumber);
                        session.numberToLidCache.set(cleanNumber, fromId);
                        return cleanNumber;
                    }
                }
            } catch (e) {}
            
            return fromId;
        }
        
        if (fromId.endsWith('@c.us')) {
            return fromId.replace('@c.us', '').replace(/\D/g, '');
        }
        
        return fromId.replace(/@.*$/, '');
    } catch (error) {
        console.error(`❌ [EXTRACT] Erro: ${error.message}`);
        return message.from;
    }
}

// ==================== INICIALIZAR CLIENTE WHATSAPP ====================
async function initializeWhatsAppClient(userId) {
    const session = getUserSession(userId);
    
    // Se já está inicializando, aguardar
    if (session.state.isInitializing) {
        console.log(`⏳ [${userId}] Cliente já está inicializando, aguardando...`);
        return session;
    }
    
    // Se já tem cliente e está conectado, retornar
    if (session.client && session.state.isReady) {
        console.log(`✅ [${userId}] Cliente já conectado`);
        return session;
    }
    
    // Se tem cliente mas não está pronto, destruir e recriar
    if (session.client && !session.state.isReady) {
        console.log(`🔄 [${userId}] Destruindo cliente antigo`);
        try {
            await session.client.destroy();
        } catch (e) {
            console.log(`⚠️ [${userId}] Erro ao destruir: ${e.message}`);
        }
        session.client = null;
    }
    
    session.state.isInitializing = true;
    console.log(`🚀 [${userId}] Inicializando WhatsApp Client...`);
    
    const client = new Client({
        authStrategy: new LocalAuth({
            clientId: `user_${userId}`,
            dataPath: path.join(__dirname, '.wwebjs_auth')
        }),
        puppeteer: {
            headless: true,
            executablePath: '/usr/bin/chromium-browser', // Ajuste conforme o resultado de 'which chromium'
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ],
            timeout: 60000
        },
        webVersionCache: {
            type: 'remote',
            remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'
        }
    });
    
    // ==================== EVENTOS DO CLIENTE ====================
    client.on('qr', async (qr) => {
        console.log(`📱 [${userId}] QR CODE GERADO`);
        
        try {
            // Gerar QR Code como Data URL
            const qrDataURL = await qrcode.toDataURL(qr);
            session.state.qrCode = qr;
            session.state.qrCodeDataURL = qrDataURL;
            session.state.isReady = false;
            
            console.log(`✅ [${userId}] QR Code salvo (${qr.substring(0, 20)}...)`);
            console.log(`📊 [${userId}] Estado atualizado: qrCode=${!!session.state.qrCode}, qrCodeDataURL=${!!session.state.qrCodeDataURL}`);
        } catch (err) {
            console.error(`❌ [${userId}] Erro ao gerar QR Code:`, err);
        }
    });
    
    client.on('ready', () => {
        console.log(`✅ [${userId}] WHATSAPP CONECTADO!`);
        
        if (client.info) {
            session.state.clientInfo = {
                phone: client.info.wid.user,
                pushname: client.info.pushname || 'N/A',
                platform: client.info.platform || 'N/A'
            };
            console.log(`📱 [${userId}] ${session.state.clientInfo.pushname} (${session.state.clientInfo.phone})`);
        }
        
        session.state.isReady = true;
        session.state.isConnected = true;
        session.state.isAuthenticated = true;
        session.state.isInitializing = false;
        session.state.lastConnection = new Date().toISOString();
        session.state.qrCode = null;
        session.state.qrCodeDataURL = null;
    });
    
    client.on('authenticated', () => {
        console.log(`✅ [${userId}] Autenticado`);
        session.state.isAuthenticated = true;
    });
    
    client.on('auth_failure', (msg) => {
        console.error(`❌ [${userId}] Falha na autenticação: ${msg}`);
        session.state.isReady = false;
        session.state.isInitializing = false;
        session.state.errorCount++;
    });
    
    client.on('disconnected', (reason) => {
        console.log(`🔴 [${userId}] Desconectado: ${reason}`);
        session.state.isReady = false;
        session.state.isConnected = false;
        session.state.isInitializing = false;
        
        // Limpar QR Code antigo
        session.state.qrCode = null;
        session.state.qrCodeDataURL = null;
    });
    
    client.on('message', async (message) => {
        try {
            session.state.messageCount++;
            
            if (message.from === 'status@broadcast' || message.from.endsWith('@g.us')) {
                return;
            }
            
            const realPhoneNumber = await extractRealPhoneNumber(message, session);
            let formattedPhone = realPhoneNumber;
            
            if (!realPhoneNumber.includes('@')) {
                formattedPhone = formatPhoneNumber(realPhoneNumber);
            }
            
            let contactInfo = { name: '', pushname: '', number: realPhoneNumber };
            
            try {
                const contact = await message.getContact();
                contactInfo.pushname = contact.pushname || '';
                contactInfo.name = contact.name || '';
            } catch (e) {}
            
            const webhookData = {
                event: 'message_received',
                userId: userId,
                timestamp: new Date().toISOString(),
                message: {
                    id: message.id._serialized,
                    from: message.from,
                    phone: realPhoneNumber,
                    phone_formatted: formattedPhone,
                    body: message.body || '',
                    type: message.type,
                    timestamp: message.timestamp,
                    hasMedia: message.hasMedia,
                    isLid: message.from.endsWith('@lid'),
                    contact: contactInfo
                }
            };
            
            if (message.hasMedia) {
                try {
                    const media = await message.downloadMedia();
                    webhookData.message.media = {
                        mimetype: media.mimetype,
                        data: media.data
                    };
                } catch (e) {}
            }
            
            try {
                await axios.post(BACKEND_WEBHOOK_URL, webhookData, {
                    timeout: 10000,
                    headers: { 'Content-Type': 'application/json' }
                });
            } catch (e) {
                console.error(`❌ [${userId}] Webhook: ${e.message}`);
            }
        } catch (error) {
            console.error(`❌ [${userId}] Erro: ${error.message}`);
            session.state.errorCount++;
        }
    });
    
    session.client = client;
    
    // Inicializar o cliente
    client.initialize().catch(e => {
        console.error(`❌ [${userId}] Erro ao inicializar: ${e.message}`);
        session.state.isInitializing = false;
    });
    
    return session;
}

// ==================== MIDDLEWARE PARA EXTRAIR USER ID ====================
function extractUserId(req) {
    return req.headers['x-user-id'] || 
           req.query.userId || 
           req.body?.userId || 
           'default_user';
}

// ==================== API ENDPOINTS ====================

app.get('/health', (req, res) => {
    res.json({ 
        status: 'online', 
        version: '3.0.0',
        activeSessions: userSessions.size
    });
});

app.get('/whatsapp/status', (req, res) => {
    const userId = extractUserId(req);
    console.log(`📊 [STATUS] Verificando sessão para: ${userId}`);
    
    const session = getUserSession(userId);
    
    res.json({
        userId: userId,
        status: session.state.isReady ? 'connected' : 'disconnected',
        ready: session.state.isReady,
        connected: session.state.isConnected,
        authenticated: session.state.isAuthenticated,
        clientInfo: session.state.clientInfo,
        statistics: {
            messageCount: session.state.messageCount,
            errorCount: session.state.errorCount,
            lidCacheSize: session.lidCache.size
        },
        requiresQR: !session.state.isReady && !session.state.isInitializing,
        isInitializing: session.state.isInitializing
    });
});

app.get('/whatsapp/qr', async (req, res) => {
    const userId = extractUserId(req);
    console.log(`📱 [QR] Requisição de usuário: ${userId}`);
    
    let session = getUserSession(userId);
    
    // Se já está conectado
    if (session.state.isReady) {
        console.log(`✅ [QR] WhatsApp já conectado para ${userId}`);
        return res.json({ 
            qrCode: null,
            qrCodeDataURL: null,
            connected: true,
            clientInfo: session.state.clientInfo
        });
    }
    
    // Se já tem QR Code disponível, retornar imediatamente
    if (session.state.qrCode || session.state.qrCodeDataURL) {
        console.log(`✅ [QR] QR Code já disponível para ${userId}`);
        return res.json({ 
            qrCode: session.state.qrCode,
            qrCodeDataURL: session.state.qrCodeDataURL,
            requiresScan: true,
            timestamp: new Date().toISOString()
        });
    }
    
    // Se não tem cliente ou não está inicializando, inicializar
    if (!session.client || !session.state.isInitializing) {
        console.log(`🚀 [QR] Inicializando cliente para ${userId}`);
        session = await initializeWhatsAppClient(userId);
        
        // Aguardar um pouco para o QR ser gerado
        let attempts = 0;
        while (!session.state.qrCode && !session.state.isReady && attempts < 30) {
            await new Promise(resolve => setTimeout(resolve, 500));
            attempts++;
            
            if (session.state.isReady) {
                // Conectou durante a espera
                console.log(`✅ [QR] Conectado durante inicialização para ${userId}`);
                return res.json({ 
                    qrCode: null,
                    qrCodeDataURL: null,
                    connected: true,
                    clientInfo: session.state.clientInfo
                });
            }
            
            if (session.state.qrCode) {
                // QR Code gerado
                console.log(`✅ [QR] QR Code gerado após ${attempts} tentativas para ${userId}`);
                return res.json({ 
                    qrCode: session.state.qrCode,
                    qrCodeDataURL: session.state.qrCodeDataURL,
                    requiresScan: true,
                    timestamp: new Date().toISOString()
                });
            }
        }
    }
    
    // Ainda não disponível
    console.log(`⏳ [QR] QR Code ainda não disponível para ${userId}`);
    res.status(202).json({ 
        error: 'QR Code ainda não disponível',
        ready: session.state.isReady,
        authenticated: session.state.isAuthenticated,
        isInitializing: session.state.isInitializing,
        message: 'Aguarde alguns segundos e tente novamente'
    });
});

app.post('/whatsapp/send-message', async (req, res) => {
    const userId = extractUserId(req);
    const session = getUserSession(userId);
    
    console.log(`📤 [SEND] Solicitação de ${userId}`);
    
    if (!session.client || !session.state.isReady) {
        return res.status(503).json({ 
            success: false, 
            error: 'WhatsApp não conectado para este usuário' 
        });
    }
    
    const { phone, message } = req.body;
    
    if (!phone || !message) {
        return res.status(400).json({ 
            success: false, 
            error: 'Phone e message obrigatórios' 
        });
    }
    
    try {
        let chatId;
        
        if (phone.includes('@lid')) {
            chatId = phone;
        } else {
            const cachedLid = session.numberToLidCache.get(phone);
            chatId = cachedLid || formatPhoneNumber(phone);
        }
        
        const sentMessage = await session.client.sendMessage(chatId, message.trim());
        
        res.json({
            success: true,
            messageId: sentMessage.id._serialized,
            chatId: chatId,
            status: 'sent',
            usedLid: chatId.includes('@lid')
        });
    } catch (error) {
        console.error(`❌ [${userId}] Erro ao enviar: ${error.message}`);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/whatsapp/restart', async (req, res) => {
    const userId = extractUserId(req);
    const session = getUserSession(userId);
    
    console.log(`🔄 [RESTART] Reiniciando para ${userId}`);
    
    try {
        if (session.client) {
            await session.client.destroy();
        }
        
        session.state.isReady = false;
        session.state.isConnected = false;
        session.state.isInitializing = false;
        session.state.qrCode = null;
        session.state.qrCodeDataURL = null;
        session.client = null;
        
        // Reinicializar imediatamente
        await initializeWhatsAppClient(userId);
        
        res.json({ success: true, message: 'Reiniciando...' });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.get('/', (req, res) => {
    res.json({
        service: 'WhatsApp Server Multi-User',
        version: '3.0.0',
        activeSessions: userSessions.size,
        endpoints: {
            status: '/whatsapp/status',
            qr: '/whatsapp/qr',
            send: '/whatsapp/send-message',
            restart: '/whatsapp/restart'
        }
    });
});

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Servidor Multi-User: http://localhost:${PORT}`);
    console.log(`✅ CORS habilitado`);
    console.log(`👥 Sessões ativas: ${userSessions.size}\n`);
});

process.on('SIGINT', async () => {
    console.log('\n🛑 Encerrando...');
    for (const [userId, session] of userSessions.entries()) {
        if (session.client) {
            await session.client.destroy();
        }
    }
    server.close(() => process.exit(0));
});