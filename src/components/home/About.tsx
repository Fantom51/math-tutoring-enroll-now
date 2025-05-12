
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

const About = () => {
  return (
    <section id="about" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold text-math-primary mb-4">Обо мне</h2>
          <motion.div 
            className="w-24 h-1 bg-math-secondary mx-auto mb-6"
            initial={{ width: 0 }}
            whileInView={{ width: 96 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
          ></motion.div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Я профессиональный репетитор по математике с многолетним опытом преподавания.
            Моя цель — помочь вам или вашему ребенку преодолеть трудности в изучении математики.
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="aspect-square max-w-md mx-auto rounded-full overflow-hidden shadow-lg bg-gray-200">
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
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
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <motion.div 
                      className="text-4xl font-bold text-math-secondary mb-2"
                      initial={{ opacity: 0, scale: 0.5 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: 0.5 }}
                    >10+</motion.div>
                    <div className="text-gray-600">Лет преподавания</div>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.6 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <motion.div 
                      className="text-4xl font-bold text-math-secondary mb-2"
                      initial={{ opacity: 0, scale: 0.5 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: 0.7 }}
                    >200+</motion.div>
                    <div className="text-gray-600">Довольных учеников</div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default About;
