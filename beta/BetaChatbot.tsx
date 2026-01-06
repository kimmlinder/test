import { useState, useRef, useEffect } from 'react';
import { X, Sparkles, Send, Paperclip, Loader2, Mic, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface BetaChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserSettings {
  display_name?: string;
  personal_role?: string;
  personal_company?: string;
  personal_tone?: string;
  personal_greeting_style?: string;
  personal_emoji_usage?: string;
  personal_text_length?: string;
  ai_conversation_tone?: string;
  ai_language?: string;
  ai_response_length?: string;
  business_brand_name?: string;
  business_industry?: string;
  business_target_audience?: string;
  business_bio?: string;
  business_mission?: string;
  business_usp?: string;
}

const quickActions = [
  { icon: '🚀', label: 'Quick start with sample data' },
  { icon: '✍️', label: 'Write my first brief' },
  { icon: '🎬', label: 'Generate a scene plan' },
  { icon: '💡', label: 'Get to know me' },
  { icon: '📊', label: 'Analyze my projects' },
];

const CHAT_STORAGE_KEY = 'ai-assistant-chat';
const CHAT_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

interface StoredChat {
  messages: Message[];
  lastActivity: number;
}

export function BetaChatbot({ isOpen, onClose }: BetaChatbotProps) {
  const [messages, setMessages] = useState<Message[]>(() => {
    // Load messages from localStorage on mount
    try {
      const stored = localStorage.getItem(CHAT_STORAGE_KEY);
      if (stored) {
        const parsed: StoredChat = JSON.parse(stored);
        const now = Date.now();
        // Check if chat is still within timeout window
        if (now - parsed.lastActivity < CHAT_TIMEOUT_MS) {
          return parsed.messages.map(m => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }));
        } else {
          // Expired, clear storage
          localStorage.removeItem(CHAT_STORAGE_KEY);
        }
      }
    } catch {
      localStorage.removeItem(CHAT_STORAGE_KEY);
    }
    return [];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [userName, setUserName] = useState<string>('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useIsMobile();

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      const stored: StoredChat = {
        messages,
        lastActivity: Date.now()
      };
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(stored));
    }
  }, [messages]);

  // Check for timeout periodically and on open
  useEffect(() => {
    const checkTimeout = () => {
      try {
        const stored = localStorage.getItem(CHAT_STORAGE_KEY);
        if (stored) {
          const parsed: StoredChat = JSON.parse(stored);
          if (Date.now() - parsed.lastActivity >= CHAT_TIMEOUT_MS) {
            localStorage.removeItem(CHAT_STORAGE_KEY);
            setMessages([]);
          }
        }
      } catch {
        localStorage.removeItem(CHAT_STORAGE_KEY);
        setMessages([]);
      }
    };

    // Check on open
    if (isOpen) {
      checkTimeout();
    }

    // Check every minute
    const interval = setInterval(checkTimeout, 60000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Fetch user settings when chatbot opens
  useEffect(() => {
    const fetchUserSettings = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: settings } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (settings) {
          setUserSettings(settings);
          setUserName(settings.display_name || '');
        }
        
        // Also get profile name as fallback
        if (!settings?.display_name) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single();
          
          if (profile?.full_name) {
            setUserName(profile.full_name);
          }
        }
      }
    };

    if (isOpen) {
      fetchUserSettings();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (content: string = input) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-media-assistant`;
      
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: content.trim() }
          ],
          userSettings: userSettings || undefined,
        }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${resp.status}`);
      }

      if (!resp.body) {
        throw new Error('No response body');
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      }]);

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let assistantContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const updated = [...prev];
                if (updated.length > 0 && updated[updated.length - 1].role === 'assistant') {
                  updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    content: assistantContent,
                  };
                }
                return updated;
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      if (!assistantContent) {
        setMessages(prev => {
          const updated = [...prev];
          if (updated.length > 0 && updated[updated.length - 1].role === 'assistant') {
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              content: 'I apologize, but I could not generate a response.',
            };
          }
          return updated;
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: error instanceof Error ? `Error: ${error.message}` : 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    handleSend(action);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Personalized greeting based on user name
  const greeting = userName ? `Hello, ${userName.split(' ')[0]}!` : 'Hello! I\'m your AI Assistant';

  // Don't render anything if not open
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Panel - Full screen on mobile with bottom sheet style, side panel on desktop */}
      <div
        className={cn(
          'fixed bg-card/95 backdrop-blur-xl border-border z-50 shadow-2xl flex flex-col',
          // Mobile: bottom sheet style
          isMobile && 'left-0 right-0 bottom-0 h-[85vh] rounded-t-3xl border-t w-full max-w-full overflow-x-hidden animate-slide-up',
          // Desktop: side panel
          !isMobile && 'right-0 top-0 h-full w-full sm:w-[400px] md:w-[480px] lg:w-[520px] border-l overflow-hidden animate-slide-in-right'
        )}
      >
        {/* Mobile drag handle */}
        {isMobile && (
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-12 h-1.5 rounded-full bg-muted-foreground/40" />
          </div>
        )}

        {/* Header */}
        <div className={cn(
          "flex items-center justify-between border-b border-border/50 bg-card/80 shrink-0",
          isMobile ? "px-4 py-2.5" : "px-4 py-3"
        )}>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className={cn(
              "rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/20",
              isMobile ? "h-7 w-7" : "h-8 w-8"
            )}>
              <Sparkles className={cn(isMobile ? "h-3.5 w-3.5" : "h-4 w-4", "text-white")} />
            </div>
            <span className={cn("font-semibold text-foreground", isMobile ? "text-sm" : "text-base")}>
              AI Assistant
            </span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <span className={cn(
              "text-muted-foreground rounded-full bg-muted/50",
              isMobile ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-1"
            )}>Beta</span>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose} 
              className={cn(
                "rounded-full hover:bg-muted",
                isMobile ? "h-7 w-7" : "h-8 w-8"
              )}
            >
              {isMobile ? <ChevronDown className="h-4 w-4" /> : <X className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 min-h-0 w-full overflow-x-hidden" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className={cn(
              "flex flex-col items-center justify-center text-center w-full max-w-full overflow-hidden",
              isMobile ? "min-h-[40vh] px-4 py-6" : "min-h-[60vh] px-8 py-12"
            )}>
              {/* Large AI Icon */}
              <div className={cn(
                "rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-2xl shadow-pink-500/30 shrink-0",
                isMobile ? "h-14 w-14 mb-4" : "h-20 w-20 mb-6"
              )}>
                <Sparkles className={cn(isMobile ? "h-7 w-7" : "h-10 w-10", "text-white")} />
              </div>
              
              {/* Personalized Welcome Text */}
              <h2 className={cn("font-bold text-foreground w-full px-2", isMobile ? "text-lg mb-2" : "text-2xl mb-2")}>
                {greeting}
              </h2>
              <p className={cn(
                "text-muted-foreground leading-relaxed w-full px-4",
                isMobile ? "text-sm mb-4" : "text-sm mb-8 max-w-sm"
              )}>
                {userName 
                  ? `I'm here to help with your creative projects${userSettings?.business_industry ? ` in ${userSettings.business_industry}` : ''}.`
                  : 'Your personal AI helper for all creative tasks.'
                }
              </p>
              
              {/* Quick Actions - Horizontal scroll on mobile with proper containment */}
              <div className={cn(
                "w-full max-w-full",
                isMobile ? "overflow-x-auto overflow-y-hidden pb-2 -mx-4 px-4" : ""
              )}>
                <div className={cn(
                  isMobile 
                    ? "flex gap-2 w-max" 
                    : "flex flex-wrap justify-center gap-2 max-w-md mx-auto"
                )}>
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickAction(action.label)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full border border-border/50 bg-muted/30 hover:bg-muted/60 text-foreground transition-all duration-200 hover:border-primary/30 whitespace-nowrap shrink-0",
                        isMobile ? "px-3 py-2 text-xs" : "px-4 py-2.5 text-sm hover:shadow-sm"
                      )}
                    >
                      <span className={isMobile ? "text-sm" : "text-base"}>{action.icon}</span>
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className={cn("space-y-3 max-w-full overflow-hidden", isMobile ? "p-3" : "p-4 space-y-4")}>
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex w-full',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'rounded-2xl break-words overflow-hidden',
                      isMobile ? 'max-w-[85%] px-3 py-2' : 'max-w-[85%] px-4 py-3',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/60 text-foreground'
                    )}
                  >
                    <p className={cn("whitespace-pre-wrap leading-relaxed break-words", isMobile ? "text-[13px]" : "text-sm")}>
                      {message.content}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.content === '' && (
                <div className="flex justify-start">
                  <div className={cn("bg-muted/60 rounded-2xl", isMobile ? "px-3 py-2" : "px-4 py-3")}>
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div className={cn(
          "border-t border-border/50 bg-card/80 shrink-0",
          isMobile ? "p-3 pb-safe" : "p-4"
        )}>
          <div className="relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              rows={1}
              className={cn(
                "w-full resize-none bg-muted/40 border border-border/50 rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all",
                isMobile ? "pl-3 pr-[72px] py-2.5 text-[15px]" : "pl-4 pr-24 py-3.5 text-sm"
              )}
              disabled={isLoading}
              style={{ minHeight: isMobile ? '44px' : '48px', maxHeight: '120px' }}
            />
            <div className={cn(
              "absolute top-1/2 -translate-y-1/2 flex items-center",
              isMobile ? "right-1 gap-0.5" : "right-2 gap-1"
            )}>
              {!isMobile && (
                <>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Button
                size="icon"
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className={cn(
                  "rounded-full bg-gradient-to-br from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 shadow-lg shadow-pink-500/20 disabled:opacity-50 disabled:shadow-none",
                  isMobile ? "h-8 w-8" : "h-8 w-8"
                )}
              >
                <Send className={cn(isMobile ? "h-3.5 w-3.5" : "h-3.5 w-3.5")} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
