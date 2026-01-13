import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RealtimeChat } from "@/utils/RealtimeAudio";
import { FloatingMicButton } from "./FloatingMicButton";
import { VoiceAgentModal } from "./VoiceAgentModal";
import { toast } from "sonner";
import { VoiceCommandHandler, parseVoiceCommand } from "@/utils/voiceCommandHandler";

interface VoiceAgentProps {
  onTranscript?: (text: string, isUser: boolean) => void;
}

export function VoiceAgent({ onTranscript }: VoiceAgentProps) {
  const navigate = useNavigate();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cooldownMs, setCooldownMs] = useState(0);
  const chatRef = useRef<RealtimeChat | null>(null);
  const transcriptBufferRef = useRef("");
  const commandHandlerRef = useRef<VoiceCommandHandler | null>(null);

  useEffect(() => {
    commandHandlerRef.current = new VoiceCommandHandler(navigate);
  }, [navigate]);

  useEffect(() => {
    return () => {
      if (chatRef.current) {
        chatRef.current.disconnect();
      }
    };
  }, []);

  const handleMessage = (event: any) => {
    console.log('Voice event:', event.type);

    switch (event.type) {
      case 'response.audio.delta':
        setIsSpeaking(true);
        break;

      case 'response.audio.done':
        setIsSpeaking(false);
        break;

      case 'response.audio_transcript.delta':
        if (event.delta) {
          transcriptBufferRef.current += event.delta;
          setCurrentTranscript(transcriptBufferRef.current);
        }
        break;

      case 'response.audio_transcript.done':
        if (transcriptBufferRef.current) {
          onTranscript?.(transcriptBufferRef.current, false);
          setCurrentTranscript("");
          transcriptBufferRef.current = "";
        }
        break;

      case 'conversation.item.input_audio_transcription.completed':
        if (event.transcript) {
          onTranscript?.(event.transcript, true);
          
          // Parse and execute voice commands
          const command = parseVoiceCommand(event.transcript);
          if (command && commandHandlerRef.current) {
            commandHandlerRef.current.executeCommand(command);
          }
        }
        break;
      
      case 'response.function_call_arguments.done':
        // Handle function calls from the AI
        if (event.arguments) {
          try {
            const args = JSON.parse(event.arguments);
            if (commandHandlerRef.current) {
              commandHandlerRef.current.executeCommand({
                action: event.name || args.action,
                params: args
              });
            }
          } catch (error) {
            console.error('Error parsing function call:', error);
          }
        }
        break;

      case 'error':
        console.error('Voice error:', event);
        toast.error("Erro na comunicação de voz");
        break;
      case 'conversation.item.input_audio_transcription.failed':
        console.error('Transcription failed', event);
        const msg = event.error?.message || 'Verifique seu microfone e tente novamente.';
        if (typeof msg === 'string' && msg.includes('429')) {
          toast.error('Limite de transcrição atingido. Aguardando para tentar novamente...');
          // Pause input for a short cooldown to avoid more 429s
          const cooldown = 8000; // 8s cooldown
          chatRef.current?.setInputPaused(true);
          setCooldownMs(cooldown);
          const started = Date.now();
          const interval = setInterval(() => {
            const elapsed = Date.now() - started;
            const remaining = Math.max(0, cooldown - elapsed);
            setCooldownMs(remaining);
            if (remaining === 0) {
              clearInterval(interval);
              chatRef.current?.setInputPaused(false);
            }
          }, 250);
        } else {
          toast.error('Falha ao transcrever áudio. ' + msg);
        }
        break;
    }
  };

  const startConversation = async () => {
    setIsLoading(true);
    try {
      // Get language from localStorage, default to 'pt'
      const savedLang = localStorage.getItem('language') || 'pt';
      chatRef.current = new RealtimeChat(handleMessage);
      await chatRef.current.init(savedLang as 'pt' | 'es' | 'en');
      setIsConnected(true);
      toast.success("Agente de voz conectado");
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error(
        error instanceof Error && error.message.includes('OPENAI_API_KEY')
          ? "Configure a API key do OpenAI em Settings → Backend"
          : "Erro ao conectar agente de voz"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const endConversation = () => {
    chatRef.current?.disconnect();
    setIsConnected(false);
    setIsSpeaking(false);
    setCurrentTranscript("");
    transcriptBufferRef.current = "";
    toast.info("Agente de voz desconectado");
  };

  const handleToggle = () => {
    if (isConnected) {
      endConversation();
      setIsModalOpen(false);
    } else {
      startConversation();
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <FloatingMicButton
        isConnected={isConnected}
        isLoading={isLoading}
        isSpeaking={isSpeaking}
        onToggle={handleToggle}
      />

      <VoiceAgentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          if (isConnected) {
            endConversation();
          }
        }}
        isSpeaking={isSpeaking}
        isConnected={isConnected}
        currentTranscript={currentTranscript}
        cooldownMs={cooldownMs}
      />
    </>
  );
}