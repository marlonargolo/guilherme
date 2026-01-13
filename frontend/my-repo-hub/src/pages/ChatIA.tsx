import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, Loader2, Trash2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import api from "@/lib/api";


interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

const quickQuestions = [
  "Como criar postagens virais?",
  "Dicas para conteúdo que bomba?",
  "Estratégias de engajamento?",
];

const MAX_MESSAGES_IN_PROMPT = 8;
const SUMMARY_CHAR_LIMIT = 800;
const INBOX_SUMMARY_LIMIT = 600;
const MAX_INBOX_MESSAGES = 5;

const summarizeMessages = (items: Message[]) => {
  if (!items.length) return null;
  let summary = "";
  for (const item of items) {
    const snippet = `${item.role === "user" ? "Usuário" : "Assistente"}: ${item.content}`.replace(/\s+/g, " ").trim();
    if (!snippet) continue;
    const candidate = summary ? `${summary} | ${snippet}` : snippet;
    if (candidate.length > SUMMARY_CHAR_LIMIT) break;
    summary = candidate;
  }
  return summary || null;
};

type InboxSummaryItem = {
  sender_name?: string;
  metadata?: { contact_username?: string };
  platform?: string;
  message?: string;
};

const summarizeInboxMessages = (items: InboxSummaryItem[]) => {
  if (!items.length) return null;
  const lines: string[] = [];
  for (const message of items.slice(0, MAX_INBOX_MESSAGES)) {
    const contact = message.sender_name || message.metadata?.contact_username || "Contato";
    const platform = message.platform ? message.platform.toUpperCase() : "Canal";
    const snippet = (message.message || "").replace(/\s+/g, " ").trim();
    if (!snippet) continue;
    const entry = `[${platform}] ${contact}: ${snippet}`;
    lines.push(entry);
    if (lines.join(" | ").length >= INBOX_SUMMARY_LIMIT) break;
  }
  const result = lines.join(" | ");
  return result ? `Conversas recentes na inbox: ${result}` : null;
};

