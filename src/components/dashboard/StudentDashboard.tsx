import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, BookOpen, Calendar, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function StudentDashboard() {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Панель студента</h1>
        <p className="text-gray-600">Добро пожаловать в личный кабинет</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link to="/profile" className="block">
          <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="text-center">
              <User className="h-12 w-12 mx-auto text-blue-600 mb-4" />
              <CardTitle>Профиль</CardTitle>
              <CardDescription>
                Управление личными данными
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link to="/cheat-sheets" className="block">
          <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="text-center">
              <BookOpen className="h-12 w-12 mx-auto text-green-600 mb-4" />
              <CardTitle>Шпаргалки</CardTitle>
              <CardDescription>
                Материалы от преподавателей
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link to="/homework" className="block">
          <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="text-center">
              <FileText className="h-12 w-12 mx-auto text-orange-600 mb-4" />
              <CardTitle>Домашние задания</CardTitle>
              <CardDescription>
                Выполнение и сдача заданий
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link to="/bookings" className="block">
          <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="text-center">
              <Calendar className="h-12 w-12 mx-auto text-purple-600 mb-4" />
              <CardTitle>Записи</CardTitle>
              <CardDescription>
                Управление записями на занятия
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </motion.div>
  );
}