import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { Loader, Plus, FileText, Trash, ArrowLeft, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
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
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Student {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

interface Homework {
  id: string;
  title: string;
  description: string;
  file_url: string;
  created_at: string;
}

interface HomeworkWithAssignedStudents extends Homework {
  assignedStudents?: Student[];
}

export default function TeacherHomework() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandDialogOpen, setExpandDialogOpen] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);
  const [assignedStudentIds, setAssignedStudentIds] = useState<string[]>([]);
  const [additionalStudentIds, setAdditionalStudentIds] = useState<string[]>([]);
  const [assigningToStudents, setAssigningToStudents] = useState(false);
  
  const [newHomework, setNewHomework] = useState({
    title: '',
    description: '',
    file: null as File | null,
  });
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      fetchStudents();
      fetchHomeworks();
    }
  }, [user]);

  const fetchStudents = async () => {
    try {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .eq('role', 'student');

      if (error) throw error;
      
      setStudents(data || []);
    } catch (error) {
      console.error('Ошибка при загрузке списка студентов:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить список студентов',
        variant: 'destructive'
      });
    }
  };

  const fetchHomeworks = async () => {
    try {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('homeworks')
        .select('*')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setHomeworks(data || []);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setNewHomework({ ...newHomework, file });
  };

  const createHomework = async () => {
    try {
      if (!user || !newHomework.file || !newHomework.title || selectedStudentIds.length === 0) {
        toast({
          title: 'Ошибка',
          description: selectedStudentIds.length === 0 ? 'Выберите хотя бы одного ученика' : 'Заполните все поля и выберите файл',
          variant: 'destructive'
        });
        return;
      }

      setUploading(true);

      // Загрузка файла в Storage
      const fileExt = newHomework.file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `homeworks/${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('homework_files')
        .upload(filePath, newHomework.file);

      if (uploadError) throw uploadError;
      
      // Создание записи о домашнем задании
      const { error: homeworkError, data: homeworkData } = await supabase
        .from('homeworks')
        .insert([
          {
            title: newHomework.title,
            description: newHomework.description,
            file_url: filePath,
            teacher_id: user.id
          }
        ])
        .select();

      if (homeworkError) throw homeworkError;

      // Назначение выбранным ученикам
      if (homeworkData && homeworkData.length > 0) {
        const homeworkId = homeworkData[0].id;

        const studentAssignments = selectedStudentIds.map((studentId) => ({
          student_id: studentId,
          homework_id: homeworkId,
          status: 'not_started'
        }));

        if (studentAssignments.length > 0) {
          const { error: assignError } = await supabase
            .from('student_homeworks')
            .insert(studentAssignments);

          if (assignError) throw assignError;
        }
      }

      // Очистка формы и обновление списка
      setNewHomework({
        title: '',
        description: '',
        file: null
      });
      setSelectedStudentIds([]);
      
      setDialogOpen(false);
      await fetchHomeworks();

      toast({
        title: 'Задание создано',
        description: 'Новое домашнее задание успешно создано'
      });

    } catch (error) {
      console.error('Ошибка при создании домашнего задания:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать домашнее задание',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
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

  const deleteHomework = async (id: string) => {
    try {
      setDeletingId(id);
      const { error } = await supabase
        .from('homeworks')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast({ title: 'Удалено', description: 'Домашнее задание удалено' });
      await fetchHomeworks();
    } catch (error) {
      console.error('Ошибка при удалении задания:', error);
      toast({ title: 'Ошибка', description: 'Не удалось удалить задание', variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  const openExpandDialog = async (homework: Homework) => {
    setSelectedHomework(homework);
    
    try {
      // Получаем список студентов, которым уже назначено это задание
      const { data, error } = await supabase
        .from('student_homeworks')
        .select('student_id')
        .eq('homework_id', homework.id);

      if (error) throw error;
      
      const currentlyAssigned = data?.map(item => item.student_id) || [];
      setAssignedStudentIds(currentlyAssigned);
      setAdditionalStudentIds([]);
      setExpandDialogOpen(true);
    } catch (error) {
      console.error('Ошибка при загрузке назначенных студентов:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить информацию о назначенных студентах',
        variant: 'destructive'
      });
    }
  };

  const assignHomeworkToAdditionalStudents = async () => {
    if (!selectedHomework || additionalStudentIds.length === 0) return;

    try {
      setAssigningToStudents(true);

      const studentAssignments = additionalStudentIds.map((studentId) => ({
        student_id: studentId,
        homework_id: selectedHomework.id,
        status: 'not_started'
      }));

      const { error } = await supabase
        .from('student_homeworks')
        .insert(studentAssignments);

      if (error) throw error;

      toast({
        title: 'Задание назначено',
        description: `Задание успешно назначено ${additionalStudentIds.length} дополнительным ученикам`
      });

      setExpandDialogOpen(false);
      setSelectedHomework(null);
      setAdditionalStudentIds([]);
    } catch (error) {
      console.error('Ошибка при назначении задания:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось назначить задание дополнительным ученикам',
        variant: 'destructive'
      });
    } finally {
      setAssigningToStudents(false);
    }
  };

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
          className="bg-white p-6 rounded-lg shadow-sm space-y-6"
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Домашние задания</h1>
              <p className="text-gray-600">Создание и управление заданиями</p>
            </div>
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  <span>Создать задание</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Создать новое задание</DialogTitle>
                  <DialogDescription>
                    Заполните форму для создания нового домашнего задания
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label htmlFor="title" className="text-sm font-medium">Название</label>
                    <Input
                      id="title"
                      value={newHomework.title}
                      onChange={(e) => setNewHomework({ ...newHomework, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="description" className="text-sm font-medium">Описание</label>
                    <Textarea
                      id="description"
                      value={newHomework.description}
                      onChange={(e) => setNewHomework({ ...newHomework, description: e.target.value })}
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="file" className="text-sm font-medium">Файл задания (PDF/Doc/изображение)</label>
                    <Input
                      id="file"
                      type="file"
                      accept=".pdf,.doc,.docx,image/*"
                      onChange={handleFileChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Назначить ученикам</label>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600">Выбрано: {selectedStudentIds.length}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedStudentIds(
                          selectedStudentIds.length === students.length ? [] : students.map((s) => s.id)
                        )}
                      >
                        {selectedStudentIds.length === students.length ? 'Снять выбор' : 'Выбрать всех'}
                      </Button>
                    </div>
                    <ScrollArea className="h-48 rounded-md border p-2">
                      <div className="space-y-2">
                        {students.length === 0 ? (
                          <p className="text-sm text-gray-600">Нет доступных учеников</p>
                        ) : (
                          students.map((student) => (
                            <div key={student.id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
                              <Checkbox
                                id={student.id}
                                checked={selectedStudentIds.includes(student.id)}
                                onCheckedChange={(checked) => {
                                  const isChecked = Boolean(checked);
                                  setSelectedStudentIds((prev) =>
                                    isChecked ? [...prev, student.id] : prev.filter((id) => id !== student.id)
                                  );
                                }}
                              />
                              <label htmlFor={student.id} className="text-sm leading-none cursor-pointer">
                                {(student.first_name || student.last_name)
                                  ? `${student.first_name || ''} ${student.last_name || ''}`.trim()
                                  : 'Имя не указано'}
                                <span className="ml-2 text-gray-600">({student.email})</span>
                              </label>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                  <Button 
                    onClick={createHomework} 
                    className="w-full"
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                        Создание...
                      </>
                    ) : 'Создать задание'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader className="h-8 w-8 animate-spin text-math-primary" />
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {homeworks.map((homework, index) => (
                <motion.div
                  key={homework.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>{homework.title}</CardTitle>
                      <CardDescription>
                        Дата публикации: {new Date(homework.created_at).toLocaleDateString('ru-RU')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4">{homework.description}</p>
                      <div className="flex items-center justify-between">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center space-x-2"
                          onClick={() => {
                            const ext = (homework.file_url.split('.').pop() || 'file');
                            downloadHomework(homework.file_url, `${homework.title}.${ext}`);
                          }}
                        >
                          <FileText className="h-4 w-4" />
                          <span>Скачать задание</span>
                        </Button>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                            onClick={() => openExpandDialog(homework)}
                          >
                            <Settings className="h-4 w-4" />
                            <span>Настройки</span>
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="flex items-center gap-2"
                                disabled={deletingId === homework.id}
                              >
                                {deletingId === homework.id ? (
                                  <>
                                    <Loader className="h-4 w-4 animate-spin" />
                                    Удаление...
                                  </>
                                ) : (
                                  <>
                                    <Trash className="h-4 w-4" />
                                    Удалить
                                  </>
                                )}
                              </Button>
                            </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Удалить задание?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Это действие нельзя отменить. Задание будет удалено для всех назначенных учеников.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Отмена</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteHomework(homework.id)}>
                                Подтвердить
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                           </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
              
              {homeworks.length === 0 && (
                <div className="col-span-2 text-center p-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">У вас пока нет созданных домашних заданий</p>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Диалог расширения видимости задания */}
        <Dialog open={expandDialogOpen} onOpenChange={setExpandDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Настройки задания</DialogTitle>
              <DialogDescription>
                Расширьте область видимости задания "{selectedHomework?.title}" для дополнительных учеников
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Назначить дополнительным ученикам</label>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Выбрано: {additionalStudentIds.length} новых учеников
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const availableStudents = students.filter(s => !assignedStudentIds.includes(s.id));
                      setAdditionalStudentIds(
                        additionalStudentIds.length === availableStudents.length 
                          ? [] 
                          : availableStudents.map(s => s.id)
                      );
                    }}
                  >
                    {additionalStudentIds.length === students.filter(s => !assignedStudentIds.includes(s.id)).length 
                      ? 'Снять выбор' 
                      : 'Выбрать всех доступных'
                    }
                  </Button>
                </div>
                <ScrollArea className="h-48 rounded-md border p-2">
                  <div className="space-y-2">
                    {students.length === 0 ? (
                      <p className="text-sm text-gray-600">Нет доступных учеников</p>
                    ) : (
                      students.map((student) => {
                        const isAlreadyAssigned = assignedStudentIds.includes(student.id);
                        return (
                          <div key={student.id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
                            <Checkbox
                              id={`expand-${student.id}`}
                              checked={isAlreadyAssigned || additionalStudentIds.includes(student.id)}
                              disabled={isAlreadyAssigned}
                              onCheckedChange={(checked) => {
                                const isChecked = Boolean(checked);
                                setAdditionalStudentIds((prev) =>
                                  isChecked 
                                    ? [...prev, student.id] 
                                    : prev.filter((id) => id !== student.id)
                                );
                              }}
                            />
                            <label 
                              htmlFor={`expand-${student.id}`} 
                              className={`text-sm leading-none cursor-pointer ${
                                isAlreadyAssigned ? 'text-gray-500' : ''
                              }`}
                            >
                              {(student.first_name || student.last_name)
                                ? `${student.first_name || ''} ${student.last_name || ''}`.trim()
                                : 'Имя не указано'}
                              <span className="ml-2 text-gray-600">({student.email})</span>
                              {isAlreadyAssigned && (
                                <span className="ml-2 text-xs bg-gray-200 px-2 py-1 rounded">
                                  Уже назначено
                                </span>
                              )}
                            </label>
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </div>
              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setExpandDialogOpen(false)}
                  className="flex-1"
                >
                  Отмена
                </Button>
                <Button 
                  onClick={assignHomeworkToAdditionalStudents} 
                  className="flex-1"
                  disabled={assigningToStudents || additionalStudentIds.length === 0}
                >
                  {assigningToStudents ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Назначение...
                    </>
                  ) : (
                    `Назначить ${additionalStudentIds.length > 0 ? `(${additionalStudentIds.length})` : ''}`
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </motion.div>
  );
}