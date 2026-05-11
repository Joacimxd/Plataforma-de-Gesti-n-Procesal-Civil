import { useState, useRef, useEffect } from "react";
import { MessageCircleIcon, SendIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const DEMO_RESPONSES = [
  "Esta es una demostración del asistente. En producción podría ayudarte con consultas sobre casos, plazos o documentación.",
  "Puedes preguntar por estado de un caso, próximas audiencias o resúmenes de documentos.",
  "Funcionalidad de IA en desarrollo.",
];

export default function AIChatButton() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([
    { role: "assistant", text: "Hola. Soy el asistente de la plataforma (demo). ¿En qué puedo ayudarte?" },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo(0, listRef.current.scrollHeight);
  }, [messages]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || thinking) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text }]);
    setThinking(true);
    setTimeout(() => {
      const reply =
        DEMO_RESPONSES[Math.floor(Math.random() * DEMO_RESPONSES.length)];
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
      setThinking(false);
    }, 600 + Math.random() * 400);
  }

  return (
    <>
      <Button
        size="icon"
        className="fixed bottom-6 right-6 z-40 size-14 rounded-full shadow-lg"
        aria-label="Abrir asistente IA"
        onClick={() => setOpen(true)}
      >
        <MessageCircleIcon className="size-7" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex h-[420px] max-h-[85vh] flex-col sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Asistente IA</DialogTitle>
          </DialogHeader>
          <div
            ref={listRef}
            className="flex-1 space-y-3 overflow-y-auto rounded-md border bg-muted/30 p-3"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                  m.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                {m.text}
              </div>
            ))}
            {thinking && (
              <div className="max-w-[85%] rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                Pensando...
              </div>
            )}
          </div>
          <form onSubmit={handleSend} className="flex gap-2 pt-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe un mensaje..."
              disabled={thinking}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={thinking || !input.trim()}>
              <SendIcon className="size-4" />
              <span className="sr-only">Enviar</span>
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
