
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { Loader, Upload, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

interface Homework {
  id: string;
  title: string;
  description: string;
  file_url: string;
  created_at: string;
  submitted: boolean;
  solution_url: string | null;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    fetchHomeworks();
  }, [user]);

  const fetchHomeworks = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from('student_homeworks')
        .select('*, homework:homeworks(*)')
        .eq('student_id', user.id);

      if (error) {
        throw error;
      }

      // Преобразуем данные и отфильтровываем записи без существующего задания
      const safeData = (data || []).filter((item: any) => item.homework);
      const formattedHomeworks = safeData.map((item: any) => ({
        id: item.homework.id,
        title: item.homework.title,
        description: item.homework.description,
        file_url: item.homework.file_url,
        created_at: item.homework.created_at,
        submitted: !!item.solution_url,
        solution_url: item.solution_url
      }));

      setHomeworks(formattedHomeworks);
    } catch (error) {
      console.error('Ошибка при загрузке домашних заданий:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить домашние задания',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (homeworkId: string, file: File) => {
    try {
      setUploading(homeworkId);

      // 1. Загружаем файл в Storage
      const fileExt = file.name.split('.').pop();
      const filePath = `solutions/${user?.id}/${homeworkId}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('homework_solutions')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const fileUrl = data?.path ?? '';

      // 2. Обновляем запись в базе данных
      const { error: updateError } = await supabase
        .from('student_homeworks')
        .update({ solution_url: fileUrl })
        .eq('student_id', user?.id)
        .eq('homework_id', homeworkId);

      if (updateError) throw updateError;

      // Обновляем список домашних заданий
      await fetchHomeworks();

      toast({
        title: 'Решение загружено',
        description: 'Ваше решение успешно загружено'
      });

    } catch (error) {
      console.error('Ошибка при загрузке решения:', error);
      toast({
        title: 'Ошибка загрузки',
        description: 'Не удалось загрузить решение',
        variant: 'destructive'
      });
    } finally {
      setUploading(null);
    }
  };

  const downloadHomework = async (fileUrl: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('homework_files')
        .download(fileUrl);

      if (error) throw error;

      const blob = new Blob([data]);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Ошибка при скачивании файла:', error);
      toast({
        title: 'Ошибка скачивания',
        description: 'Не удалось скачать файл',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="h-8 w-8 animate-spin text-math-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Мои домашние задания</h2>
        <p className="text-gray-600">Список заданий для выполнения</p>
      </div>

      {homeworks.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600">У вас пока нет домашних заданий</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {homeworks.map((homework) => (
            <motion.div
              key={homework.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>{homework.title}</CardTitle>
                  <CardDescription>
                    Дата публикации: {new Date(homework.created_at).toLocaleDateString('ru-RU')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>{homework.description}</p>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-2"
                      onClick={() => downloadHomework(homework.file_url, `${homework.title}.pdf`)}
                    >
                      <FileText className="h-4 w-4" />
                      <span>Скачать задание</span>
                    </Button>
                  </div>

                  {homework.submitted ? (
                    <div className="bg-green-50 text-green-700 p-3 rounded-md">
                      Решение загружено
                    </div>
                  ) : (
                    <div>
                      <p className="mb-2 text-sm">Загрузить решение:</p>
                      <input
                        type="file"
                        id={`solution-${homework.id}`}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(homework.id, file);
                        }}
                      />
                      <label htmlFor={`solution-${homework.id}`}>
                        <Button
                          variant="secondary"
                          disabled={uploading === homework.id}
                          className="cursor-pointer"
                          asChild
                        >
                          <span>
                            {uploading === homework.id ? (
                              <>
                                <Loader className="mr-2 h-4 w-4 animate-spin" />
                                Загрузка...
                              </>
                            ) : (
                              <>
                                <Upload className="mr-2 h-4 w-4" />
                                Выбрать файл
                              </>
                            )}
                          </span>
                        </Button>
                      </label>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
