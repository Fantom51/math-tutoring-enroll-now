import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { Loader, Send, ArrowLeft, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

interface Message {
  id: string;
  teacher_id: string;
  student_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface ChatUser {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  role: string;
}

export default function Chat() {
  const { userId } = useParams<{ userId: string }>();
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [chatUser, setChatUser] = useState<ChatUser | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<number | null>(null);
  const lastRealtimeTsRef = useRef<number>(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const markMessagesAsRead = async () => {
    if (!user || !userId || !userProfile) return;
    
    try {
      // Mark all unread messages from this conversation as read
      if (userProfile.role === 'teacher') {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('student_id', userId)
          .eq('teacher_id', user.id)
          .eq('is_read', false)
          .neq('sender_id', user.id); // Don't mark teacher's own messages
      } else {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('student_id', user.id)
          .eq('teacher_id', userId)
          .eq('is_read', false)
          .neq('sender_id', user.id); // Don't mark student's own messages
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    const init = async () => {
      if (user && userId) {
        await fetchChatUser();
        await fetchMessages();
        await markMessagesAsRead(); // Mark messages as read when opening chat
        cleanup = subscribeToMessages();
      }
    };
    void init();
    return () => {
      cleanup?.();
    };
  }, [user, userId, userProfile?.role]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Polling fallback in case realtime is not delivering events
  useEffect(() => {
    if (!user || !userId) return;
    if (pollIntervalRef.current) {
      window.clearInterval(pollIntervalRef.current);
    }
    pollIntervalRef.current = window.setInterval(() => {
      if (Date.now() - lastRealtimeTsRef.current > 7000) {
        fetchMessages();
      }
    }, 7000);
    return () => {
      if (pollIntervalRef.current) {
        window.clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [user, userId, userProfile?.role]);

  const fetchChatUser = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, role')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setChatUser(data);
    } catch (error) {
      console.error('Error fetching chat user:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить информацию о пользователе',
        variant: 'destructive'
      });
    }
  };

  const fetchMessages = async () => {
    if (!user || !userId) return;

    try {
      const isTeacher = userProfile?.role === 'teacher';
      const teacherId = isTeacher ? user.id : userId;
      const studentId = isTeacher ? userId : user.id;

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('teacher_id', teacherId)
        .eq('student_id', studentId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить сообщения',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    if (!user || !userId || !userProfile) {
      console.log('Missing required data for subscription:', { user: !!user, userId, userProfile: !!userProfile });
      return;
    }

    const isTeacher = userProfile.role === 'teacher';
    const teacherId = isTeacher ? user.id : userId;
    const studentId = isTeacher ? userId : user.id;

    console.log('Setting up realtime subscription:', { teacherId, studentId, isTeacher });

    const channel = supabase
      .channel(`messages:${teacherId}:${studentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `teacher_id=eq.${teacherId}`,
        },
        (payload) => {
          console.log('Received realtime message:', payload.new);
          const newMsg = payload.new as Message;
          
          // Дополнительная проверка на клиенте для student_id
          if (newMsg.student_id !== studentId) {
            console.log('Message not for this chat, ignoring');
            return;
          }
          
          lastRealtimeTsRef.current = Date.now();
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) {
              console.log('Message already exists, skipping');
              return prev;
            }
            console.log('Adding new message to state');
            return [...prev, newMsg];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `student_id=eq.${studentId}`,
        },
        (payload) => {
          console.log('Received realtime message via student filter:', payload.new);
          const newMsg = payload.new as Message;
          
          // Дополнительная проверка на клиенте для teacher_id
          if (newMsg.teacher_id !== teacherId) {
            console.log('Message not for this chat, ignoring');
            return;
          }
          
          lastRealtimeTsRef.current = Date.now();
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) {
              console.log('Message already exists, skipping');
              return prev;
            }
            console.log('Adding new message to state via student filter');
            return [...prev, newMsg];
          });
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      console.log('Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !userId || sending) return;

    setSending(true);
    try {
      const isTeacher = userProfile?.role === 'teacher';
      const teacherId = isTeacher ? user.id : userId;
      const studentId = isTeacher ? userId : user.id;

      const { data, error } = await supabase
        .from('messages')
        .insert({
          teacher_id: teacherId,
          student_id: studentId,
          sender_id: user.id,
          content: newMessage.trim()
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data as Message]));
      }
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить сообщение',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long'
    });
  };

  const getUserDisplayName = () => {
    if (!chatUser) return 'Пользователь';
    return chatUser.first_name || chatUser.last_name 
      ? `${chatUser.first_name || ''} ${chatUser.last_name || ''}`.trim()
      : chatUser.email;
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [date: string]: Message[] } = {};
    
    messages.forEach(message => {
      const date = new Date(message.created_at).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <motion.div
      className="min-h-screen bg-background flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Navbar />
      <main className="flex-1 container mx-auto pt-20 pb-4 px-4 max-w-4xl">
        <div className="mb-6">
          <Link to={userProfile?.role === 'teacher' ? '/teacher/students' : '/dashboard'}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {userProfile?.role === 'teacher' ? 'К списку учеников' : 'В кабинет'}
            </Button>
          </Link>
        </div>

        <Card className="h-[calc(100vh-200px)] flex flex-col">
          <CardHeader className="flex-shrink-0 border-b">
            <CardTitle className="flex items-center gap-3">
              <MessageCircle className="w-6 h-6" />
              <div>
                <div>Чат с {getUserDisplayName()}</div>
                {chatUser && (
                  <div className="text-sm font-normal text-muted-foreground">
                    {chatUser.role === 'teacher' ? 'Преподаватель' : 'Ученик'}
                  </div>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <Loader className="h-6 w-6 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <MessageCircle className="w-8 h-8 mb-2 opacity-50" />
                  <p>Нет сообщений</p>
                  <p className="text-sm">Напишите первое сообщение!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(messageGroups).map(([date, dayMessages]) => (
                    <div key={date}>
                      <div className="flex justify-center mb-4">
                        <span className="bg-muted px-3 py-1 rounded-full text-sm text-muted-foreground">
                          {formatDate(dayMessages[0].created_at)}
                        </span>
                      </div>
                      <div className="space-y-3">
                        {dayMessages.map((message) => (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[70%] ${
                              message.sender_id === user?.id 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted'
                            } rounded-2xl px-4 py-2`}>
                              <p className="whitespace-pre-wrap break-words">{message.content}</p>
                              <p className={`text-xs mt-1 ${
                                message.sender_id === user?.id 
                                  ? 'text-primary-foreground/70' 
                                  : 'text-muted-foreground'
                              }`}>
                                {formatTime(message.created_at)}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>
            
            <div className="p-4 border-t bg-background">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Введите сообщение..."
                  disabled={sending}
                  className="flex-1"
                />
                <Button 
                  onClick={sendMessage} 
                  disabled={!newMessage.trim() || sending}
                  size="icon"
                >
                  {sending ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </motion.div>
  );
}