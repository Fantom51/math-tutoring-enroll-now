
import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <section className="bg-math-light pt-28 pb-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl lg:text-5xl font-bold text-math-primary mb-6">
              Преодолейте трудности математики вместе со мной
            </h1>
            <p className="text-lg text-gray-700 mb-8">
              Опытный репетитор по математике с индивидуальным подходом к каждому ученику. 
              Понятное объяснение сложного материала и гарантированный результат.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button 
                size="lg" 
                className="bg-math-secondary hover:bg-math-primary text-white transition-colors"
                onClick={() => document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Записаться на занятие
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-math-primary text-math-primary hover:bg-math-primary hover:text-white transition-colors"
                onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Узнать больше
              </Button>
            </div>
          </div>
          
          <div className="flex justify-center">
            <div className="w-full max-w-md bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-math-primary py-4 px-6 text-white text-center">
                <h2 className="text-xl font-semibold">Первая консультация бесплатно</h2>
              </div>
              <div className="p-6">
                <ul className="space-y-3 text-gray-700 mb-6">
                  <li className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-math-secondary mr-2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span>Индивидуальный подход к обучению</span>
                  </li>
                  <li className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-math-secondary mr-2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span>Подготовка к экзаменам</span>
                  </li>
                  <li className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-math-secondary mr-2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span>Помощь с домашними заданиями</span>
                  </li>
                  <li className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-math-secondary mr-2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span>Углубленное изучение математики</span>
                  </li>
                </ul>
                <Button 
                  className="w-full bg-math-secondary hover:bg-math-primary transition-colors"
                  onClick={() => document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Узнать расписание
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
