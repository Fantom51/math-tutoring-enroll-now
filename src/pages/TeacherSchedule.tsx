import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { Loader, Calendar, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import TeacherAvailability from '@/components/dashboard/TeacherAvailability';

interface BookingRecord {
  id: string;
  date: string;
  time_slot: string;
  student_id: string;
  status: string;
  created_at: string;
}

export default function TeacherSchedule() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

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
            <h1 className="text-2xl font-bold mb-2">Расписание и записи</h1>
            <p className="text-gray-600">Управление расписанием и просмотр записей студентов</p>
          </div>

          <TeacherAvailability />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>Предстоящие занятия</span>
              </CardTitle>
              <CardDescription>Список записей студентов на ваши занятия</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingBookings ? (
                <div className="flex justify-center items-center h-32">
                  <Loader className="h-6 w-6 animate-spin text-math-primary" />
                </div>
              ) : bookings.length === 0 ? (
                <div className="text-center p-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">На данный момент нет предстоящих записей</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">
                          {new Date(booking.date).toLocaleDateString('ru-RU')} в {booking.time_slot}
                        </p>
                        <p className="text-sm text-gray-600">
                          Статус: {booking.status === 'pending' ? 'Ожидает' : booking.status === 'confirmed' ? 'Подтверждено' : 'Отменено'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          Записан: {new Date(booking.created_at).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                    </div>
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