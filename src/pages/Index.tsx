
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import About from "@/components/home/About";
import Services from "@/components/home/Services";
import Pricing from "@/components/home/Pricing";
import Testimonials from "@/components/home/Testimonials";
import Booking from "@/components/home/Booking";
import { motion } from "framer-motion";

const Index = () => {
  return (
    <motion.div 
      className="min-h-screen bg-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Navbar />
      <main>
        <Hero />
        <About />
        <Services />
        <Pricing />
        <Testimonials />
        <Booking />
      </main>
      <Footer />
    </motion.div>
  );
};

export default Index;
