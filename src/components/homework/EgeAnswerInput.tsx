import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';

interface EgeAnswerInputProps {
  isOpen: boolean;
  onClose: () => void;
  teacherAnswers: string[];
  onSubmit: (answers: string[]) => void;
  homeworkTitle: string;
  existingAnswers?: string[];
  existingScore?: number;
}

export default function EgeAnswerInput({ 
  isOpen, 
  onClose, 
  teacherAnswers, 
  onSubmit, 
  homeworkTitle,
  existingAnswers = [],
  existingScore 
}: EgeAnswerInputProps) {
  const [answers, setAnswers] = useState<string[]>(
    existingAnswers.length === 12 ? existingAnswers : new Array(12).fill('')
  );
  const [showResults, setShowResults] = useState(existingAnswers.length === 12);

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const handleSubmit = () => {
    const filledAnswers = answers.map(answer => answer.trim());
    onSubmit(filledAnswers);
    setShowResults(true);
  };

  const calculateScore = () => {
    return answers.reduce((score, answer, index) => {
      return score + (answer.trim().toLowerCase() === teacherAnswers[index]?.toLowerCase() ? 1 : 0);
    }, 0);
  };

  const getResultColor = (userAnswer: string, correctAnswer: string) => {
    return userAnswer.trim().toLowerCase() === correctAnswer?.toLowerCase() 
      ? 'text-green-600' 
      : 'text-red-600';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ответы ЕГЭ: {homeworkTitle}</DialogTitle>
          <DialogDescription>
            {showResults ? 'Результаты проверки' : 'Введите ответы на 12 заданий'}
          </DialogDescription>
        </DialogHeader>
        
        {showResults ? (
          <div className="space-y-4">
            <div className="text-center">
              <Badge variant="outline" className="text-lg p-2">
                Результат: {existingScore ?? calculateScore()}/12
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {answers.map((answer, index) => (
                <div key={index} className="space-y-1">
                  <Label>Задание {index + 1}</Label>
                  <div className="space-y-1">
                    <div className="text-sm">
                      <span className="text-gray-600">Ваш ответ: </span>
                      <span className={getResultColor(answer, teacherAnswers[index])}>
                        {answer || 'Не заполнено'}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Правильный: </span>
                      <span className="text-green-600">{teacherAnswers[index]}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end">
              <Button onClick={onClose}>Закрыть</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {answers.map((answer, index) => (
                <div key={index} className="space-y-1">
                  <Label htmlFor={`answer-${index}`}>Задание {index + 1}</Label>
                  <Input
                    id={`answer-${index}`}
                    value={answer}
                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                    placeholder="Введите ответ"
                  />
                </div>
              ))}
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>Отмена</Button>
              <Button onClick={handleSubmit}>
                Отправить ответы
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}