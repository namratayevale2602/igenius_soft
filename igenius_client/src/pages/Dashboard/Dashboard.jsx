import { motion } from "framer-motion";
import {
  ArrowRight,
  Brain,
  Award,
  Users,
  BookOpen,
  Globe,
  Shield,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  const handleRedirect = () => {
    navigate("/levels");
  };

  return (
    <div>
      {/* Main Hero Section */}
      <main className="container mx-auto px-4 py-12 md:py-20">
        {/* Center Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto"
        >
          {/* Branding */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
              Welcome to I-Genius Abacus
            </h1>
            <p className="text-lg md:text-xl text-gray-700 mb-2">
              Academy India PVT. LTD
            </p>
          </div>

          {/* Main Tagline */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mb-12"
          >
            <div className="inline-block px-6 py-3 bg-linear-to-r from-yellow-400 to-orange-500 rounded-full mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                The New Generation Learning Technology
              </h2>
            </div>
          </motion.div>

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mb-16"
          >
            <h3 className="text-2xl md:text-4xl font-bold text-gray-800 mb-6">
              Let's Join No.1 Abacus Mental Arithmetic
              <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-green-600 to-teal-500">
                Online Examination Platform
              </span>
            </h3>
            <div className="flex items-center justify-center mb-6">
              <BookOpen className="w-12 h-12 text-pink-500 mr-4" />
              <h3 className="text-3xl md:text-4xl font-bold text-purple-500">
                ABACUS DICTATION PROGRAM
              </h3>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRedirect}
              className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-linear-to-r from-blue-500 to-purple-600 rounded-full hover:shadow-2xl transition-all duration-300 overflow-hidden"
            >
              <span className="relative z-10 flex items-center">
                Start Now
                <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-2 transition-transform" />
              </span>
              <motion.div
                className="absolute inset-0 bg-linear-to-r from-purple-600 to-blue-500"
                initial={{ x: "-100%" }}
                whileHover={{ x: 0 }}
                transition={{ duration: 0.3 }}
              />
            </motion.button>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
