import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Clock } from "lucide-react";
import { format, addDays } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Confetti from "@/components/ui/confetti";
import { motion, AnimatePresence } from "framer-motion";
import emailjs from 'emailjs-com';
import { supabase } from '@/lib/supabaseClient';

// Конфигурация EmailJS (ЗАМЕНИТЕ НА СВОИ ДАННЫЕ)
const EMAILJS_CONFIG = {
  SERVICE_ID: 'service_38km9pt',
  TEMPLATE_ID: 'template_3zl1enj',
  USER_ID: 'IQfUWwV4_-u1ntE-W',
  TO_EMAIL: 'sashabrawl46@gmail.com' // Ваша почта для получения заявок
};

const DEFAULT_TIME_SLOTS = [
  "09:00", "10:30", "12:00", "13:30", "15:00", "16:30", "18:00", "19:30"
];

const Booking = () => {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [timeSlot, setTimeSlot] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [bookedSlots, setBookedSlots] = useState<{[key: string]: string[]}>({});
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);

  // Fetch available dates and time slots from teacher's availability
  useEffect(() => {
    fetchTeacherAvailability();
    fetchBookedSlots();
  }, []);
  
  // Update available time slots whenever date changes
  useEffect(() => {
    updateAvailableTimeSlots();
  }, [date, bookedSlots]);

  const fetchTeacherAvailability = async () => {
    try {
      // Get all teacher availability entries
      const { data, error } = await supabase
        .from('teacher_availability')
        .select('*')
        .order('date', { ascending: true });
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Group by date
        const availabilityByDate = new Map();
        
        data.forEach(item => {
          if (!availabilityByDate.has(item.date)) {
            availabilityByDate.set(item.date, []);
          }
          availabilityByDate.get(item.date).push(item.time_slot);
        });
        
        // Convert dates to Date objects
        const dateObjects = Array.from(availabilityByDate.keys()).map(dateStr => 
          new Date(dateStr)
        );
        
        setAvailableDates(dateObjects);
      }
    } catch (error) {
      console.error('Error fetching teacher availability:', error);
    }
  };
  
  const fetchBookedSlots = async () => {
    try {
      // Get all booked slots
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true });
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Transform to the format we need
        const booked: {[key: string]: string[]} = {};
        
        data.forEach(item => {
          if (!booked[item.date]) {
            booked[item.date] = [];
          }
          booked[item.date].push(item.time_slot);
        });
        
        setBookedSlots(booked);
      }
    } catch (error) {
      console.error('Error fetching booked slots:', error);
    }
  };

  const validateForm = () => {
    const errors: string[] = [];
    const phoneRegex = /^(\+7|8)[\d\s()-]{9,}\d$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name.trim()) errors.push("Укажите ваше имя");
    if (!phoneRegex.test(phone)) errors.push("Неверный формат телефона");
    if (email && !emailRegex.test(email)) errors.push("Неверный формат email");
    if (!date) errors.push("Выберите дату занятия");
    if (!timeSlot) errors.push("Выберите время занятия");
    if (!subject) errors.push("Укажите предмет изучения");

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateForm();
    if (errors.length > 0) {
      toast({
        title: "Ошибка заполнения",
        description: errors.join('\n'),
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // First save the booking in the database
      if (date && timeSlot) {
        const formattedDate = format(date, 'yyyy-MM-dd');
        const { error: bookingError } = await supabase
          .from('bookings')
          .insert([
            {
              name,
              phone,
              email: email || null,
              subject,
              message: message || null,
              date: formattedDate,
              time_slot: timeSlot,
              status: 'pending'
            }
          ]);
          
        if (bookingError) throw bookingError;
        
        // Update booked slots
        setBookedSlots(prev => {
          const newBookedSlots = { ...prev };
          if (!newBookedSlots[formattedDate]) {
            newBookedSlots[formattedDate] = [];
          }
          newBookedSlots[formattedDate].push(timeSlot);
          return newBookedSlots;
        });
      }
      
      // Then send email notification
      const templateParams = {
        name,
        phone,
        email: email || 'Не указан',
        subject,
        message: message || 'Не указано',
        date: date ? format(date, 'dd.MM.yyyy') : 'Не указана',
        timeSlot,
        to_email: EMAILJS_CONFIG.TO_EMAIL
      };

      await emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATE_ID,
        templateParams,
        EMAILJS_CONFIG.USER_ID
      );

      setShowConfetti(true);
      setShowSuccess(true);

      toast({
        title: "Заявка отправлена!",
        description: "Мы свяжемся с вами в ближайшее время для подтверждения записи."
      });

      setTimeout(() => {
        setName("");
        setPhone("");
        setEmail("");
        setSubject("");
        setMessage("");
        setDate(undefined);
        setTimeSlot(undefined);
        setShowSuccess(false);
      }, 3000);

    } catch (error) {
      console.error('Ошибка отправки:', error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при отправке формы. Попробуйте еще раз.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setTimeout(() => setShowConfetti(false), 5000);
    }
  };

  const updateAvailableTimeSlots = () => {
    if (!date) {
      setAvailableTimeSlots([]);
      return;
    }

    const dateString = format(date, "yyyy-MM-dd");
    
    // Get booked slots for this date
    const booked = bookedSlots[dateString] || [];

    // For now, just use the default time slots and filter out booked ones
    // In a real implementation, we would fetch the available slots from the database
    const slots = DEFAULT_TIME_SLOTS.filter(slot => !booked.includes(slot));
    setAvailableTimeSlots(slots);
    
    // Also try to fetch from database if available
    supabase
      .from('teacher_availability')
      .select('time_slot')
      .eq('date', dateString)
      .then(response => {
        if (response.data && response.data.length > 0) {
          const dbSlots = response.data.map(item => item.time_slot);
          // Filter out booked slots
          const availableSlots = dbSlots.filter(slot => !booked.includes(slot));
          setAvailableTimeSlots(availableSlots);
        }
      })
      .then(undefined, (error) => {
        console.error('Error fetching available time slots:', error);
      });
  };

  return (
    <section id="booking" className="py-20 bg-white relative overflow-hidden">
      <Confetti isActive={showConfetti} />

      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-math-primary mb-4">Запись на занятия</h2>
          <div className="w-24 h-1 bg-math-secondary mx-auto mb-6"></div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Заполните форму ниже, чтобы записаться на занятие или получить дополнительную информацию.
            Я свяжусь с вами в течение 24 часов.
          </p>
        </div>

        <AnimatePresence>
          {showSuccess ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="max-w-md mx-auto p-8 bg-math-light rounded-lg shadow-lg mb-12 border-2 border-math-secondary"
            >
              <motion.div
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
              >
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    className="w-20 h-20 rounded-full bg-math-secondary flex items-center justify-center mx-auto mb-4"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>

                  <motion.h3
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-xl font-bold text-math-primary"
                  >
                    Заявка успешно отправлена!
                  </motion.h3>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-2 text-gray-600"
                  >
                    Спасибо за запись! Мы свяжемся с вами в ближайшее время.
                  </motion.p>
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-5xl mx-auto"
            >
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Ваше имя*
                    </label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Введите ваше имя"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Телефон*
                    </label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+7 (___) ___-__-__"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@mail.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                      Предмет*
                    </label>
                    <Select value={subject} onValueChange={setSubject} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите предмет" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="school">Школьная математика</SelectItem>
                        <SelectItem value="oge">Подготовка к ОГЭ</SelectItem>
                        <SelectItem value="ege">Подготовка к ЕГЭ</SelectItem>
                        <SelectItem value="olympiad">Олимпиадная математика</SelectItem>
                        <SelectItem value="university">Высшая математика</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                      Сообщение
                    </label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Опишите ваши цели или задайте вопросы..."
                      className="h-[120px]"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Выберите дату и время занятия*
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="date"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "PPP") : <span>Выберите дату</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                          disabled={(date) => {
                            // Disable dates that are not in availableDates
                            const dateStr = format(date, 'yyyy-MM-dd');
                            return !availableDates.some(d => 
                              format(d, 'yyyy-MM-dd') === dateStr
                            );
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Доступное время
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {availableTimeSlots.length > 0 ? (
                        availableTimeSlots.map((slot) => (
                          <motion.div
                            key={slot}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Card
                              className={cn(
                                "cursor-pointer hover:border-math-secondary transition-colors",
                                timeSlot === slot
                                  ? "border-2 border-math-secondary bg-math-light"
                                  : "border border-gray-200"
                              )}
                              onClick={() => setTimeSlot(slot)}
                            >
                              <CardContent className="flex items-center justify-center py-3 px-2">
                                <Clock className="h-4 w-4 mr-2 text-math-secondary" />
                                <span>{slot}</span>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))
                      ) : (
                        <p className="col-span-4 text-center text-gray-500">
                          {date
                            ? "Нет доступного времени на выбранную дату"
                            : "Пожалуйста, выберите дату для просмотра доступного времени"}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-6">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        type="submit"
                        className="w-full bg-math-secondary hover:bg-math-primary transition-colors"
                        disabled={loading || !date || !timeSlot}
                      >
                        {loading ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Отправка...
                          </span>
                        ) : (
                          "Отправить заявку"
                        )}
                      </Button>
                    </motion.div>

                    <p className="text-xs text-gray-500 mt-2">
                      Нажимая кнопку "Отправить заявку", вы соглашаетесь с обработкой персональных данных
                      в соответствии с политикой конфиденциальности.
                    </p>
                  </div>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default Booking;
