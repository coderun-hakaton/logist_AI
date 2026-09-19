'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const suggestions = [
  "Toshkentdan Samarqandga eng xavfsiz va tejamkor yo'nalish qaysi?",
  "20 tonna oziq-ovqat yuki uchun refrijerator narxi qancha?",
  "Toshkent va Samarqand orasida qayerda dam olish mumkin?",
  "Urganchdan Toshkentgacha marshrutlarni taqqosla",
];

export function AIChatbot({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Salom! Men Karvonboshi AI yordamchisiman. Marshrutlar, xarajatlar, dam olish maskanlari va logistika bo'yicha yordam bera olaman. Bugun nima yordam kerak?",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  function getSessionId(): string {
    let id = localStorage.getItem('kb-chat-session');
    if (!id) {
      id = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem('kb-chat-session', id);
    }
    return id;
  }

  const handleSend = async (text?: string) => {
    const message = text || input.trim();
    if (!message || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: message }, { role: 'assistant', content: '' }]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: getSessionId(), message }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`Server xatosi (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let gotError = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === '[DONE]') continue;
          try {
            const json = JSON.parse(payload);
            if (json.delta) {
              const delta: string = json.delta;
              setMessages((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                copy[copy.length - 1] = { ...last, content: last.content + delta };
                return copy;
              });
            } else if (json.error) {
              gotError = true;
              const errText: string = json.error;
              setMessages((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                copy[copy.length - 1] = { ...last, content: last.content || `Kechirasiz, xatolik yuz berdi: ${errText}` };
                return copy;
              });
            }
          } catch {
            // noto'g'ri shakllangan qatorni o'tkazib yuborish
          }
        }
      }

      if (gotError) {
        // xato allaqachon ko'rsatildi
      }
    } catch (err: any) {
      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        copy[copy.length - 1] = {
          ...last,
          content: last.content || "Kechirasiz, AI yordamchiga ulanib bo'lmadi. Internet aloqasini tekshirib, qayta urinib ko'ring.",
        };
        return copy;
      });
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] sm:w-96 max-h-[600px] animate-scale-in" data-testid="ai-chatbot-panel">
      <Card className="flex flex-col h-[600px] max-h-[calc(100vh-2rem)] shadow-2xl border-2 overflow-hidden">
        {/* Sarlavha */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary to-chart-2 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-sm">Karvonboshi AI</div>
              <div className="text-xs text-white/80">Marshrut yordamchisi</div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="text-white hover:bg-white/20 h-8 w-8" data-testid="ai-chatbot-close-btn">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Xabarlar */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3 bg-secondary/20">
          {messages.map((msg, idx) => (
            <div key={idx} className={cn('flex gap-2.5', msg.role === 'user' && 'flex-row-reverse')}>
              <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center shrink-0',
                msg.role === 'assistant' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
              )}>
                {msg.role === 'assistant' ? <Bot className="w-3.5 h-3.5" /> : <span className="text-xs font-bold">U</span>}
              </div>
              {msg.content ? (
                <div className={cn(
                  'rounded-2xl px-3.5 py-2.5 max-w-[85%] text-sm whitespace-pre-wrap',
                  msg.role === 'assistant'
                    ? 'bg-card border border-border rounded-tl-sm'
                    : 'bg-primary text-primary-foreground rounded-tr-sm'
                )} data-testid={msg.role === 'assistant' ? 'ai-chatbot-message' : 'ai-chatbot-user-message'}>
                  {msg.content}
                </div>
              ) : loading && idx === messages.length - 1 ? (
                <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              ) : null}
            </div>
          ))}

          {messages.length === 1 && !loading && (
            <div className="pt-2 space-y-2">
              <div className="text-xs text-muted-foreground font-medium px-1">Tez takliflar:</div>
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="w-full text-left text-sm px-3 py-2 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors flex items-center gap-2"
                  data-testid="ai-chatbot-suggestion-btn"
                >
                  <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Kiritish */}
        <div className="p-3 border-t border-border bg-card">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Marshrut, xarajat, dam olish maskanlari haqida so'rang..."
              className="h-9"
              data-testid="ai-chatbot-input"
            />
            <Button size="icon" onClick={() => handleSend()} disabled={loading || !input.trim()} className="h-9 w-9 shrink-0" data-testid="ai-chatbot-send-btn">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
