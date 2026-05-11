import { useState, useRef, useEffect } from "react";
import { IconScale, IconFileText as IconFile, IconX as IconClose, IconSend } from "@/components/ui/icons";

const API_URL = "https://ia-juridica-api-t1gu.onrender.com";

export default function ChatbotJuridico() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 0,
      isUser: false,
      text: "Hola, soy el asistente jurídico de la plataforma. Puedo responder preguntas basadas en los documentos legales del caso. ¿En qué puedo ayudarte?",
      sources: [],
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sendMessage = async () => {
    const pregunta = input.trim();
    if (!pregunta || loading) return;

    setInput("");
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), isUser: true, text: pregunta, sources: [] },
    ]);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("pregunta", pregunta);

      const res = await fetch(`${API_URL}/consultar/`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(`Error ${res.status}`);

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          isUser: false,
          text: data.respuesta_ia || "No se pudo obtener respuesta.",
          sources: data.fuentes_consultadas || [],
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          isUser: false,
          text: "Hubo un error al conectar con el asistente. Por favor intenta de nuevo.",
          sources: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40%           { transform: translateY(-5px); }
        }
        .chat-body::-webkit-scrollbar { width: 4px; }
        .chat-body::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }
      `}</style>

      {open && (
        <div 
          className="fixed bottom-24 right-6 w-[350px] max-h-[600px] h-[80vh] flex flex-col bg-background border rounded-2xl shadow-2xl z-50 overflow-hidden"
          style={{ animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}
          role="dialog" 
          aria-label="Asistente Jurídico IA"
        >
          {/* Header */}
          <div className="flex items-center gap-3 p-4 bg-foreground text-background shrink-0">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-background/20">
              <IconScale size={20} className="text-background" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">Asistente IA Jurídico</p>
              <p className="text-xs text-background/70 flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                En línea · RAG sobre el caso
              </p>
            </div>
            <button 
              className="p-1 rounded-full hover:bg-background/20 transition-colors"
              onClick={() => setOpen(false)} 
              aria-label="Cerrar chat"
            >
              <IconClose size={18} className="text-background/80" />
            </button>
          </div>

          {/* Body */}
          <div ref={bodyRef} className="flex-1 overflow-y-auto p-4 bg-muted/30 chat-body space-y-4">
            <div className="text-center text-xs text-muted-foreground my-2">
              {new Date().toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })}
            </div>

            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.isUser ? "flex-row-reverse" : "flex-row"}`}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold bg-foreground text-background">
                  {msg.isUser ? "TÚ" : "IA"}
                </div>
                <div className={`max-w-[75%] ${msg.isUser ? "items-end" : "items-start"} flex flex-col`}>
                  <div className={`px-4 py-2.5 rounded-2xl text-sm ${msg.isUser ? "bg-foreground text-background rounded-tr-sm" : "bg-background border rounded-tl-sm shadow-sm"}`}>
                    {msg.text}
                  </div>
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {msg.sources.map((src: string, i: number) => (
                        <span key={i} className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-muted border rounded text-muted-foreground">
                          <IconFile size={10} /> {src}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 flex-row">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold bg-foreground text-background">
                  IA
                </div>
                <div className="max-w-[75%] items-start flex flex-col">
                  <div className="px-4 py-3.5 rounded-2xl bg-background border rounded-tl-sm shadow-sm flex items-center gap-1">
                    {[0, 1, 2].map((i) => (
                      <span 
                        key={i} 
                        className="w-1.5 h-1.5 rounded-full bg-muted-foreground inline-block"
                        style={{ animation: `bounce 1.2s infinite ease-in-out ${i * 0.2}s` }} 
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-background border-t shrink-0">
            <div className="flex items-center gap-2 bg-muted p-1.5 rounded-xl border">
              <input
                className="flex-1 bg-transparent px-3 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
                type="text"
                placeholder="Escribe una pregunta legal..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                disabled={loading}
                aria-label="Mensaje"
              />
              <button
                className="w-8 h-8 rounded-lg bg-foreground text-background flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-opacity shrink-0"
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                aria-label="Enviar mensaje"
              >
                <IconSend size={14} />
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              Respuestas basadas únicamente en documentos del caso
            </p>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        className="fixed bottom-6 right-6 w-14 h-14 bg-foreground text-background rounded-full shadow-xl flex items-center justify-center hover:scale-105 transition-transform z-50 focus:outline-none focus:ring-2 focus:ring-foreground focus:ring-offset-2"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Cerrar asistente" : "Abrir asistente jurídico"}
      >
        {open ? <IconClose size={24} /> : <IconScale size={24} />}
      </button>
    </>
  );
}
