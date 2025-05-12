
import { Card, CardContent } from "@/components/ui/card";

const About = () => {
  return (
    <section id="about" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-math-primary mb-4">Обо мне</h2>
          <div className="w-24 h-1 bg-math-secondary mx-auto mb-6"></div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Я профессиональный репетитор по математике с многолетним опытом преподавания.
            Моя цель — помочь вам или вашему ребенку преодолеть трудности в изучении математики.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="aspect-square max-w-md mx-auto rounded-full overflow-hidden shadow-lg bg-gray-200">
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-2xl font-bold mb-6 text-gray-800">Иван Иванович Иванов</h3>
            <p className="text-gray-600 mb-6">
              Я закончил математический факультет МГУ им. М.В. Ломоносова с отличием и имею более 10 лет опыта в преподавании математики. 
              Работал в ведущих школах и образовательных центрах Москвы, а также подготовил более 200 учеников к успешной сдаче ОГЭ и ЕГЭ.
            </p>
            <p className="text-gray-600 mb-8">
              Мой подход к обучению сочетает фундаментальное понимание математики с практическими методами решения задач. 
              Я адаптирую программу обучения под каждого ученика, учитывая его индивидуальные особенности и цели.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-4xl font-bold text-math-secondary mb-2">10+</div>
                  <div className="text-gray-600">Лет преподавания</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-4xl font-bold text-math-secondary mb-2">200+</div>
                  <div className="text-gray-600">Довольных учеников</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
