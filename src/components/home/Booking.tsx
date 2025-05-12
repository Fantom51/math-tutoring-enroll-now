
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const Booking = () => {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
    }, 1000);
  };

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
        
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Сообщение
                </label>
                <Textarea 
                  id="message" 
                  value={message} 
                  onChange={(e) => setMessage(e.target.value)} 
                  placeholder="Опишите ваши цели или задайте вопросы..." 
                  className="h-40"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-math-secondary hover:bg-math-primary transition-colors"
                disabled={loading}
              >
                {loading ? "Отправка..." : "Отправить заявку"}
              </Button>
              
              <p className="text-xs text-gray-500 mt-2">
                Нажимая кнопку "Отправить заявку", вы соглашаетесь с обработкой персональных данных
                в соответствии с политикой конфиденциальности.
              </p>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Booking;
