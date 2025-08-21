
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CheatSheets from "./pages/CheatSheets";
import StudentProfile from "./pages/StudentProfile";
import StudentHomework from "./pages/StudentHomework";
import StudentBookings from "./pages/StudentBookings";
import TeacherStudents from "./pages/TeacherStudents";
import TeacherHomework from "./pages/TeacherHomework";
import TeacherCheatSheets from "./pages/TeacherCheatSheets";
import TeacherSchedule from "./pages/TeacherSchedule";
import Chat from "./components/chat/Chat";
import ChatList from "./components/chat/ChatList";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <BrowserRouter>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Защищенные маршруты */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/cheat-sheets" element={<CheatSheets />} />
                <Route path="/profile" element={<StudentProfile />} />
                <Route path="/homework" element={<StudentHomework />} />
                <Route path="/bookings" element={<StudentBookings />} />
                <Route path="/teacher/students" element={<TeacherStudents />} />
                <Route path="/teacher/homework" element={<TeacherHomework />} />
                <Route path="/teacher/cheatsheets" element={<TeacherCheatSheets />} />
                <Route path="/teacher/schedule" element={<TeacherSchedule />} />
                <Route path="/chat/:userId" element={<Chat />} />
                <Route path="/chats" element={<ChatList />} />
              </Route>
              
              {/* Страница не найдена */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AnimatePresence>
        </TooltipProvider>
      </BrowserRouter>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
