import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader, Calendar, Clock, User, X } from 'lucide-react';
import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { supabase } from '@/lib/supabaseClient';
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

interface StudentBooking {
  id: string;
  date: string;
  time_slot: string;
  teacher_id: string;
  status: string;
  created_at: string;
  teacher_name?: string;
}

const StudentBookings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<StudentBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    try {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          date,
          time_slot,
          teacher_id,
          status,
          created_at,
          profiles!bookings_teacher_id_fkey (
            first_name,
            last_name
          )
        `)
        .eq('student_id', user.id)
        .order('date', { ascending: true })
        .order('time_slot', { ascending: true });

      if (error) throw error;

      const formattedBookings = data?.map((booking: any) => ({
        ...booking,
        teacher_name: booking.profiles 
          ? `${booking.profiles.first_name || ''} ${booking.profiles.last_name || ''}`.trim()
          : 'Неизвестный преподаватель'
      })) || [];

      setBookings(formattedBookings);
    } catch (error) {
      console.error('Ошибка при загрузке записей:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить записи',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (bookingId: string) => {
    try {
      setCanceling(bookingId);
      
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: 'Запись отменена',
        description: 'Ваша запись успешно отменена'
      });

      await fetchBookings();
    } catch (error) {
      console.error('Ошибка при отмене записи:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось отменить запись',
        variant: 'destructive'
      });
    } finally {
      setCanceling(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">Ожидает</Badge>;
      case 'confirmed':
        return <Badge variant="default">Подтверждена</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Отменена</Badge>;
      case 'completed':
        return <Badge variant="secondary">Завершена</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-math-primary" />
      </div>
    );
  }

  const upcomingBookings = bookings.filter(booking => 
    new Date(booking.date) >= new Date() && booking.status !== 'cancelled'
  );
  const pastBookings = bookings.filter(booking => 
    new Date(booking.date) < new Date() || booking.status === 'cancelled'
  );

  return (
    <motion.div
      className="min-h-screen bg-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Navbar />
      <main className="container mx-auto pt-24 pb-16 px-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Мои записи</h1>
            <p className="text-gray-600">Управление записями на уроки</p>
          </div>

          {/* Предстоящие записи */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Предстоящие занятия</h2>
            {upcomingBookings.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">У вас нет предстоящих записей</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <Card key={booking.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <User className="h-5 w-5" />
                            {booking.teacher_name}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-4 mt-2">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(booking.date)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {booking.time_slot}
                            </span>
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(booking.status)}
                          {booking.status === 'pending' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={canceling === booking.id}
                                >
                                  {canceling === booking.id ? (
                                    <Loader className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <X className="h-4 w-4" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Отменить запись?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Вы уверены, что хотите отменить запись на {formatDate(booking.date)} в {booking.time_slot}?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Нет</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => cancelBooking(booking.id)}>
                                    Да, отменить
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* История записей */}
          {pastBookings.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">История записей</h2>
              <div className="space-y-4">
                {pastBookings.map((booking) => (
                  <Card key={booking.id} className="opacity-75">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <User className="h-5 w-5" />
                            {booking.teacher_name}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-4 mt-2">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(booking.date)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {booking.time_slot}
                            </span>
                          </CardDescription>
                        </div>
                        {getStatusBadge(booking.status)}
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </main>
      <Footer />
    </motion.div>
  );
};

export default StudentBookings;