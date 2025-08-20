import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { Loader, FileText, Trash, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CheatSheetTopicsManager from '@/components/dashboard/CheatSheetTopicsManager';
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

interface Student {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

interface CheatSheet {
  id: string;
  title: string | null;
  description: string | null;
  file_path: string;
  student_id: string;
  topic_id: string | null;
  created_at: string;
}

export default function TeacherCheatSheets() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [cheatSheets, setCheatSheets] = useState<CheatSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCheatStudentId, setSelectedCheatStudentId] = useState<string>('');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [newCheat, setNewCheat] = useState({ title: '', description: '', file: null as File | null });
  const [uploadingCheat, setUploadingCheat] = useState(false);
  const [deletingCheatId, setDeletingCheatId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchStudents();
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
    } finally {
      setLoading(false);
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
      if (!user || !selectedCheatStudentId || !newCheat.file || !newCheat.title || !selectedTopicId) {
        toast({ title: 'Ошибка', description: 'Выберите ученика, тему, укажите название и файл', variant: 'destructive' });
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
          topic_id: selectedTopicId,
          title: newCheat.title, 
          description: newCheat.description || null, 
          file_path: uploadData?.path || filePath 
        }]);
      if (insertError) throw insertError;

      toast({ title: 'Шпаргалка добавлена', description: 'Файл успешно прикреплён ученику' });
      setNewCheat({ title: '', description: '', file: null });
      setSelectedTopicId('');
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
          <div>
            <h1 className="text-2xl font-bold mb-2">Шпаргалки для учеников</h1>
            <p className="text-gray-600">Прикрепляйте файлы-помощники к конкретным ученикам по темам</p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader className="h-8 w-8 animate-spin text-math-primary" />
            </div>
          ) : (
            <>
              <CheatSheetTopicsManager
                onTopicSelect={setSelectedTopicId}
                selectedTopicId={selectedTopicId}
              />
              
              <Card>
                <CardHeader>
                  <CardTitle>Добавить шпаргалку</CardTitle>
                  <CardDescription>Прикрепите файл-помощник к ученику</CardDescription>
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
                      <label className="text-sm font-medium">Выберите тему</label>
                      <div className="text-sm text-gray-600 mb-2">
                        {selectedTopicId ? 'Тема выбрана из списка выше' : 'Сначала выберите тему из списка выше'}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="cheat-title" className="text-sm font-medium">Название</label>
                      <Input id="cheat-title" value={newCheat.title} onChange={(e) => setNewCheat({ ...newCheat, title: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="cheat-desc" className="text-sm font-medium">Описание (необязательно)</label>
                      <Textarea id="cheat-desc" rows={3} value={newCheat.description} onChange={(e) => setNewCheat({ ...newCheat, description: e.target.value })} />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label htmlFor="cheat-file" className="text-sm font-medium">Файл (PDF/Doc/изображение)</label>
                      <Input id="cheat-file" type="file" accept=".pdf,.doc,.docx,image/*" onChange={handleCheatFileChange} />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button onClick={createCheatSheet} disabled={uploadingCheat || !selectedCheatStudentId || !selectedTopicId}>
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
                                  {deletingCheatId === c.id ? <Loader className="h-4 w-4 animate-spin" /> : <Trash className="h-4 w-4" />}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Удалить шпаргалку?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Это действие нельзя отменить. Файл будет удален навсегда.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteCheatSheet(c.id, c.file_path)}>
                                    Подтвердить
                                  </AlertDialogAction>
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
            </>
          )}
        </motion.div>
      </main>
      <Footer />
    </motion.div>
  );
}