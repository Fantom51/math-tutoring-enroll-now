import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { Loader, Upload, FileText, Plus, Users, UserCheck, BookOpen, CalendarDays, Trash } from 'lucide-react';
import { motion } from 'framer-motion';
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
import TeacherAvailability from './TeacherAvailability';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Student {
  id: string;
  email: string;
  full_name?: string | null;
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

interface BookingRecord {
  id: string;
  date: string; // yyyy-mm-dd
  time_slot: string;
  student_id: string;
  status: string;
  created_at: string;
}

interface CheatSheet {
  id: string;
  title: string | null;
  description: string | null;
  file_path: string;
  student_id: string;
  created_at: string;
}

export default function TeacherDashboard() {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'students' | 'homeworks' | 'cheatsheets' | 'availability'>('students');
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const [newHomework, setNewHomework] = useState({
    title: '',
    description: '',
    file: null as File | null,
  });
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loadingBookings, setLoadingBookings] = useState<boolean>(false);
  const [cheatSheets, setCheatSheets] = useState<CheatSheet[]>([]);
  const [selectedCheatStudentId, setSelectedCheatStudentId] = useState<string>('');
  const [newCheat, setNewCheat] = useState({ title: '', description: '', file: null as File | null });
  const [uploadingCheat, setUploadingCheat] = useState(false);
  const [deletingCheatId, setDeletingCheatId] = useState<string | null>(null);
  useEffect(() => {
    if (user) {
      console.log("TeacherDashboard: User loaded, fetching data", user.id);
      console.log("User profile:", userProfile);
      fetchStudents();
      fetchHomeworks();
      fetchBookings();
    }
  }, [user, userProfile]);

  const fetchStudents = async () => {
    try {
      if (!user) return;
      
      console.log("Fetching students...");
      
      // Получаем пользователей с ролью "студент"
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .eq('role', 'student');

      if (error) {
        console.error("Error fetching students:", error);
        throw error;
      }
      
      console.log("Students fetched:", data);
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
      
      console.log("Fetching homeworks for teacher:", user.id);
      
      // Получаем все домашние задания, созданные текущим преподавателем
      const { data, error } = await supabase
        .from('homeworks')
        .select('*')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching homeworks:", error);
        throw error;
      }
      
      console.log("Homeworks fetched:", data);
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

  const fetchBookings = async () => {
    try {
      if (!user) return;
      setLoadingBookings(true);
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('teacher_id', user.id)
        .gte('date', today)
        .order('date', { ascending: true })
        .order('time_slot', { ascending: true });
      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Ошибка при загрузке записей:', error);
      toast({ title: 'Ошибка', description: 'Не удалось загрузить список записей', variant: 'destructive' });
    } finally {
      setLoadingBookings(false);
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

      console.log("Creating homework with user:", user.id);
      console.log("File:", newHomework.file);

      setUploading(true);

      // 1. Проверяем наличие хранилища
      console.log("Checking if homework_files bucket exists...");
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error("Error listing buckets:", bucketsError);
        throw bucketsError;
      }
      
      const homeworkBucket = buckets?.find(bucket => bucket.name === 'homework_files');
      
      // Пропускаем создание бакета на клиенте из-за RLS; он уже создан на сервере
      if (!homeworkBucket) {
        console.warn('Bucket homework_files не найден. Обратитесь к администратору.');
      } else {
        console.log("Bucket already exists");
      }

      // 2. Загрузка файла в Storage
      const fileExt = newHomework.file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `homeworks/${user.id}/${fileName}`;

      console.log("Uploading file to path:", filePath);
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('homework_files')
        .upload(filePath, newHomework.file);

      if (uploadError) {
        console.error("File upload error:", uploadError);
        throw uploadError;
      }

      console.log("File uploaded successfully:", uploadData);
      
      // 3. Создание записи о домашнем задании
      console.log("Creating homework record...");
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

      if (homeworkError) {
        console.error("Homework record creation error:", homeworkError);
        throw homeworkError;
      }

      console.log("Homework created successfully:", homeworkData);

      // 4. Назначаем выбранным ученикам
      if (homeworkData && homeworkData.length > 0) {
        const homeworkId = homeworkData[0].id;

        const studentAssignments = selectedStudentIds.map((studentId) => ({
          student_id: studentId,
          homework_id: homeworkId,
          status: 'not_started'
        }));

        if (studentAssignments.length > 0) {
          console.log("Assigning homework to selected students:", studentAssignments);
          const { error: assignError } = await supabase
            .from('student_homeworks')
            .insert(studentAssignments);

          if (assignError) {
            console.error("Error assigning homework to students:", assignError);
            throw assignError;
          }

          console.log("Homework assigned to selected students successfully");
        }
      }

      // 5. Очищаем форму и обновляем список
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
      let errorMessage = 'Не удалось создать домашнее задание';
      
      if (error instanceof Error) {
        console.error('Detailed error:', error.message);
        errorMessage += `: ${error.message}`;
      } else if (typeof error === 'object' && error !== null) {
        // Для случаев, когда supabase возвращает объект ошибки
        const supabaseError = error as any;
        if (supabaseError.message) {
          errorMessage += `: ${supabaseError.message}`;
        }
        if (supabaseError.code) {
          errorMessage += ` (код ${supabaseError.code})`;
        }
        if (supabaseError.details) {
          console.error('Error details:', supabaseError.details);
        }
      }
      
      toast({
        title: 'Ошибка',
        description: errorMessage,
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

  const fetchCheatSheetsForStudent = async (studentId: string) => {
    try {
      if (!user || !studentId) return;
      const { data, error } = await supabase
        .from('student_cheatsheets')
        .select('*')
        .eq('teacher_id', user.id)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setCheatSheets(data || []);
    } catch (error) {
      console.error('Ошибка при загрузке шпаргалок:', error);
      toast({ title: 'Ошибка', description: 'Не удалось загрузить шпаргалки', variant: 'destructive' });
    }
  };

  const handleCheatFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setNewCheat({ ...newCheat, file });
  };

  const createCheatSheet = async () => {
    try {
      if (!user || !selectedCheatStudentId || !newCheat.file || !newCheat.title) {
        toast({ title: 'Ошибка', description: 'Выберите ученика, укажите название и файл', variant: 'destructive' });
        return;
      }
      setUploadingCheat(true);
      const fileExt = newCheat.file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `${selectedCheatStudentId}/${fileName}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('learning_resources')
        .upload(filePath, newCheat.file);
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase
        .from('student_cheatsheets')
        .insert([{ 
          teacher_id: user.id, 
          student_id: selectedCheatStudentId, 
          title: newCheat.title, 
          description: newCheat.description || null, 
          file_path: uploadData?.path || filePath 
        }]);
      if (insertError) throw insertError;

      toast({ title: 'Шпаргалка добавлена', description: 'Файл успешно прикреплён ученику' });
      setNewCheat({ title: '', description: '', file: null });
      await fetchCheatSheetsForStudent(selectedCheatStudentId);
    } catch (error) {
      console.error('Ошибка при добавлении шпаргалки:', error);
      toast({ title: 'Ошибка', description: 'Не удалось прикрепить файл', variant: 'destructive' });
    } finally {
      setUploadingCheat(false);
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
      toast({ title: 'Ошибка скачивания', description: 'Не удалось скачать файл', variant: 'destructive' });
    }
  };

  const deleteCheatSheet = async (id: string, filePath: string) => {
    try {
      setDeletingCheatId(id);
      // Удаляем файл из хранилища сначала (политика опирается на строку в таблице)
      const { error: removeError } = await supabase.storage
        .from('learning_resources')
        .remove([filePath]);
      if (removeError) throw removeError;

      const { error } = await supabase
        .from('student_cheatsheets')
        .delete()
        .eq('id', id);
      if (error) throw error;

      toast({ title: 'Удалено', description: 'Шпаргалка удалена' });
      if (selectedCheatStudentId) await fetchCheatSheetsForStudent(selectedCheatStudentId);
    } catch (error) {
      console.error('Ошибка при удалении шпаргалки:', error);
      toast({ title: 'Ошибка', description: 'Не удалось удалить шпаргалку', variant: 'destructive' });
    } finally {
      setDeletingCheatId(null);
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Панель преподавателя</h2>
          <p className="text-gray-600">Управление учениками и домашними заданиями</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            variant={activeTab === 'students' ? 'default' : 'outline'} 
            onClick={() => setActiveTab('students')}
            className="flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            <span>Ученики</span>
          </Button>
          <Button 
            variant={activeTab === 'homeworks' ? 'default' : 'outline'} 
            onClick={() => setActiveTab('homeworks')}
            className="flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            <span>Задания</span>
          </Button>
          <Button 
            variant={activeTab === 'cheatsheets' ? 'default' : 'outline'} 
            onClick={() => setActiveTab('cheatsheets')}
            className="flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            <span>Шпаргалки</span>
          </Button>
          <Button 
            variant={activeTab === 'availability' ? 'default' : 'outline'} 
            onClick={() => setActiveTab('availability')}
            className="flex items-center gap-2"
          >
            <CalendarDays className="w-4 h-4" />
            <span>Расписание</span>
          </Button>
        </div>
      </div>
      
      {activeTab === 'students' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>Мои ученики</span>
              </CardTitle>
              <CardDescription>Список учеников, зарегистрированных в системе</CardDescription>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">На данный момент нет учеников в системе</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {students.map((student, index) => (
                    <motion.div
                      key={student.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div>
                        <p className="font-medium">
                          {student.first_name || student.last_name 
                            ? `${student.first_name || ''} ${student.last_name || ''}`.trim()
                            : 'Имя не указано'}
                        </p>
                        <p className="text-sm text-gray-600">{student.email}</p>
                      </div>
                      <UserCheck className="text-green-500 w-5 h-5" />
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
      
      {activeTab === 'homeworks' && (
        <>
          <div className="flex justify-end">
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
                    <div className="flex items-center space-x-2">
                      <Input
                        id="file"
                        type="file"
                        accept=".pdf,.doc,.docx,image/*"
                        onChange={handleFileChange}
                      />
                    </div>
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
        </>
      )}
      
      {activeTab === 'cheatsheets' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Шпаргалки для учеников</CardTitle>
              <CardDescription>Прикрепляйте файлы-помощники к конкретным ученикам</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Выберите ученика</label>
                  <Select value={selectedCheatStudentId} onValueChange={(v) => { setSelectedCheatStudentId(v); fetchCheatSheetsForStudent(v); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Не выбран" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {(s.first_name || s.last_name) ? `${s.first_name || ''} ${s.last_name || ''}`.trim() : 'Имя не указано'} ({s.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="cheat-title" className="text-sm font-medium">Название</label>
                  <Input id="cheat-title" value={newCheat.title} onChange={(e) => setNewCheat({ ...newCheat, title: e.target.value })} />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label htmlFor="cheat-desc" className="text-sm font-medium">Описание (необязательно)</label>
                  <Textarea id="cheat-desc" rows={3} value={newCheat.description} onChange={(e) => setNewCheat({ ...newCheat, description: e.target.value })} />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label htmlFor="cheat-file" className="text-sm font-medium">Файл (PDF/Doc/изображение)</label>
                  <Input id="cheat-file" type="file" accept=".pdf,.doc,.docx,image/*" onChange={handleCheatFileChange} />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button onClick={createCheatSheet} disabled={uploadingCheat || !selectedCheatStudentId}>
                  {uploadingCheat ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Загрузка...
                    </>
                  ) : 'Прикрепить'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Шпаргалки ученика</CardTitle>
              <CardDescription>Список файлов для выбранного ученика</CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedCheatStudentId ? (
                <div className="text-center p-8 bg-gray-50 rounded-lg">Выберите ученика, чтобы увидеть шпаргалки</div>
              ) : cheatSheets.length === 0 ? (
                <div className="text-center p-8 bg-gray-50 rounded-lg">Пока нет шпаргалок</div>
              ) : (
                <div className="space-y-3">
                  {cheatSheets.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{c.title || 'Шпаргалка'}</p>
                        <p className="text-sm text-gray-600">{new Date(c.created_at).toLocaleDateString('ru-RU')}</p>
                        {c.description && <p className="text-sm mt-1">{c.description}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => downloadCheatSheet(c.file_path, c.title || 'cheatsheet')}>
                          <FileText className="h-4 w-4" /> Скачать
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" disabled={deletingCheatId === c.id}>
                              {deletingCheatId === c.id ? 'Удаление...' : 'Удалить'}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Удалить шпаргалку?</AlertDialogTitle>
                              <AlertDialogDescription>Файл будет удалён без возможности восстановления.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Отмена</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteCheatSheet(c.id, c.file_path)}>Подтвердить</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      
      {activeTab === 'availability' && (
        <div className="space-y-6">
          <TeacherAvailability />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5" />
                <span>Записи учеников</span>
              </CardTitle>
              <CardDescription>Ближайшие бронирования занятий</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingBookings ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="h-5 w-5 animate-spin text-math-primary" />
                </div>
              ) : bookings.length === 0 ? (
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">Пока нет записей от учеников</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bookings.map((b) => {
                    const student = students.find((s) => s.id === b.student_id);
                    const studentName = student && (student.first_name || student.last_name)
                      ? `${student.first_name || ''} ${student.last_name || ''}`.trim()
                      : (student?.email || 'Неизвестный ученик');
                    return (
                      <div key={b.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div>
                          <p className="font-medium">{new Date(b.date).toLocaleDateString('ru-RU')} • {b.time_slot}</p>
                          <p className="text-sm text-gray-600">{studentName}</p>
                        </div>
                        <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 capitalize">{b.status}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