export default function ChatIA() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [inboxSummary, setInboxSummary] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = messages.filter(msg =>
        msg.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMessages(filtered);
    } else {
      setFilteredMessages(messages);
    }
  }, [searchTerm, messages]);

  useEffect(() => {
    loadMessages();
    loadInboxContext();
  }, []);

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from("ai_chat_messages")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading messages:", error);
      return;
    }

    if (data) {
      setMessages(data as Message[]);
    }
  };

  const loadInboxContext = async () => {
    try {
      const inboxMessages = await api.getMessages({ limit: 15 });
      const summary = summarizeInboxMessages(inboxMessages);
      if (summary) {
        setInboxSummary(summary);
      }
    } catch (error) {
      console.warn("Não foi possível carregar o contexto da inbox:", error);
    }
  };

  const handleSendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    
    if (!messageText) {
      toast.error("Digite uma mensagem");
      return;
    }

    setIsLoading(true);
    setInput("");

    // Add user message
    const userMessage = {
      id: crypto.randomUUID(),
      role: "user" as const,
      content: messageText,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      // Save user message
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Você precisa estar logado");
        return;
      }

      await supabase.from("ai_chat_messages").insert({
        user_id: user.id,
        role: "user",
        content: messageText,
      });

      // Build conversation history with the latest user input
      const historyWithNew = [...messages, userMessage];
      const summarySource = historyWithNew.slice(Math.max(0, historyWithNew.length - MAX_MESSAGES_IN_PROMPT - 10), Math.max(0, historyWithNew.length - MAX_MESSAGES_IN_PROMPT));
      const conversationSummary = summarizeMessages(summarySource);
      const conversationHistory = historyWithNew
        .slice(-MAX_MESSAGES_IN_PROMPT)
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

      // Get AI response - incluindo token de autenticação
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke("chat-ia", {
        body: {
          messages: conversationHistory,
          summary: conversationSummary || undefined,
          inbox_context: inboxSummary || undefined,
        },
        headers: session?.access_token ? {
          Authorization: `Bearer ${session.access_token}`
        } : {}
      });

      if (error) throw error;

      const assistantMessage = {
        id: crypto.randomUUID(),
        role: "assistant" as const,
        content: data.response,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Save assistant message
      await supabase.from("ai_chat_messages").insert({
        user_id: user.id,
        role: "assistant",
        content: data.response,
      });
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erro ao enviar mensagem");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("ai_chat_messages")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;

      setMessages([]);
      toast.success("Chat limpo com sucesso");
    } catch (error) {
      console.error("Error clearing chat:", error);
      toast.error("Erro ao limpar chat");
    }
  };


  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      {/* Main Chat Area - Left Side */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              <MessageSquare className="h-8 w-8 text-primary" />
              Bate-papo IA
            </h1>
            <p className="text-muted-foreground mt-1">
              Converse com o seu agente de IA personalizado
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearChat}
            className="border-border/50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Limpar Chat
          </Button>
        </div>

        {/* Chat Container */}
        <Card className="glass-card flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-12">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Olá! Sou seu agente de IA.</p>
                <p className="text-sm mt-2">Como posso ajudar você hoje?</p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                id={`msg-${message.id}`}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {message.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-2 leading-relaxed text-sm">{children}</p>,
                          ul: ({ children }) => <ul className="mb-2 ml-4 list-disc space-y-1 text-sm">{children}</ul>,
                          ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal space-y-1 text-sm">{children}</ol>,
                          li: ({ children }) => <li className="leading-relaxed text-sm">{children}</li>,
                          strong: ({ children }) => <strong className="font-bold text-foreground text-sm">{children}</strong>,
                          em: ({ children }) => <em className="italic text-sm">{children}</em>,
                          h1: ({ children }) => <h1 className="text-lg font-bold mb-2 mt-4">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-base font-bold mb-2 mt-3">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-sm font-bold mb-2 mt-2">{children}</h3>,
                          code: ({ children }) => (
                            <code className="bg-muted-foreground/10 px-1 py-0.5 rounded text-xs font-mono">
                              {children}
                            </code>
                          ),
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed text-sm">{message.content}</p>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-muted">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-border/50 p-4 bg-background/50">
            {/* Quick Questions */}
            <div className="flex gap-2 mb-3 flex-wrap">
              {quickQuestions.map((question) => (
                <Button
                  key={question}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSendMessage(question)}
                  disabled={isLoading}
                  className="text-xs"
                >
                  {question}
                </Button>
              ))}
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Digite sua mensagem aqui..."
                className="flex-1 min-h-[60px] max-h-[120px] bg-muted/30 border-border/50 resize-none"
                disabled={isLoading}
              />
              <Button
                onClick={() => handleSendMessage()}
                disabled={isLoading || !input.trim()}
                className="btn-glow self-end relative overflow-hidden group h-12 w-12 rounded-xl bg-gradient-to-r from-primary to-accent hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.5)] transition-all duration-300"
                size="icon"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin relative z-10" />
                ) : (
                  <Send className="h-5 w-5 relative z-10 group-hover:scale-110 transition-transform" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* History Sidebar - Right Side */}
      <div className="w-80 flex flex-col">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold">Histórico</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClearChat}
              className="h-8 w-8"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Suas conversas recentes
          </p>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar conversas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 bg-muted/30"
            />
          </div>
        </div>
        
        <Card className="glass-card flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto p-4 space-y-2">
            {filteredMessages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <p className="text-sm">
                  {searchTerm ? "Nenhuma mensagem encontrada" : "Nenhuma mensagem ainda"}
                </p>
              </div>
            ) : (
              filteredMessages.map((message) => (
                <div
                  key={message.id}
                  className={`p-3 rounded-lg text-sm cursor-pointer hover:bg-accent/50 transition-colors ${
                    message.role === "user"
                      ? "bg-primary/10 border border-primary/20"
                      : "bg-muted/50"
                  }`}
                  onClick={() => {
                    // Scroll to message in chat
                    const messageElement = document.getElementById(`msg-${message.id}`);
                    messageElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-xs">
                      {message.role === "user" ? "Você" : "IA"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(message.created_at).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-xs line-clamp-2">{message.content}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
