import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { Loader, Plus, BookOpen, Trash } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export interface CheatSheetTopic {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

interface CheatSheetTopicsManagerProps {
  onTopicSelect?: (topicId: string) => void;
  selectedTopicId?: string;
}

export default function CheatSheetTopicsManager({ onTopicSelect, selectedTopicId }: CheatSheetTopicsManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [topics, setTopics] = useState<CheatSheetTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTopic, setNewTopic] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchTopics();
  }, [user]);

  const fetchTopics = async () => {
    try {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('cheat_sheet_topics')
        .select('*')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTopics(data || []);
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

  const createTopic = async () => {
    try {
      if (!user || !newTopic.name.trim()) {
        toast({
          title: 'Ошибка',
          description: 'Укажите название темы',
          variant: 'destructive'
        });
        return;
      }

      setCreating(true);

      const { error } = await supabase
        .from('cheat_sheet_topics')
        .insert([{
          teacher_id: user.id,
          name: newTopic.name.trim(),
          description: newTopic.description.trim() || null
        }]);

      if (error) throw error;

      toast({
        title: 'Тема создана',
        description: 'Новая тема шпаргалок успешно создана'
      });

      setNewTopic({ name: '', description: '' });
      setDialogOpen(false);
      await fetchTopics();
    } catch (error) {
      console.error('Ошибка при создании темы:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать тему',
        variant: 'destructive'
      });
    } finally {
      setCreating(false);
    }
  };

  const deleteTopic = async (topicId: string) => {
    try {
      setDeleting(topicId);

      const { error } = await supabase
        .from('cheat_sheet_topics')
        .delete()
        .eq('id', topicId);

      if (error) throw error;

      toast({
        title: 'Тема удалена',
        description: 'Тема и все связанные шпаргалки удалены'
      });

      await fetchTopics();
    } catch (error) {
      console.error('Ошибка при удалении темы:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить тему',
        variant: 'destructive'
      });
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader className="h-6 w-6 animate-spin text-math-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Темы шпаргалок
        </h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Добавить тему
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новая тема шпаргалок</DialogTitle>
              <DialogDescription>
                Создайте новую тему для организации шпаргалок (например, "Алгебра", "Геометрия")
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Название темы</label>
                <Input
                  value={newTopic.name}
                  onChange={(e) => setNewTopic({ ...newTopic, name: e.target.value })}
                  placeholder="Например: Алгебра"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Описание (необязательно)</label>
                <Textarea
                  value={newTopic.description}
                  onChange={(e) => setNewTopic({ ...newTopic, description: e.target.value })}
                  placeholder="Краткое описание темы"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Отмена
                </Button>
                <Button onClick={createTopic} disabled={creating}>
                  {creating ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Создание...
                    </>
                  ) : (
                    'Создать'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {topics.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600">Создайте первую тему для шпаргалок</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {topics.map((topic) => (
            <Card 
              key={topic.id} 
              className={`cursor-pointer transition-colors ${
                selectedTopicId === topic.id ? 'ring-2 ring-math-primary' : 'hover:bg-gray-50'
              }`}
              onClick={() => onTopicSelect?.(topic.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{topic.name}</CardTitle>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => e.stopPropagation()}
                        disabled={deleting === topic.id}
                      >
                        {deleting === topic.id ? (
                          <Loader className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash className="h-4 w-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Удалить тему?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Вы уверены, что хотите удалить тему "{topic.name}"? Все шпаргалки этой темы также будут удалены.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteTopic(topic.id)}>
                          Удалить
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>
              {topic.description && (
                <CardContent className="pt-0">
                  <p className="text-xs text-gray-600">{topic.description}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}