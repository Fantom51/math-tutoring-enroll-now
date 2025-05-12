
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import About from "@/components/home/About";
import Services from "@/components/home/Services";
import Pricing from "@/components/home/Pricing";
import Testimonials from "@/components/home/Testimonials";
import Booking from "@/components/home/Booking";

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
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
    </div>
  );
};

export default Index;
