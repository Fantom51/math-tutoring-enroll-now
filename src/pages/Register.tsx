
import { motion } from "framer-motion";
import SignUpForm from "@/components/auth/SignUpForm";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const Register = () => {
  return (
    <motion.div
      className="min-h-screen bg-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto flex flex-col items-center justify-center px-4">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <SignUpForm />
          </motion.div>
        </div>
      </main>
      <Footer />
    </motion.div>
  );
};

export default Register;
