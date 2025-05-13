
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles?: ('student' | 'teacher')[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  // Показываем загрузку, если статус авторизации еще не определен
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-math-primary" />
      </div>
    );
  }

  // Если пользователь не авторизован, перенаправляем на страницу входа
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Если указаны разрешенные роли, проверяем роль пользователя
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user.user_metadata?.role as 'student' | 'teacher' | undefined;
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Если все проверки пройдены, отображаем защищенный контент
  return <Outlet />;
}
