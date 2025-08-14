import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { Loader, FileText, BookOpen, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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

export default function StudentCheatSheets() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [topics, setTopics] = useState<CheatSheetTopic[]>([]);
  const [cheatSheets, setCheatSheets] = useState<CheatSheet[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSheets, setLoadingSheets] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

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
      <div className="flex justify-center items-center h-64">
        <Loader className="h-8 w-8 animate-spin text-math-primary" />
      </div>
    );
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <BookOpen className="h-4 w-4 mr-2" />
          Мои шпаргалки
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Мои шпаргалки</DialogTitle>
          <DialogDescription>
            Выберите тему, чтобы просмотреть доступные шпаргалки
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {topics.length === 0 ? (
            <div className="text-center p-8 bg-gray-50 rounded-lg">
              <p className="text-gray-600">У вас пока нет доступных шпаргалок</p>
            </div>
          ) : (
            <>
              <div>
                <h3 className="text-lg font-semibold mb-4">Доступные темы</h3>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {topics.map((topic) => (
                    <Card 
                      key={topic.id}
                      className={`cursor-pointer transition-colors ${
                        selectedTopicId === topic.id ? 'ring-2 ring-math-primary bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedTopicId(topic.id)}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          {topic.name}
                        </CardTitle>
                      </CardHeader>
                      {topic.description && (
                        <CardContent className="pt-0">
                          <p className="text-xs text-gray-600">{topic.description}</p>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              </div>

              {selectedTopicId && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Шпаргалки по теме: {selectedTopic?.name}
                  </h3>
                  
                  {loadingSheets ? (
                    <div className="flex justify-center items-center h-32">
                      <Loader className="h-6 w-6 animate-spin text-math-primary" />
                    </div>
                  ) : cheatSheets.length === 0 ? (
                    <div className="text-center p-8 bg-gray-50 rounded-lg">
                      <p className="text-gray-600">По этой теме пока нет шпаргалок</p>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {cheatSheets.map((sheet) => (
                        <motion.div
                          key={sheet.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-sm">
                                {sheet.title || 'Шпаргалка'}
                              </CardTitle>
                              <CardDescription>
                                {new Date(sheet.created_at).toLocaleDateString('ru-RU')}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              {sheet.description && (
                                <p className="text-sm text-gray-600">{sheet.description}</p>
                              )}
                              <Button
                                variant="outline"
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
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}