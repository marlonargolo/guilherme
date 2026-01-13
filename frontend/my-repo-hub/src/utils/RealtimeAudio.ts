import { supabase } from "@/integrations/supabase/client";

export class AudioRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  constructor(private onAudioData: (audioData: Float32Array) => void) {}

  async start() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      this.audioContext = new AudioContext({
        sampleRate: 24000,
      });
      
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        this.onAudioData(new Float32Array(inputData));
      };
      
      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      throw error;
    }
  }

  stop() {
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export const encodeAudioForAPI = (float32Array: Float32Array): string => {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  
  const uint8Array = new Uint8Array(int16Array.buffer);
  let binary = '';
  const chunkSize = 0x8000;
  
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return btoa(binary);
};

export class RealtimeChat {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private audioEl: HTMLAudioElement;
  private recorder: AudioRecorder | null = null;
  private localTrack: MediaStreamTrack | null = null;
  private inputPaused = false;

  constructor(private onMessage: (message: any) => void) {
    this.audioEl = document.createElement("audio");
    this.audioEl.autoplay = true;
  }

  async init(language: 'pt' | 'es' | 'en' = 'pt') {
    try {
      console.log('Fetching ephemeral token...');
      const { data: tokenData, error: tokenError } = await supabase.functions.invoke("voice-token");
      
      if (tokenError) throw tokenError;
      if (!tokenData?.client_secret?.value) {
        throw new Error("Failed to get ephemeral token");
      }

      const EPHEMERAL_KEY = tokenData.client_secret.value;
      console.log('Token received, creating peer connection...');

      this.pc = new RTCPeerConnection();

      this.pc.ontrack = e => {
        console.log('Received audio track');
        this.audioEl.srcObject = e.streams[0];
      };

      const ms = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      this.localTrack = ms.getTracks()[0];
      this.localTrack.enabled = !this.inputPaused;
      this.pc.addTrack(this.localTrack);
      console.log('Local audio track added');

      this.dc = this.pc.createDataChannel("oai-events");
      
      let sessionConfigured = false;
      
      this.dc.addEventListener("message", (e) => {
        const event = JSON.parse(e.data);
        console.log("Received event:", event.type);
        
        // Configure session after receiving session.created
        if (event.type === 'session.created' && !sessionConfigured) {
          sessionConfigured = true;
          console.log('Configuring session...');

          const instructionsMap: Record<'pt'|'es'|'en', string> = {
            pt: 'Você é um assistente virtual chamado Social Flow Assistant. Fale sempre em português brasileiro e ajude usuários a navegar e usar a plataforma Social Flow. Você pode executar ações como navegar para páginas, criar automações, criar posts e gerar conteúdo. Quando o usuário falar um comando, execute imediatamente sem pedir confirmação. Seja direto e objetivo.',
            es: 'Eres un asistente virtual llamado Social Flow Assistant. Responde SIEMPRE en español y ayuda a los usuarios a navegar y usar la plataforma Social Flow. Puedes ejecutar acciones como navegar, crear automatizaciones, crear publicaciones y generar contenido. Cuando el usuario dé un comando, ejecútalo de inmediato sin pedir confirmación. Sé directo y objetivo.',
            en: 'You are a virtual assistant called Social Flow Assistant. ALWAYS respond in English and help users navigate and use the Social Flow platform. You can execute actions like navigating pages, creating automations, creating posts, and generating content. When the user gives a command, execute it immediately without asking for confirmation. Be direct and concise.'
          };

          const sessionInstructions = instructionsMap[language] || instructionsMap.pt;

          this.dc?.send(JSON.stringify({
            type: 'session.update',
            session: {
              modalities: ['audio', 'text'],
              instructions: sessionInstructions,
              voice: 'alloy',
              input_audio_transcription: {
                model: 'whisper-1'
              },
              turn_detection: {
                type: 'server_vad',
                 threshold: 0.7,
                 prefix_padding_ms: 400,
                 silence_duration_ms: 2000
              },
              tools: [
                {
                  type: 'function',
                  name: 'navigate',
                  description: 'Navegar para uma página específica da plataforma',
                  parameters: {
                    type: 'object',
                    properties: {
                      page: { 
                        type: 'string', 
                        description: 'Nome da página',
                        enum: ['dashboard', 'inbox', 'automacoes', 'creator-studio', 'comments', 'scheduler', 'analytics', 'connections', 'settings', 'suporte']
                      }
                    },
                    required: ['page']
                  }
                },
                {
                  type: 'function',
                  name: 'create_automation',
                  description: 'Criar uma nova automação',
                  parameters: {
                    type: 'object',
                    properties: {
                      name: { type: 'string', description: 'Nome da automação' },
                      trigger: { type: 'string', description: 'Gatilho da automação' },
                      action: { type: 'string', description: 'Ação da automação' }
                    }
                  }
                },
                {
                  type: 'function',
                  name: 'create_post',
                  description: 'Criar um novo post no Creator Studio',
                  parameters: {
                    type: 'object',
                    properties: {
                      caption: { type: 'string', description: 'Legenda do post' },
                      platform: { type: 'string', description: 'Plataforma (instagram, facebook, tiktok)' }
                    }
                  }
                },
                {
                  type: 'function',
                  name: 'generate_content',
                  description: 'Gerar conteúdo com IA no Creator Studio',
                  parameters: {
                    type: 'object',
                    properties: {
                      prompt: { type: 'string', description: 'Prompt para gerar o conteúdo' }
                    },
                    required: ['prompt']
                  }
                },
                {
                  type: 'function',
                  name: 'fill_form',
                  description: 'Preencher campos de formulário',
                  parameters: {
                    type: 'object',
                    properties: {
                      field: { type: 'string', description: 'Seletor CSS do campo' },
                      value: { type: 'string', description: 'Valor para preencher' }
                    },
                    required: ['field', 'value']
                  }
                }
              ],
              tool_choice: 'auto',
              temperature: 0.7,
              max_response_output_tokens: 150
            }
          }));
        }
        
        this.onMessage(event);
      });

      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);
      console.log('Local description set');

      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview-2024-12-17";
      
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          "Content-Type": "application/sdp"
        },
      });

      if (!sdpResponse.ok) {
        const errorText = await sdpResponse.text();
        throw new Error(`Failed to connect to OpenAI: ${errorText}`);
      }

      const answer = {
        type: "answer" as RTCSdpType,
        sdp: await sdpResponse.text(),
      };
      
      await this.pc.setRemoteDescription(answer);
      console.log("WebRTC connection established");

      // Using WebRTC microphone track only. Do NOT send manual PCM chunks when using server VAD.
      // This avoids duplicate audio paths that can cause transcription failures.
      console.log('Voice ready. Using WebRTC track with server VAD.');

    } catch (error) {
      console.error("Error initializing chat:", error);
      throw error;
    }
  }

  async sendMessage(text: string) {
    if (!this.dc || this.dc.readyState !== 'open') {
      throw new Error('Data channel not ready');
    }

    const event = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text
          }
        ]
      }
    };

    this.dc.send(JSON.stringify(event));
    this.dc.send(JSON.stringify({type: 'response.create'}));
  }

  setInputPaused(paused: boolean) {
    this.inputPaused = paused;
    if (this.localTrack) {
      this.localTrack.enabled = !paused;
      console.log(paused ? 'Input paused (muted mic track)' : 'Input resumed');
    }
  }

  disconnect() {
    console.log('Disconnecting...');
    this.recorder?.stop();
    this.dc?.close();
    this.pc?.close();
    this.audioEl.srcObject = null;
  }
}