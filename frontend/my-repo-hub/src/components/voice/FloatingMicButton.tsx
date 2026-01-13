import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Loader2, Volume2 } from "lucide-react";

interface FloatingMicButtonProps {
  isConnected: boolean;
  isLoading: boolean;
  isSpeaking: boolean;
  onToggle: () => void;
}

export function FloatingMicButton({
  isConnected,
  isLoading,
  isSpeaking,
  onToggle,
}: FloatingMicButtonProps) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-center gap-2">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <div className="relative">
          {/* Ondas neurais dinâmicas FLOW - azul elétrico/roxo/branco neon */}
          <AnimatePresence>
            {isSpeaking && (
              <>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 2.5, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeOut"
                  }}
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/40 via-purple-500/40 to-blue-500/40 blur-2xl"
                  style={{ zIndex: -1 }}
                />
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 2, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: 0.4,
                    ease: "easeOut"
                  }}
                  className="absolute inset-0 rounded-full bg-gradient-to-l from-purple-500/30 via-blue-500/30 to-purple-500/30 blur-xl"
                  style={{ zIndex: -1 }}
                />
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: 0.8,
                    ease: "easeOut"
                  }}
                  className="absolute inset-0 rounded-full bg-white/20 blur-lg"
                  style={{ zIndex: -1 }}
                />
              </>
            )}
          </AnimatePresence>

          {/* Botão principal FLOW - design neural futurista */}
          <motion.button
            onClick={onToggle}
            disabled={isLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={{
              boxShadow: isConnected 
                ? [
                    '0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(147, 51, 234, 0.3)',
                    '0 0 30px rgba(147, 51, 234, 0.5), 0 0 50px rgba(59, 130, 246, 0.3)',
                    '0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(147, 51, 234, 0.3)',
                  ]
                : '0 0 10px rgba(0, 0, 0, 0.2)'
            }}
            transition={{
              boxShadow: { duration: 3, repeat: Infinity, ease: "easeInOut" }
            }}
            className={`
              relative h-16 w-16 rounded-full
              transition-all duration-300 ease-out
              ${isConnected 
                ? 'bg-gradient-to-br from-blue-600 via-purple-600 to-blue-500' 
                : 'bg-gradient-to-br from-gray-600 via-gray-700 to-gray-600'
              }
              ${isSpeaking ? 'ring-4 ring-blue-400/60' : 'hover:ring-2 hover:ring-purple-400/40'}
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {/* Brilho neural interno com respiração */}
            <motion.div 
              animate={{
                opacity: isConnected ? [0.3, 0.6, 0.3] : 0.2,
                scale: isConnected ? [1, 1.1, 1] : 1
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 rounded-full bg-gradient-to-br from-white/40 via-blue-300/30 to-purple-300/30 blur-sm" 
            />
            
            {/* Ícone */}
            <div className="relative z-10 flex items-center justify-center h-full w-full">
              {isLoading ? (
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              ) : isConnected ? (
                isSpeaking ? (
                  <Volume2 className="h-6 w-6 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] animate-pulse" />
                ) : (
                  <MicOff className="h-6 w-6 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
                )
              ) : (
                <Mic className="h-6 w-6 text-white/80" />
              )}
            </div>

            {/* Status indicator com respiração */}
            <motion.div
              animate={{
                scale: isSpeaking ? [1, 1.3, 1] : isConnected ? [1, 1.1, 1] : 1,
                opacity: isConnected ? [0.8, 1, 0.8] : 0.5
              }}
              transition={{
                duration: isSpeaking ? 0.8 : 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className={`
                absolute -top-1 -right-1 h-4 w-4 rounded-full
                ${isConnected ? 'bg-gradient-to-br from-green-400 to-emerald-500' : 'bg-gray-500'}
                ring-2 ring-background
                shadow-[0_0_10px_rgba(74,222,128,0.6)]
              `}
            />
          </motion.button>
        </div>
      </motion.div>

      {/* Label FLOW com efeito neon */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative px-4 py-1.5 rounded-full border border-blue-400/30 backdrop-blur-md bg-gradient-to-r from-blue-950/80 via-purple-950/80 to-blue-950/80"
      >
        <motion.div
          animate={{
            opacity: isConnected ? [0.3, 0.6, 0.3] : 0.2
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 blur-sm"
        />
        <span className="relative text-xs font-semibold bg-gradient-to-r from-blue-300 via-purple-200 to-blue-300 bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(147,197,253,0.5)]">
          {isLoading 
            ? 'FLOW iniciando...' 
            : isConnected 
              ? isSpeaking 
                ? 'FLOW ouvindo...' 
                : 'FLOW ativo'
              : 'FLOW'
          }
        </span>
      </motion.div>
    </div>
  );
}