import { motion, AnimatePresence } from "framer-motion";
import { X, Volume2, Radio } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface VoiceAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSpeaking: boolean;
  isConnected: boolean;
  currentTranscript: string;
  cooldownMs?: number;
}

export function VoiceAgentModal({
  isOpen,
  onClose,
  isSpeaking,
  isConnected,
  currentTranscript,
}: VoiceAgentModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl border-0 bg-transparent p-0 overflow-hidden">
        <DialogHeader>
          <DialogTitle className="sr-only">FLOW – Agente Inteligente</DialogTitle>
          <DialogDescription className="sr-only">Assistente de voz do SocialFlow com visualização e transcrição em tempo real.</DialogDescription>
        </DialogHeader>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative rounded-3xl overflow-hidden"
        >
          {/* Background neural gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-purple-950 to-blue-950" />
          
          {/* Animated mesh gradient overlay */}
          <motion.div
            animate={{
              opacity: [0.3, 0.5, 0.3],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-600/20 via-purple-600/20 to-transparent"
          />

          {/* Particle effects */}
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-blue-400/40 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  y: [0, -50],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                  ease: "easeOut"
                }}
              />
            ))}
          </div>

          {/* Content */}
          <div className="relative z-10 p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="relative"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-blue-500 flex items-center justify-center">
                    <Radio className="w-6 h-6 text-white" />
                  </div>
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 0.8, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute inset-0 rounded-full bg-blue-400/30 blur-md"
                  />
                </motion.div>

                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-200 via-purple-200 to-blue-200 bg-clip-text text-transparent">
                    FLOW
                  </h2>
                  <p className="text-xs text-blue-300/60">Agente Inteligente SocialFlow</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            {/* Status indicator */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <motion.div
                animate={{
                  scale: isConnected ? [1, 1.2, 1] : 1,
                  opacity: isConnected ? [0.6, 1, 0.6] : 0.3,
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-gray-500'}`}
              />
              <span className="text-sm text-white/60">
                {isConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>

            {/* Central audio visualization */}
            <div className="relative h-64 flex items-center justify-center mb-6">
              {/* Circular waveform */}
              <div className="relative w-48 h-48">
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute top-1/2 left-1/2"
                    style={{
                      transform: `rotate(${i * 30}deg)`,
                      transformOrigin: '0 0',
                    }}
                  >
                    <motion.div
                      animate={{
                        scaleY: isSpeaking 
                          ? [1, 1.5 + Math.random(), 1]
                          : [1, 1.1, 1],
                        opacity: isSpeaking ? [0.6, 1, 0.6] : [0.3, 0.5, 0.3],
                      }}
                      transition={{
                        duration: 0.5 + Math.random() * 0.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.1,
                      }}
                      className="w-1 h-16 bg-gradient-to-t from-blue-500 via-purple-500 to-transparent rounded-full"
                      style={{
                        transformOrigin: 'bottom',
                      }}
                    />
                  </motion.div>
                ))}

                {/* Center pulse */}
                <motion.div
                  animate={{
                    scale: isSpeaking ? [1, 1.3, 1] : [1, 1.1, 1],
                    opacity: isSpeaking ? [0.6, 1, 0.6] : [0.4, 0.6, 0.4],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute inset-0 m-auto w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/40 via-purple-500/40 to-blue-500/40 blur-2xl"
                />

                {/* Center icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{
                      scale: isSpeaking ? [1, 1.1, 1] : 1,
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <Volume2 className="w-12 h-12 text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]" />
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Transcript display */}
            <AnimatePresence>
              {currentTranscript && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="rounded-2xl bg-gradient-to-br from-blue-900/30 via-purple-900/30 to-blue-900/30 backdrop-blur-xl border border-blue-400/20 p-6"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                      <Volume2 className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-blue-200/60 mb-1">FLOW está falando:</p>
                      <p className="text-base text-white/90 leading-relaxed">
                        {currentTranscript}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Instructions */}
            {!currentTranscript && (
              <div className="text-center">
                <p className="text-sm text-white/40">
                  {isSpeaking 
                    ? 'Ouvindo sua voz...' 
                    : 'Fale agora para interagir com o FLOW'
                  }
                </p>
              </div>
            )}
          </div>

          {/* Bottom glow */}
          <motion.div
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-blue-600/20 via-purple-600/10 to-transparent"
          />
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
