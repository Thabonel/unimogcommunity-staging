import React, { useState, useRef, useEffect } from 'react';
import { Send, RotateCw, Trash2, AlertCircle, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSecureChatGPT } from '@/hooks/use-secure-chatgpt';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

interface SecureBarryChatProps {
  height?: string;
  className?: string;
}

export function SecureBarryChat({ height = "600px", className }: SecureBarryChatProps) {
  const [input, setInput] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { 
    messages, 
    isLoading, 
    error, 
    isAuthenticated,
    sendMessage, 
    clearChat,
    retry
  } = useSecureChatGPT();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading || !isAuthenticated) return;
    
    const message = input;
    setInput('');
    
    try {
      await sendMessage(message);
    } catch (err) {
      // Error is handled by the hook
    }
    
    // Refocus textarea
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className={cn("flex flex-col items-center justify-center", className)} style={{ height }}>
        <Alert className="max-w-md">
          <LogIn className="h-4 w-4" />
          <AlertDescription className="space-y-3">
            <p>You need to be logged in to chat with Barry.</p>
            <div className="flex gap-2">
              <Button asChild size="sm">
                <Link to="/login">Log In</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/signup">Sign Up</Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col bg-background", className)} style={{ height }}>
      {/* Chat Header Actions */}
      <div className="flex items-center justify-end gap-2 p-2 border-b">
        {error && (
          <Button
            variant="ghost"
            size="sm"
            onClick={retry}
            disabled={isLoading}
            title="Retry last message"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={clearChat}
          disabled={isLoading}
          title="Clear conversation"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages Area */}
      <ScrollArea 
        ref={scrollAreaRef} 
        className="flex-1 p-4"
        onWheel={(e) => {
          // Ensure mouse wheel scrolling works properly
          e.stopPropagation();
        }}
      >
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "flex",
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-lg px-4 py-2",
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                <div className="whitespace-pre-wrap break-words">
                  {message.content}
                </div>
                {message.timestamp && (
                  <div className={cn(
                    "text-xs mt-1 opacity-70",
                    message.role === 'user' ? 'text-right' : 'text-left'
                  )}>
                    {format(message.timestamp, 'HH:mm')}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-4 py-2">
                <div className="flex items-center gap-2">
                  <div className="animate-pulse">Barry is thinking...</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="mx-4 mb-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="border-t p-4">
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Barry about your Unimog..."
            className="min-h-[60px] resize-none"
            disabled={isLoading}
            rows={2}
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="self-end"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line
        </div>
      </form>
    </div>
  );
}