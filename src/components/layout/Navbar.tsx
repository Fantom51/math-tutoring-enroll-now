
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
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

        <Button 
          variant="default" 
          className="bg-math-secondary hover:bg-math-primary hidden md:block transition-colors"
          onClick={() => document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' })}
        >
          Записаться
        </Button>

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
            <Button 
              variant="default" 
              className="bg-math-secondary hover:bg-math-primary mx-4 transition-colors"
              onClick={() => {
                document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
                toggleMenu();
              }}
            >
              Записаться
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
