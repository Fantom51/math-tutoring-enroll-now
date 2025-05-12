
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
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

const timeSlots = [
  "09:00", "10:30", "12:00", "13:30", "15:00", "16:30", "18:00", "19:30"
];

// Simulate booked slots - in a real app, these would come from a database
const bookedSlots = {
  "2025-05-15": ["09:00", "12:00", "16:30"],
  "2025-05-16": ["10:30", "15:00"],
  "2025-05-20": ["09:00", "10:30", "13:30", "18:00"],
};

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date || !timeSlot) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, выберите дату и время занятия.",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Заявка отправлена!",
        description: "Мы свяжемся с вами в ближайшее время для подтверждения записи."
      });
      
      // Reset form
      setName("");
      setPhone("");
      setEmail("");
      setSubject("");
      setMessage("");
      setDate(undefined);
      setTimeSlot(undefined);
    }, 1000);
  };

  const getAvailableTimeSlots = () => {
    if (!date) return timeSlots;
    
    const dateString = format(date, "yyyy-MM-dd");
    const booked = bookedSlots[dateString] || [];
    
    return timeSlots.filter(slot => !booked.includes(slot));
  };

  const availableTimeSlots = getAvailableTimeSlots();

  return (
    <section id="booking" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-math-primary mb-4">Запись на занятия</h2>
          <div className="w-24 h-1 bg-math-secondary mx-auto mb-6"></div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Заполните форму ниже, чтобы записаться на занятие или получить дополнительную информацию.
            Я свяжусь с вами в течение 24 часов.
          </p>
        </div>
        
        <div className="max-w-5xl mx-auto">
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
                        const now = new Date();
                        const yesterday = new Date(now);
                        yesterday.setDate(yesterday.getDate() - 1);
                        return date < yesterday;
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
                      <Card
                        key={slot}
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
                <Button
                  type="submit"
                  className="w-full bg-math-secondary hover:bg-math-primary transition-colors"
                  disabled={loading || !date || !timeSlot}
                >
                  {loading ? "Отправка..." : "Отправить заявку"}
                </Button>

                <p className="text-xs text-gray-500 mt-2">
                  Нажимая кнопку "Отправить заявку", вы соглашаетесь с обработкой персональных данных
                  в соответствии с политикой конфиденциальности.
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Booking;
