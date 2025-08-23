import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface EgeAnswerFormProps {
  isEge: boolean;
  onEgeChange: (isEge: boolean) => void;
  answers: string[];
  onAnswersChange: (answers: string[]) => void;
}

export default function EgeAnswerForm({ isEge, onEgeChange, answers, onAnswersChange }: EgeAnswerFormProps) {
  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    onAnswersChange(newAnswers);
  };

  const handleEgeToggle = (checked: boolean) => {
    onEgeChange(checked);
    if (checked && answers.length !== 12) {
      // Инициализируем массив из 12 пустых ответов
      onAnswersChange(new Array(12).fill(''));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="ege-checkbox"
          checked={isEge}
          onCheckedChange={handleEgeToggle}
        />
        <Label htmlFor="ege-checkbox" className="text-sm font-medium">
          Это задание относится к ЕГЭ
        </Label>
      </div>
      
      {isEge && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">Правильные ответы (12 заданий)</Label>
          <div className="max-h-[400px] overflow-y-auto p-4 border rounded-lg bg-gray-50">
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 12 }, (_, index) => (
                <div key={index} className="space-y-1">
                  <Label htmlFor={`ege-answer-${index}`} className="text-xs">
                    Задание {index + 1}
                  </Label>
                  <Input
                    id={`ege-answer-${index}`}
                    value={answers[index] || ''}
                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                    placeholder="Ответ"
                    className="text-sm"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}