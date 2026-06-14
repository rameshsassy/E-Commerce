import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/customer/ProtectedRoute";
import { chatApi } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/customer/EmptyState";
import { Send, Bot } from "lucide-react";

export const Route = createFileRoute("/chat")({
  head: () => ({ meta: [{ title: "Live chat — Aashansh" }] }),
  component: () => (
    <ProtectedRoute>
      <ChatPage />
    </ProtectedRoute>
  ),
});

function ChatPage() {
  const qc = useQueryClient();
  const [conversationId, setConversationId] = useState(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    chatApi
      .startConversation({ type: "customer_admin" })
      .then((c) => setConversationId(c._id || c.conversationId || c.id))
      .catch((e) => toast.error(e.message));
  }, []);

  const messages = useQuery({
    queryKey: ["chat-messages", conversationId],
    queryFn: () => chatApi.listMessages(conversationId),
    enabled: !!conversationId,
    refetchInterval: 5000,
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.data]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || !conversationId) return;
    setSending(true);
    try {
      await chatApi.send(conversationId, text.trim());
      setText("");
      qc.invalidateQueries({ queryKey: ["chat-messages", conversationId] });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container-page py-8">
      <div className="mx-auto flex h-[calc(100vh-12rem)] max-w-3xl flex-col overflow-hidden rounded-2xl border bg-card shadow-card">
        <header className="flex items-center gap-3 border-b p-4">
          <div className="grid h-10 w-10 place-items-center rounded-full gradient-primary text-primary-foreground">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-semibold">Aashansh Support</h1>
            <p className="text-xs text-muted-foreground">
              FAQ bot replies instantly • humans within 24 working hours
            </p>
          </div>
        </header>
        <div
          ref={scrollRef}
          className="flex-1 space-y-3 overflow-y-auto bg-muted/30 p-4"
        >
          {!conversationId || messages.isLoading ? (
            <div className="grid h-full place-items-center">
              <LoadingSpinner />
            </div>
          ) : (messages.data || []).length === 0 ? (
            <div className="grid h-full place-items-center text-center text-sm text-muted-foreground">
              Say hi to start the conversation
            </div>
          ) : (
            (messages.data || []).map((m) => {
              const isMe =
                m.senderRole === "customer" || m.isCustomer || m.fromMe;
              const isBot = m.senderRole === "bot" || m.isBot;
              return (
                <div
                  key={m._id}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[78%] rounded-2xl px-4 py-2 text-sm shadow-card ${isMe ? "bg-primary text-primary-foreground" : isBot ? "bg-accent text-accent-foreground" : "bg-card"}`}
                  >
                    {isBot && (
                      <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase opacity-70">
                        <Bot className="h-3 w-3" />
                        FAQ bot
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">
                      {m.content || m.message}
                    </p>
                    <p className="mt-1 text-[10px] opacity-60">
                      {m.createdAt &&
                        new Date(m.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <form onSubmit={send} className="flex gap-2 border-t p-3">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message…"
            disabled={!conversationId}
          />
          <Button
            type="submit"
            size="icon"
            disabled={sending || !text.trim() || !conversationId}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
