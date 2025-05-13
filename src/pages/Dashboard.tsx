
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import StudentDashboard from '@/components/dashboard/StudentDashboard';
import TeacherDashboard from '@/components/dashboard/TeacherDashboard';

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const userRole = user?.user_metadata?.role as 'student' | 'teacher' | undefined;

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-math-primary" />
      </div>
    );
  }

  if (!user) {
    return null; // будет редирект на страницу входа через useEffect
  }

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
        {userRole === 'teacher' ? (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-white p-6 rounded-lg shadow-sm"
          >
            <TeacherDashboard />
          </motion.div>
        ) : userRole === 'student' ? (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-white p-6 rounded-lg shadow-sm"
          >
            <StudentDashboard />
          </motion.div>
        ) : (
          <div className="text-center py-12">
            <p className="text-red-500">Роль пользователя не определена</p>
          </div>
        )}
      </main>
      <Footer />
    </motion.div>
  );
};

export default Dashboard;
