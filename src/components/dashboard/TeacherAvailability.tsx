
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { format, parse, startOfDay, addDays, isBefore } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader, CalendarDays, Clock } from 'lucide-react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

// Define standard time slots
const DEFAULT_TIME_SLOTS = [
  "09:00", "10:30", "12:00", "13:30", "15:00", "16:30", "18:00", "19:30"
];

interface TimeSlot {
  time: string;
  selected: boolean;
}

interface AvailabilityDay {
  date: string; // ISO format YYYY-MM-DD
  timeSlots: TimeSlot[];
}

export default function TeacherAvailability() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [availabilityData, setAvailabilityData] = useState<AvailabilityDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingDate, setSavingDate] = useState<string | null>(null);

  // Initialize form for time slots
  const form = useForm();
  
  useEffect(() => {
    if (user) {
      fetchTeacherAvailability();
    }
  }, [user]);

  const fetchTeacherAvailability = async () => {
    try {
      setLoading(true);
      
      // Fetch teacher's availability from Supabase
      const { data, error } = await supabase
        .from('teacher_availability')
        .select('*')
        .eq('teacher_id', user?.id);
        
      if (error) throw error;
      
      // Transform data to our format
      const availabilityMap = new Map<string, TimeSlot[]>();
      
      if (data && data.length > 0) {
        data.forEach(item => {
          if (!availabilityMap.has(item.date)) {
            availabilityMap.set(item.date, DEFAULT_TIME_SLOTS.map(time => ({
              time,
              selected: false
            })));
          }
          
          const slots = availabilityMap.get(item.date);
          const slotIndex = slots?.findIndex(slot => slot.time === item.time_slot);
          if (slotIndex !== undefined && slotIndex !== -1 && slots) {
            slots[slotIndex].selected = true;
          }
        });
        
        // Create array of selected dates for the calendar
        const dateObjects = Array.from(availabilityMap.keys()).map(dateStr => 
          parse(dateStr, 'yyyy-MM-dd', new Date())
        );
        setSelectedDates(dateObjects);
      }
      
      // Convert map to array
      const availabilityArray: AvailabilityDay[] = Array.from(availabilityMap).map(([date, timeSlots]) => ({
        date,
        timeSlots
      }));
      
      setAvailabilityData(availabilityArray);
      
    } catch (error) {
      console.error('Error fetching availability:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить данные доступности',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    setDate(date);
    const dateString = format(date, 'yyyy-MM-dd');
    
    // Check if date already exists in availabilityData
    const existingDateIndex = availabilityData.findIndex(d => d.date === dateString);
    
    if (existingDateIndex === -1) {
      // If date doesn't exist, add it with default time slots
      setAvailabilityData([...availabilityData, {
        date: dateString,
        timeSlots: DEFAULT_TIME_SLOTS.map(time => ({
          time,
          selected: false
        }))
      }]);
      
      // Add date to selectedDates for the calendar
      setSelectedDates([...selectedDates, date]);
    }
  };

  const handleTimeSlotToggle = (dateIndex: number, slotIndex: number) => {
    const newAvailabilityData = [...availabilityData];
    const currentValue = newAvailabilityData[dateIndex].timeSlots[slotIndex].selected;
    newAvailabilityData[dateIndex].timeSlots[slotIndex].selected = !currentValue;
    setAvailabilityData(newAvailabilityData);
  };

  const saveAvailability = async (dateStr: string) => {
    try {
      setSavingDate(dateStr);
      const dateIndex = availabilityData.findIndex(d => d.date === dateStr);
      
      if (dateIndex === -1) {
        throw new Error('Date not found in availability data');
      }
      
      const dayData = availabilityData[dateIndex];
      const selectedTimeSlots = dayData.timeSlots.filter(slot => slot.selected).map(slot => slot.time);
      
      // First, delete all existing entries for this date
      const { error: deleteError } = await supabase
        .from('teacher_availability')
        .delete()
        .eq('teacher_id', user?.id)
        .eq('date', dateStr);
        
      if (deleteError) throw deleteError;
      
      // Then insert new entries for each selected time slot
      if (selectedTimeSlots.length > 0) {
        const insertData = selectedTimeSlots.map(timeSlot => ({
          teacher_id: user?.id,
          date: dateStr,
          time_slot: timeSlot,
        }));
        
        const { error: insertError } = await supabase
          .from('teacher_availability')
          .insert(insertData);
          
        if (insertError) throw insertError;
      }
      
      toast({
        title: 'Сохранено',
        description: 'Расписание на ' + format(parse(dateStr, 'yyyy-MM-dd', new Date()), 'dd.MM.yyyy') + ' обновлено',
      });
      
    } catch (error) {
      console.error('Error saving availability:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить расписание',
        variant: 'destructive'
      });
    } finally {
      setSavingDate(null);
    }
  };

  const removeDate = async (dateStr: string) => {
    try {
      setSavingDate(dateStr);
      
      // Delete all entries for this date
      const { error } = await supabase
        .from('teacher_availability')
        .delete()
        .eq('teacher_id', user?.id)
        .eq('date', dateStr);
        
      if (error) throw error;
      
      // Remove date from availabilityData
      const newAvailabilityData = availabilityData.filter(d => d.date !== dateStr);
      setAvailabilityData(newAvailabilityData);
      
      // Remove date from selectedDates
      const newSelectedDates = selectedDates.filter(d => format(d, 'yyyy-MM-dd') !== dateStr);
      setSelectedDates(newSelectedDates);
      
      toast({
        title: 'Удалено',
        description: 'Дата ' + format(parse(dateStr, 'yyyy-MM-dd', new Date()), 'dd.MM.yyyy') + ' удалена из расписания',
      });
      
    } catch (error) {
      console.error('Error removing date:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить дату',
        variant: 'destructive'
      });
    } finally {
      setSavingDate(null);
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
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />
            <span>Управление расписанием</span>
          </CardTitle>
          <CardDescription>
            Выберите даты и время, когда вы доступны для проведения занятий
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-3">Выберите дату</h3>
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                className={cn("border rounded-md pointer-events-auto")}
                disabled={(date) => {
                  const yesterday = new Date();
                  yesterday.setDate(yesterday.getDate() - 1);
                  return isBefore(date, yesterday);
                }}
                modifiers={{
                  selected: selectedDates
                }}
              />
              <p className="text-sm text-gray-500 mt-2">
                Выберите дату, чтобы настроить доступное время для записи учеников
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-3">Ваше расписание</h3>
              {availabilityData.length === 0 ? (
                <div className="bg-gray-50 p-6 rounded-md text-center">
                  <p className="text-gray-600">У вас пока нет сохраненных дат в расписании</p>
                  <p className="text-gray-500 text-sm mt-2">Выберите дату в календаре слева, чтобы добавить расписание</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2">
                  {availabilityData.sort((a, b) => a.date.localeCompare(b.date)).map((day, dayIndex) => (
                    <motion.div
                      key={day.date}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border rounded-md p-4"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium">
                          {format(parse(day.date, 'yyyy-MM-dd', new Date()), 'dd.MM.yyyy, EEEE', { locale: ru })}
                        </h4>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => saveAvailability(day.date)}
                            disabled={savingDate === day.date}
                          >
                            {savingDate === day.date ? (
                              <Loader className="h-4 w-4 animate-spin mr-1" />
                            ) : null}
                            Сохранить
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => removeDate(day.date)}
                            disabled={savingDate === day.date}
                          >
                            Удалить
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {day.timeSlots.map((slot, slotIndex) => (
                          <div
                            key={slot.time}
                            className={cn(
                              "border rounded-md p-2 flex items-center justify-between cursor-pointer hover:bg-gray-50",
                              slot.selected && "bg-math-light border-math-secondary"
                            )}
                            onClick={() => handleTimeSlotToggle(dayIndex, slotIndex)}
                          >
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-2 text-math-secondary" />
                              <span>{slot.time}</span>
                            </div>
                            <Checkbox
                              checked={slot.selected}
                              onCheckedChange={() => handleTimeSlotToggle(dayIndex, slotIndex)}
                              className="pointer-events-none"
                            />
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
