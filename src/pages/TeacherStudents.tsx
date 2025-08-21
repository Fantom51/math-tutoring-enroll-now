import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { Loader, Users, UserCheck, ArrowLeft, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

interface Student {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

export default function TeacherStudents() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

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
          className="bg-white p-6 rounded-lg shadow-sm"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>Мои ученики</span>
              </CardTitle>
              <CardDescription>Список учеников, зарегистрированных в системе</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader className="h-8 w-8 animate-spin text-math-primary" />
                </div>
              ) : students.length === 0 ? (
                <div className="text-center p-8 bg-gray-50 rounded-lg">
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
                      <div className="flex items-center gap-2">
                        <Link to={`/chat/${student.id}`}>
                          <Button variant="outline" size="sm">
                            <MessageCircle className="w-4 h-4 mr-1" />
                            Чат
                          </Button>
                        </Link>
                        <UserCheck className="text-green-500 w-5 h-5" />
                      </div>
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