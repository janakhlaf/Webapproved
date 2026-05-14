import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Sparkles, History, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatSession {
  id: number;
  title: string;
  updated_at: string;
}

interface BackendMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  text: 'Welcome to Human Mind & AI Logic! How can I assist you today?',
  sender: 'bot',
  timestamp: new Date(),
};

const USER_ID = 1;

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { detectAndApplyTheme, resetTheme } = useTheme();
  const { isAuthenticated } = useAuth();

  const previousAuthRef = useRef(isAuthenticated);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (previousAuthRef.current !== isAuthenticated) {
      setIsOpen(false);
      setIsHistoryOpen(false);
      setMessages([WELCOME_MESSAGE]);
      setSessions([]);
      setActiveSessionId(null);

      localStorage.removeItem('guest_chat_messages');
      localStorage.removeItem('chat_messages');
      localStorage.removeItem('chat_session_id');
    }

    previousAuthRef.current = isAuthenticated;
  }, [isAuthenticated]);

  const loadSessions = async () => {
    if (!isAuthenticated) return;

    try {
      const response = await fetch(
        `http://localhost:8000/chat/sessions/${USER_ID}`
      );

      const data = await response.json();

      setSessions(data.sessions || []);
    } catch (error) {
      console.error(error);
    }
  };

  const createNewChat = async () => {
    setActiveSessionId(null);
    setMessages([WELCOME_MESSAGE]);
    setInputValue('');
    setIsHistoryOpen(false);
  };

  const openSession = async (sessionId: number) => {
    try {
      const response = await fetch(
        `http://localhost:8000/chat/sessions/${sessionId}/messages`
      );

      const data = await response.json();

      const loadedMessages: Message[] = data.messages.map(
        (message: BackendMessage) => ({
          id: `${message.role}-${message.id}`,
          text: message.content,
          sender: message.role === 'user' ? 'user' : 'bot',
          timestamp: new Date(message.created_at),
        })
      );

      setActiveSessionId(sessionId);

      setMessages(
        loadedMessages.length > 0
          ? loadedMessages
          : [WELCOME_MESSAGE]
      );

      setIsHistoryOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const deleteSession = async (sessionId: number) => {
    try {
      await fetch(
        `http://localhost:8000/chat/sessions/${sessionId}?user_id=${USER_ID}`,
        {
          method: 'DELETE',
        }
      );

      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setMessages([WELCOME_MESSAGE]);
      }

      await loadSessions();

      setDeleteTargetId(null);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadSessions();
    }
  }, [isAuthenticated]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    let sessionId = activeSessionId;

    if (!sessionId && isAuthenticated) {
      try {
        const sessionResponse = await fetch(
          'http://localhost:8000/chat/sessions',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_id: USER_ID,
            }),
          }
        );

        const sessionData = await sessionResponse.json();

        sessionId = sessionData.session.id;

        setActiveSessionId(sessionId);

        await loadSessions();
      } catch (error) {
        console.error(error);
        return;
      }
    }

    const currentMessage = inputValue;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: currentMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    detectAndApplyTheme(currentMessage);

    setInputValue('');

    const textarea = document.querySelector('textarea');

    if (textarea) {
      textarea.style.height = '40px';
    }

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentMessage,
          isAuthenticated: isAuthenticated,
          user_id: USER_ID,
          session_id: sessionId,
        }),
      });

      const data = await response.json();

      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        text: data.reply,
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);

      await loadSessions();
    } catch (error) {
      const errorMessage: Message = {
        id: `bot-error-${Date.now()}`,
        text: 'Sorry, I could not connect to the chatbot server.',
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsHistoryOpen(false);
    resetTheme();
  };

  const isArabicText = (text: string) =>
    /[\u0600-\u06FF]/.test(text);

  return (
    <>
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 30,
        }}
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="lg"
          className="h-14 w-14 rounded-full bg-primary/90 backdrop-blur-sm hover:bg-primary shadow-lg shadow-primary/50 hover:shadow-xl hover:shadow-primary/60 transition-all duration-300 hover:scale-110"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-24 right-6 z-50 w-[380px] h-[520px] flex flex-col"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 35,
            }}
          >
            <div className="relative bg-card/95 backdrop-blur-xl rounded-2xl border border-border/50 shadow-2xl shadow-primary/20 flex flex-col h-full overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-border/50 bg-gradient-to-r from-primary/10 to-accent/10">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">
                    AI Assistant
                  </h3>
                </div>

                <div className="flex items-center gap-1">
                  {isAuthenticated && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setIsHistoryOpen((prev) => !prev)
                        }
                        className="h-8 w-8 p-0 hover:bg-primary/20"
                      >
                        <History className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={createNewChat}
                        className="h-8 w-8 p-0 hover:bg-primary/20"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClose}
                    className="h-8 w-8 p-0 hover:bg-destructive/20"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {isAuthenticated && isHistoryOpen && (
                <div className="border-b border-border/50 bg-background/70 backdrop-blur-xl p-3 max-h-40 overflow-y-auto space-y-2">
                  {sessions.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No chat history yet.
                    </p>
                  ) : (
                    sessions.map((session) => (
                      <div
                        key={session.id}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                          activeSessionId === session.id
                            ? 'bg-primary/20 text-foreground border border-primary/30'
                            : 'bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                        }`}
                      >
                        <button
                          onClick={() => openSession(session.id)}
                          className="flex-1 text-left truncate"
                        >
                          {session.title}
                        </button>

                        <button
                          onClick={() => setDeleteTargetId(session.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{
                      opacity: 0,
                      y: 10,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 30,
                    }}
                    className={`flex ${
                      message.sender === 'user'
                        ? 'justify-end'
                        : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                        message.sender === 'user'
                          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                          : 'bg-muted/80 text-foreground border border-border/30'
                      }`}
                    >
                      <p
                        className="text-sm leading-relaxed break-words whitespace-pre-wrap"
                        style={{
                          direction: isArabicText(message.text)
                            ? 'rtl'
                            : 'ltr',
                          textAlign: isArabicText(message.text)
                            ? 'right'
                            : 'left',
                          lineHeight: '1.7',
                        }}
                      >
                        {message.text}
                      </p>
                    </div>
                  </motion.div>
                ))}

                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t border-border/50 bg-card/50">
                <div className="flex gap-2">
                  <textarea
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value);

                      e.target.style.height = 'auto';

                      e.target.style.height =
                        Math.min(
                          e.target.scrollHeight,
                          96
                        ) + 'px';
                    }}
                    onKeyDown={(e) => {
                      if (
                        e.key === 'Enter' &&
                        !e.shiftKey
                      ) {
                        e.preventDefault();

                        handleSendMessage();
                      }
                    }}
                    placeholder="Type your message..."
                    rows={1}
                    className="
                      flex-1
                      bg-background/50
                      border
                      border-border/50
                      focus:border-primary/50
                      transition-colors
                      rounded-md
                      px-3
                      py-2
                      text-sm
                      text-white
                      resize-none
                      overflow-y-auto
                      min-h-10
                      max-h-24
                      leading-5
                    "
                  />

                  <Button
                    onClick={handleSendMessage}
                    size="icon"
                    className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-200"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {deleteTargetId && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                  <div className="bg-card border border-border rounded-2xl p-5 w-[300px] shadow-2xl">
                    <h3 className="text-white font-semibold mb-2">
                      Delete Chat
                    </h3>

                    <p className="text-sm text-muted-foreground mb-5">
                      Are you sure you want to delete this chat?
                    </p>

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => setDeleteTargetId(null)}
                      >
                        Cancel
                      </Button>

                      <Button
                        variant="destructive"
                        onClick={() => deleteSession(deleteTargetId)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}