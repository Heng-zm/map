
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send } from 'lucide-react';
import { ChatMessage } from '@/ai/schemas';
import { chat } from '@/ai/flows/chat-flow';
import { cn } from '@/lib/utils';

export function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
        const modelResponse = await chat({ history: newMessages });
        const modelMessage: ChatMessage = { role: 'model', content: modelResponse };
        setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
        console.error("Chat error:", error);
        const errorMessage: ChatMessage = { role: 'model', content: "Sorry, I'm having trouble connecting. Please try again later." };
        setMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior: 'smooth'
        });
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full p-4">
      <h2 className="text-2xl font-bold mb-4 text-foreground">AI Assistant</h2>
      <ScrollArea className="flex-grow mb-4 pr-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={cn(
                "p-3 rounded-lg max-w-[80%]",
                msg.role === 'user' ? 'bg-primary text-primary-foreground self-end ml-auto' : 'bg-secondary text-secondary-foreground self-start'
              )}
            >
              <p className="text-sm">{msg.content}</p>
            </div>
          ))}
           {isLoading && (
             <div className="p-3 rounded-lg max-w-[80%] bg-secondary text-secondary-foreground self-start">
                <p className="text-sm animate-pulse">Thinking...</p>
             </div>
           )}
        </div>
      </ScrollArea>
      <div className="flex items-center gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask me anything..."
          disabled={isLoading}
        />
        <Button onClick={handleSend} disabled={isLoading}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
