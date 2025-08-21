import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { Loader, MessageCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

interface ChatPreview {
  id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_email: string;
  other_user_role: string;
  last_message: string;
  last_message_time: string;
  unread_count?: number;
}

export default function ChatList() {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && userProfile) {
      fetchChats();
    }
  }, [user, userProfile]);

  const fetchChats = async () => {
    if (!user || !userProfile) return;

    try {
      const isTeacher = userProfile.role === 'teacher';
      
      // Get all unique conversations for this user
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          teacher_id,
          student_id,
          content,
          created_at,
          sender_id
        `)
        .or(isTeacher ? `teacher_id.eq.${user.id}` : `student_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group messages by conversation and get the latest message for each
      const conversationMap = new Map<string, any>();
      
      messages?.forEach(message => {
        const otherUserId = isTeacher ? message.student_id : message.teacher_id;
        const conversationKey = isTeacher 
          ? `${message.teacher_id}-${message.student_id}`
          : `${message.teacher_id}-${message.student_id}`;

        if (!conversationMap.has(conversationKey) || 
            new Date(message.created_at) > new Date(conversationMap.get(conversationKey).created_at)) {
          conversationMap.set(conversationKey, {
            ...message,
            other_user_id: otherUserId
          });
        }
      });

      // Get user details for each conversation
      const conversationIds = Array.from(conversationMap.values());
      const otherUserIds = conversationIds.map(conv => conv.other_user_id);
      
      if (otherUserIds.length > 0) {
        const { data: users, error: usersError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, role')
          .in('id', otherUserIds);

        if (usersError) throw usersError;

        // Create chat previews
        const chatPreviews: ChatPreview[] = conversationIds.map(conv => {
          const otherUser = users?.find(u => u.id === conv.other_user_id);
          const displayName = otherUser?.first_name || otherUser?.last_name
            ? `${otherUser.first_name || ''} ${otherUser.last_name || ''}`.trim()
            : otherUser?.email || 'Неизвестный пользователь';

          return {
            id: conv.other_user_id,
            other_user_id: conv.other_user_id,
            other_user_name: displayName,
            other_user_email: otherUser?.email || '',
            other_user_role: otherUser?.role || '',
            last_message: conv.content,
            last_message_time: conv.created_at
          };
        });

        setChats(chatPreviews);
      } else {
        setChats([]);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить список чатов',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short'
      });
    }
  };

  const truncateMessage = (message: string, maxLength: number = 60) => {
    return message.length > maxLength 
      ? message.substring(0, maxLength) + '...' 
      : message;
  };

  return (
    <motion.div
      className="min-h-screen bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Navbar />
      <main className="container mx-auto pt-20 pb-16 px-4">
        <div className="mb-6">
          <Link to="/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Назад в кабинет
            </Button>
          </Link>
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-6 h-6" />
                <span>Мои чаты</span>
              </CardTitle>
              <CardDescription>
                {userProfile?.role === 'teacher' 
                  ? 'Общение с учениками' 
                  : 'Общение с преподавателями'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader className="h-8 w-8 animate-spin" />
                </div>
              ) : chats.length === 0 ? (
                <div className="text-center p-8 bg-muted/50 rounded-lg">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-2">У вас пока нет чатов</p>
                  <p className="text-sm text-muted-foreground">
                    {userProfile?.role === 'teacher' 
                      ? 'Начните общение с учениками в разделе "Ученики"'
                      : 'Обратитесь к преподавателю для начала общения'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {chats.map((chat, index) => (
                    <motion.div
                      key={chat.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                    >
                      <Link
                        to={`/chat/${chat.other_user_id}`}
                        className="block p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium">{chat.other_user_name}</h3>
                              <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                                {chat.other_user_role === 'teacher' ? 'Преподаватель' : 'Ученик'}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">
                              {truncateMessage(chat.last_message)}
                            </p>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatTime(chat.last_message_time)}
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>
      <Footer />
    </motion.div>
  );
}