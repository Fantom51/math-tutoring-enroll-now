import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader, FileText, Upload, Download, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { supabase } from '@/lib/supabaseClient';
import EgeAnswerInput from '@/components/homework/EgeAnswerInput';

interface Homework {
  id: string;
  title: string;
  description: string;
  file_url: string;
  created_at: string;
  status: string;
  solution_url?: string;
  is_ege?: boolean;
  ege_answers?: string[];
  ege_student_answers?: string[];
  ege_score?: number;
  student_homework_id?: string;
}

const StudentHomework = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [egeDialogOpen, setEgeDialogOpen] = useState(false);
  const [selectedEgeHomework, setSelectedEgeHomework] = useState<Homework | null>(null);

  useEffect(() => {
    if (user) {
      fetchHomeworks();
    }
  }, [user]);

  const fetchHomeworks = async () => {
    try {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('student_homeworks')
        .select(`
          id,
          status,
          solution_url,
          homework_id,
          ege_student_answers,
          ege_score,
          homeworks (
            id,
            title,
            description,
            file_url,
            created_at,
            is_ege,
            ege_answers
          )
        `)
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedHomeworks = data?.map((item: any) => ({
        id: item.homework_id,
        title: item.homeworks.title,
        description: item.homeworks.description,
        file_url: item.homeworks.file_url,
        created_at: item.homeworks.created_at,
        status: item.status,
        solution_url: item.solution_url,
        student_homework_id: item.id,
        is_ege: item.homeworks.is_ege,
        ege_answers: item.homeworks.ege_answers,
        ege_student_answers: item.ege_student_answers,
        ege_score: item.ege_score
      })) || [];

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

  const downloadHomework = async (fileUrl: string, homeworkTitle: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('homework_files')
        .download(fileUrl);

      if (error) throw error;

      // Извлекаем оригинальное расширение файла из URL
      const originalFileName = fileUrl.split('/').pop() || '';
      const fileExtension = originalFileName.split('.').pop() || 'txt';
      const fileName = `${homeworkTitle}.${fileExtension}`;

      const blob = new Blob([data]);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Ошибка при скачивании файла:', error);
      toast({
        title: 'Ошибка скачивания',
        description: 'Не удалось скачать файл',
        variant: 'destructive'
      });
    }
  };

  const handleFileUpload = async (homeworkId: string, file: File) => {
    try {
      if (!user) return;
      
      setUploading(homeworkId);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${homeworkId}-${Date.now()}.${fileExt}`;
      const filePath = `solutions/${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('homework_solutions')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from('student_homeworks')
        .update({
          solution_url: filePath,
          status: 'submitted'
        })
        .eq('homework_id', homeworkId)
        .eq('student_id', user.id);

      if (updateError) throw updateError;

      toast({
        title: 'Решение загружено',
        description: 'Ваше решение успешно отправлено преподавателю'
      });

      await fetchHomeworks();
    } catch (error) {
      console.error('Ошибка при загрузке решения:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить решение',
        variant: 'destructive'
      });
    } finally {
      setUploading(null);
    }
  };

  const handleEgeAnswerSubmit = async (answers: string[]) => {
    if (!selectedEgeHomework || !user) return;
    
    try {
      const score = answers.reduce((total, answer, index) => {
        return total + (answer.trim().toLowerCase() === selectedEgeHomework.ege_answers?.[index]?.toLowerCase() ? 1 : 0);
      }, 0);

      const { error } = await supabase
        .from('student_homeworks')
        .update({
          ege_student_answers: answers,
          ege_score: score,
          status: 'submitted'
        })
        .eq('homework_id', selectedEgeHomework.id)
        .eq('student_id', user.id);

      if (error) throw error;

      toast({
        title: 'Ответы отправлены',
        description: `Ваш результат: ${score}/12`
      });

      await fetchHomeworks();
      setEgeDialogOpen(false);
      setSelectedEgeHomework(null);
    } catch (error) {
      console.error('Ошибка при отправке ответов ЕГЭ:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить ответы',
        variant: 'destructive'
      });
    }
  };

  const openEgeDialog = (homework: Homework) => {
    setSelectedEgeHomework(homework);
    setEgeDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'not_started':
        return <Badge variant="outline">Не начато</Badge>;
      case 'submitted':
        return <Badge variant="default">Отправлено</Badge>;
      case 'reviewed':
        return <Badge variant="secondary">Проверено</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-math-primary" />
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Navbar />
      <main className="container mx-auto pt-20 pb-16 px-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-4 mb-8">
            <Link to="/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Назад в кабинет
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold mb-2">Домашние задания</h1>
              <p className="text-gray-600">Просмотр и выполнение заданий</p>
            </div>
          </div>

          {homeworks.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">У вас пока нет домашних заданий</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {homeworks.map((homework) => (
                <Card key={homework.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{homework.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {homework.description}
                        </CardDescription>
                      </div>
                      {getStatusBadge(homework.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
                      <div className="flex gap-2">
                        <Button
                          onClick={() => downloadHomework(homework.file_url, homework.title)}
                          variant="outline"
                          size="sm"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Скачать задание
                        </Button>
                        
                        {homework.is_ege ? (
                          <Button
                            onClick={() => openEgeDialog(homework)}
                            size="sm"
                            variant={homework.ege_student_answers ? "outline" : "default"}
                          >
                            {homework.ege_student_answers ? 
                              `Результат: ${homework.ege_score}/12` : 
                              'Ввести ответы ЕГЭ'
                            }
                          </Button>
                        ) : homework.status !== 'submitted' && (
                          <div>
                            <input
                              type="file"
                              id={`file-${homework.id}`}
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleFileUpload(homework.id, file);
                                }
                              }}
                            />
                            <Button
                              onClick={() => document.getElementById(`file-${homework.id}`)?.click()}
                              disabled={uploading === homework.id}
                              size="sm"
                            >
                              {uploading === homework.id ? (
                                <Loader className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <Upload className="h-4 w-4 mr-2" />
                              )}
                              Загрузить решение
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-500">
                        Создано: {new Date(homework.created_at).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </motion.div>
      </main>
      <Footer />
      
      {selectedEgeHomework && (
        <EgeAnswerInput
          isOpen={egeDialogOpen}
          onClose={() => {
            setEgeDialogOpen(false);
            setSelectedEgeHomework(null);
          }}
          teacherAnswers={selectedEgeHomework.ege_answers || []}
          onSubmit={handleEgeAnswerSubmit}
          homeworkTitle={selectedEgeHomework.title}
          existingAnswers={selectedEgeHomework.ege_student_answers}
          existingScore={selectedEgeHomework.ege_score}
        />
      )}
    </motion.div>
  );
};

export default StudentHomework;