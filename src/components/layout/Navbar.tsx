
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from '@/contexts/AuthContext';
import { User, LogOut } from "lucide-react";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/';
  };

  return (
    <nav className="bg-white shadow-sm py-4 fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <span className="text-math-primary font-bold text-2xl">МатПрофи</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex space-x-6">
          <a href="#about" className="text-gray-700 hover:text-math-primary transition-colors">
            Обо мне
          </a>
          <a href="#services" className="text-gray-700 hover:text-math-primary transition-colors">
            Услуги
          </a>
          <a href="#pricing" className="text-gray-700 hover:text-math-primary transition-colors">
            Цены
          </a>
          <a href="#testimonials" className="text-gray-700 hover:text-math-primary transition-colors">
            Отзывы
          </a>
          <a href="#contact" className="text-gray-700 hover:text-math-primary transition-colors">
            Контакты
          </a>
        </div>

        <div className="hidden md:flex items-center space-x-4">
          {user ? (
            <>
              <Link to="/dashboard">
                <Button variant="outline" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Личный кабинет</span>
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                onClick={handleLogout}
                className="flex items-center space-x-2 text-red-500 hover:text-red-700"
              >
                <LogOut className="h-4 w-4" />
                <span>Выйти</span>
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="outline">
                  Войти
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="default" className="bg-math-secondary hover:bg-math-primary transition-colors">
                  Регистрация
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden text-gray-700" onClick={toggleMenu}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isMenuOpen ? (
              <path d="M18 6 6 18 M6 6 18 18" />
            ) : (
              <path d="M3 12h18M3 6h18M3 18h18" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t mt-4 animate-fade-in">
          <div className="container mx-auto py-4 flex flex-col space-y-4">
            <a href="#about" className="text-gray-700 hover:text-math-primary px-4 py-2" onClick={toggleMenu}>
              Обо мне
            </a>
            <a href="#services" className="text-gray-700 hover:text-math-primary px-4 py-2" onClick={toggleMenu}>
              Услуги
            </a>
            <a href="#pricing" className="text-gray-700 hover:text-math-primary px-4 py-2" onClick={toggleMenu}>
              Цены
            </a>
            <a href="#testimonials" className="text-gray-700 hover:text-math-primary px-4 py-2" onClick={toggleMenu}>
              Отзывы
            </a>
            <a href="#contact" className="text-gray-700 hover:text-math-primary px-4 py-2" onClick={toggleMenu}>
              Контакты
            </a>
            
            {user ? (
              <>
                <Link to="/dashboard" className="text-gray-700 hover:text-math-primary px-4 py-2" onClick={toggleMenu}>
                  Личный кабинет
                </Link>
                <Button 
                  variant="ghost" 
                  onClick={handleLogout}
                  className="flex items-center space-x-2 text-red-500 hover:text-red-700 mx-4"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Выйти</span>
                </Button>
              </>
            ) : (
              <div className="flex flex-col space-y-2 px-4">
                <Link to="/login" onClick={toggleMenu}>
                  <Button variant="outline" className="w-full">
                    Войти
                  </Button>
                </Link>
                <Link to="/register" onClick={toggleMenu}>
                  <Button variant="default" className="w-full bg-math-secondary hover:bg-math-primary">
                    Регистрация
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
