
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const Hero = () => {
  return (
    <section className="bg-math-light pt-28 pb-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            className="text-center lg:text-left"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.h1 
              className="text-4xl lg:text-5xl font-bold text-math-primary mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              Преодолейте трудности математики вместе со мной
            </motion.h1>
            <motion.p 
              className="text-lg text-gray-700 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              Опытный репетитор по математике с индивидуальным подходом к каждому ученику. 
              Понятное объяснение сложного материала и гарантированный результат.
            </motion.p>
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  size="lg" 
                  className="bg-math-secondary hover:bg-math-primary text-white transition-colors"
                  onClick={() => document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Записаться на занятие
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-math-primary text-math-primary hover:bg-math-primary hover:text-white transition-colors"
                  onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Узнать больше
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
          
          <motion.div 
            className="flex justify-center"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="w-full max-w-md bg-white rounded-lg shadow-lg overflow-hidden">
              <motion.div 
                className="bg-math-primary py-4 px-6 text-white text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
              >
                <h2 className="text-xl font-semibold">Первая консультация бесплатно</h2>
              </motion.div>
              <div className="p-6">
                <motion.ul 
                  className="space-y-3 text-gray-700 mb-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                >
                  {[
                    "Индивидуальный подход к обучению",
                    "Подготовка к экзаменам",
                    "Помощь с домашними заданиями",
                    "Углубленное изучение математики"
                  ].map((item, index) => (
                    <motion.li 
                      key={index}
                      className="flex items-center"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-math-secondary mr-2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <span>{item}</span>
                    </motion.li>
                  ))}
                </motion.ul>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2, duration: 0.6 }}
                >
                  <Button 
                    className="w-full bg-math-secondary hover:bg-math-primary transition-colors"
                    onClick={() => document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    Узнать расписание
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
