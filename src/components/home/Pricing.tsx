
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

const Pricing = () => {
  const pricingPlans = [
    {
      name: "Стандартный",
      price: "1200₽",
      duration: "за 60 минут",
      description: "Индивидуальные занятия для школьников",
      features: [
        "Работа с текущей школьной программой",
        "Подготовка к контрольным работам",
        "Помощь с домашними заданиями",
        "Разбор сложных тем",
      ],
      highlighted: false,
    },
    {
      name: "ОГЭ/ЕГЭ",
      price: "1500₽",
      duration: "за 90 минут",
      description: "Интенсивная подготовка к экзаменам",
      features: [
        "Глубокая проработка всех тем",
        "Решение типовых заданий ОГЭ/ЕГЭ",
        "Система тестирования и отслеживания прогресса",
        "Доступ к дополнительным материалам",
        "Стратегии выполнения экзаменационных работ",
      ],
      highlighted: true,
    },
    {
      name: "Высшая математика",
      price: "1800₽",
      duration: "за 90 минут",
      description: "Для студентов вузов",
      features: [
        "Подготовка к сессиям и экзаменам",
        "Помощь с курсовыми работами",
        "Разбор сложных разделов",
        "Подготовка к контрольным работам",
      ],
      highlighted: false,
    },
  ];

  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold text-math-primary mb-4">Стоимость занятий</h2>
          <motion.div 
            className="w-24 h-1 bg-math-secondary mx-auto mb-6"
            initial={{ width: 0 }}
            whileInView={{ width: 96 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
          ></motion.div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Прозрачная система оплаты без скрытых платежей. Возможна оплата как отдельных занятий,
            так и пакетов занятий со скидкой.
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 * index }}
              whileHover={{ y: -10 }}
            >
              <Card className={`h-full ${plan.highlighted ? 'border-math-secondary shadow-lg relative' : ''}`}>
                {plan.highlighted && (
                  <motion.div 
                    className="absolute -top-4 left-0 right-0 flex justify-center"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.3 }}
                  >
                    <span className="bg-math-secondary text-white text-sm font-semibold py-1 px-3 rounded-full">
                      Популярный выбор
                    </span>
                  </motion.div>
                )}
                <CardHeader>
                  <CardTitle className="text-xl text-math-primary">{plan.name}</CardTitle>
                  <CardDescription>
                    <motion.div 
                      className="mt-2"
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + 0.1 * index, duration: 0.5 }}
                    >
                      <span className="text-3xl font-bold text-gray-800">{plan.price}</span>
                      <span className="text-gray-500 ml-1">{plan.duration}</span>
                    </motion.div>
                    <p className="mt-2 text-gray-600">{plan.description}</p>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.features.map((feature, i) => (
                      <motion.li 
                        key={i} 
                        className="flex items-start"
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 + (0.05 * i) + (0.1 * index), duration: 0.3 }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-math-secondary mr-2 mt-1">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        <span className="text-gray-600">{feature}</span>
                      </motion.li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <motion.div
                    className="w-full"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button 
                      className={`w-full ${plan.highlighted ? 'bg-math-secondary hover:bg-math-primary' : 'bg-gray-100 text-math-primary hover:bg-gray-200'}`}
                      variant={plan.highlighted ? "default" : "outline"}
                      onClick={() => document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                      Записаться
                    </Button>
                  </motion.div>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
        
        <motion.div 
          className="mt-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <p className="text-gray-600 mb-6">
            Также доступны групповые занятия и специальные предложения для постоянных клиентов.
            Свяжитесь со мной для получения более подробной информации.
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              variant="outline" 
              className="border-math-primary text-math-primary hover:bg-math-primary hover:text-white transition-colors"
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Узнать подробнее
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Pricing;
