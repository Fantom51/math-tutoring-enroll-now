import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen, Calendar, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TeacherDashboard() {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Панель преподавателя</h1>
        <p className="text-gray-600">Добро пожаловать в личный кабинет</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link to="/teacher/students" className="block">
          <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="text-center">
              <Users className="h-12 w-12 mx-auto text-blue-600 mb-4" />
              <CardTitle>Ученики</CardTitle>
              <CardDescription>
                Управление списком учеников
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link to="/teacher/homework" className="block">
          <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="text-center">
              <BookOpen className="h-12 w-12 mx-auto text-green-600 mb-4" />
              <CardTitle>Домашние задания</CardTitle>
              <CardDescription>
                Создание и управление заданиями
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link to="/teacher/cheatsheets" className="block">
          <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="text-center">
              <FileText className="h-12 w-12 mx-auto text-orange-600 mb-4" />
              <CardTitle>Шпаргалки</CardTitle>
              <CardDescription>
                Материалы для учеников
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link to="/teacher/schedule" className="block">
          <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="text-center">
              <Calendar className="h-12 w-12 mx-auto text-purple-600 mb-4" />
              <CardTitle>Расписание</CardTitle>
              <CardDescription>
                Управление расписанием и записями
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </motion.div>
  );
}