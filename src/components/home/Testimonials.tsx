
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

const Testimonials = () => {
  const testimonials = [
    {
      name: "Анна Смирнова",
      role: "Мама ученика 9 класса",
      content: "Иван Иванович — невероятно терпеливый и знающий преподаватель. Мой сын всегда испытывал трудности с математикой, но после занятий с Иваном Ивановичем его оценки значительно улучшились, и он даже начал проявлять интерес к предмету!",
    },
    {
      name: "Дмитрий Петров",
      role: "Выпускник, сдал ЕГЭ на 92 балла",
      content: "Благодаря Ивану Ивановичу я смог поступить в один из ведущих технических вузов страны. Его методика объяснения сложных концепций через простые примеры помогла мне не только подготовиться к экзамену, но и действительно понять математику.",
    },
    {
      name: "Ольга Кузнецова",
      role: "Студентка 2 курса",
      content: "Когда я почти отчаялась понять высшую математику, мне посоветовали обратиться к Ивану Ивановичу. Он буквально спас мою сессию! Объясняет очень понятно и всегда готов ответить на дополнительные вопросы.",
    },
    {
      name: "Сергей Иванов",
      role: "Отец ученицы 11 класса",
      content: "Наша дочь занимается с Иваном Ивановичем уже второй год. Результат превзошел все ожидания: она не только стала отличницей по математике, но и победила в городской олимпиаде. Рекомендую этого репетитора всем!",
    },
    {
      name: "Екатерина Васильева",
      role: "Ученица 10 класса",
      content: "Занятия с Иваном Ивановичем всегда интересные и увлекательные. Он умеет объяснить даже самые сложные темы так, что всё становится понятным. Благодаря ему математика стала моим любимым предметом.",
    },
    {
      name: "Михаил Николаев",
      role: "Выпускник, победитель олимпиад",
      content: "Иван Иванович не просто готовит к экзаменам — он учит мыслить математически и находить нестандартные решения. Именно благодаря его подходу я смог успешно выступить на нескольких региональных олимпиадах.",
    },
  ];

  return (
    <section id="testimonials" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold text-math-primary mb-4">Отзывы моих учеников</h2>
          <motion.div 
            className="w-24 h-1 bg-math-secondary mx-auto mb-6"
            initial={{ width: 0 }}
            whileInView={{ width: 96 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
          ></motion.div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Узнайте, что говорят о моих занятиях ученики и их родители. За годы преподавания я помог сотням студентов достичь их учебных целей.
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              whileHover={{ y: -10, transition: { duration: 0.2 } }}
            >
              <Card className="bg-white h-full hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <motion.div 
                      className="h-10 w-10 rounded-full bg-math-light text-math-primary flex items-center justify-center"
                      whileHover={{ scale: 1.1 }}
                    >
                      {testimonial.name.charAt(0)}
                    </motion.div>
                    <div className="ml-4">
                      <h4 className="font-semibold text-gray-800">{testimonial.name}</h4>
                      <p className="text-sm text-gray-500">{testimonial.role}</p>
                    </div>
                  </div>
                  <motion.div 
                    className="mb-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + 0.05 * index, duration: 0.5 }}
                  >
                    {[1, 2, 3, 4, 5].map((star, i) => (
                      <motion.svg
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: [0, 1.2, 1] }}
                        transition={{ delay: 0.4 + (0.1 * i) + (0.05 * index), duration: 0.4 }}
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="#FFD700"
                        stroke="#FFD700"
                        strokeWidth="1"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="inline-block mr-1"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </motion.svg>
                    ))}
                  </motion.div>
                  <motion.p 
                    className="text-gray-600 italic"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 + 0.05 * index, duration: 0.5 }}
                  >
                    {testimonial.content}
                  </motion.p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
