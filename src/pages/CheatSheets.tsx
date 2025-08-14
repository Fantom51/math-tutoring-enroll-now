import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { Loader, FileText, BookOpen, Download, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';

interface CheatSheetTopic {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

interface CheatSheet {
  id: string;
  title: string | null;
  description: string | null;
  file_path: string;
  topic_id: string | null;
  created_at: string;
}

export default function CheatSheetsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [topics, setTopics] = useState<CheatSheetTopic[]>([]);
  const [cheatSheets, setCheatSheets] = useState<CheatSheet[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSheets, setLoadingSheets] = useState(false);

  useEffect(() => {
    fetchTopics();
  }, [user]);

  useEffect(() => {
    if (selectedTopicId) {
      fetchCheatSheets();
    }
  }, [selectedTopicId, user]);

  const fetchTopics = async () => {
    try {
      if (!user) return;
      
      // Получаем темы только тех учителей, которые прикрепили шпаргалки к данному ученику
      const { data, error } = await supabase
        .from('cheat_sheet_topics')
        .select(`
          *,
          student_cheatsheets!inner(student_id)
        `)
        .eq('student_cheatsheets.student_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Убираем дубликаты тем
      const uniqueTopics = data?.reduce((acc: CheatSheetTopic[], current) => {
        if (!acc.find(topic => topic.id === current.id)) {
          acc.push({
            id: current.id,
            name: current.name,
            description: current.description,
            created_at: current.created_at
          });
        }
        return acc;
      }, []) || [];
      
      setTopics(uniqueTopics);
    } catch (error) {
      console.error('Ошибка при загрузке тем:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить темы шпаргалок',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCheatSheets = async () => {
    try {
      if (!user || !selectedTopicId) return;
      
      setLoadingSheets(true);
      
      const { data, error } = await supabase
        .from('student_cheatsheets')
        .select('*')
        .eq('student_id', user.id)
        .eq('topic_id', selectedTopicId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCheatSheets(data || []);
    } catch (error) {
      console.error('Ошибка при загрузке шпаргалок:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить шпаргалки',
        variant: 'destructive'
      });
    } finally {
      setLoadingSheets(false);
    }
  };

  const downloadCheatSheet = async (filePath: string, title: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('learning_resources')
        .download(filePath);
      
      if (error) throw error;
      
      const ext = (filePath.split('.').pop() || 'file');
      const blob = new Blob([data]);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title || 'cheatsheet'}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Ошибка при скачивании шпаргалки:', error);
      toast({
        title: 'Ошибка скачивания',
        description: 'Не удалось скачать файл',
        variant: 'destructive'
      });
    }
  };

  const selectedTopic = topics.find(t => t.id === selectedTopicId);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-20 flex justify-center items-center h-96">
          <Loader className="h-8 w-8 animate-spin text-math-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-20 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Link to="/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Назад в кабинет
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Мои шпаргалки</h1>
              <p className="text-gray-600">Учебные материалы от ваших преподавателей</p>
            </div>
          </div>
          
          <div className="space-y-8">
            {topics.length === 0 ? (
              <Card>
                <CardContent className="text-center p-12">
                  <BookOpen className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Нет доступных шпаргалок</h3>
                  <p className="text-gray-600">Пока что ваши преподаватели не прикрепили к вам шпаргалки</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Доступные темы
                    </CardTitle>
                    <CardDescription>
                      Выберите тему, чтобы просмотреть доступные шпаргалки
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {topics.map((topic) => (
                        <motion.div
                          key={topic.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Card 
                            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                              selectedTopicId === topic.id ? 'ring-2 ring-math-primary bg-blue-50' : 'hover:bg-gray-50'
                            }`}
                            onClick={() => setSelectedTopicId(topic.id)}
                          >
                            <CardHeader className="pb-3">
                              <CardTitle className="text-lg flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-math-primary" />
                                {topic.name}
                              </CardTitle>
                            </CardHeader>
                            {topic.description && (
                              <CardContent className="pt-0">
                                <p className="text-sm text-gray-600">{topic.description}</p>
                              </CardContent>
                            )}
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {selectedTopicId && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Шпаргалки по теме: {selectedTopic?.name}
                      </CardTitle>
                      <CardDescription>
                        Материалы для изучения и повторения
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loadingSheets ? (
                        <div className="flex justify-center items-center h-32">
                          <Loader className="h-6 w-6 animate-spin text-math-primary" />
                        </div>
                      ) : cheatSheets.length === 0 ? (
                        <div className="text-center p-8 bg-gray-50 rounded-lg">
                          <FileText className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                          <p className="text-gray-600">По этой теме пока нет шпаргалок</p>
                        </div>
                      ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {cheatSheets.map((sheet) => (
                            <motion.div
                              key={sheet.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <Card className="hover:shadow-md transition-shadow">
                                <CardHeader>
                                  <CardTitle className="text-base">
                                    {sheet.title || 'Шпаргалка'}
                                  </CardTitle>
                                  <CardDescription>
                                    Добавлено: {new Date(sheet.created_at).toLocaleDateString('ru-RU')}
                                  </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                  {sheet.description && (
                                    <p className="text-sm text-gray-600">{sheet.description}</p>
                                  )}
                                  <Button
                                    variant="default"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => downloadCheatSheet(sheet.file_path, sheet.title || 'cheatsheet')}
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    Скачать
                                  </Button>
                                </CardContent>
                              </Card>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}