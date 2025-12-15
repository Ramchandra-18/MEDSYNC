import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUserShield,
  FaClock,
  FaSyncAlt,
  FaLock,
  FaMobileAlt,
  FaUserMd,
} from "react-icons/fa";
import Header from '../Components/Header';
import Footer from "../Components/Footer";
import { motion } from "framer-motion";

const services = [
  {
    Icon: FaUserShield,
    title: "Patient Privacy First",
    description:
      "Your health records are secured with blockchain technology—privacy and integrity guaranteed.",
    color: "text-blue-600",
  },
  {
    Icon: FaClock,
    title: "24/7 Accessible",
    description: "Access appointments, prescriptions, and records anytime, anywhere.",
    color: "text-teal-500",
  },
  {
    Icon: FaSyncAlt,
    title: "Seamless Coordination",
    description:
      "Doctors, staff, and patients connect in real time for stress-free interactions and care.",
    color: "text-green-500",
  },
  {
    Icon: FaLock,
    title: "Transparent & Secure",
    description: "Every action is auditable. No hidden surprises—just reliable, secure workflows.",
    color: "text-purple-500",
  },
  {
    Icon: FaMobileAlt,
    title: "Mobile Friendly",
    description: "Book appointments, view results, or check bills easily from your phone or tablet.",
    color: "text-pink-500",
  },
  {
    Icon: FaUserMd,
    title: "Expert Medical Staff",
    description: "Our team is highly qualified and committed to top-quality patient care—every day.",
    color: "text-indigo-600",
  },
];

const fadeUpVariant = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 1) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.2, duration: 0.7, ease: "easeOut" },
  }),
};

const Home = () => {
  const navigate = useNavigate();

  return (
    
    <div className="h-screen w-screen bg-gradient-to-br from-white via-blue-50 to-blue-100 font-sans overflow-x-hidden flex flex-col">
      {/* Main Content */}
      <>
      <Header />
    </>
      <main className="flex-grow p-20">
        <motion.h1
          initial="hidden"
          animate="visible"
          variants={fadeUpVariant}
          custom={5}
          className="text-5xl font-bold mb-9 text-black text-left"
        >
          Welcome to MedSync <br />
          Your Partner in Health <br /> and Wealth
        </motion.h1>

        <motion.p
          initial="hidden"
          animate="visible"
          variants={fadeUpVariant}
          custom={3}
          className="text-xl text-black max-w-2xl mb-5 text-left px-4 md:px-0"
        >
          MedSync Hospital is committed to delivering world-class healthcare
          through cutting-edge technology, experienced professionals, and
          uncompromised patient care. Our goal is to synchronize medical
          expertise, innovation, and compassion to ensure the best possible
          outcomes for our patients.
        </motion.p>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUpVariant}
          custom={5}
          className="max-w-3xl mx-auto text-center mb-6"
        >
          <button
            onClick={() => navigate("/register")}
            className="bg-gradient-to-r from-blue-600 via-blue-500 to-sky-400 text-white hover:bg-green-600 hover:text-gray-800 text-white flex items-center justify-center px-6 rounded-lg font-semibold shadow-md transition"
          >
            Register Now!!
          </button>
          <p className="mt-2 text-gray-500 italic mb-10 text-left">
            (Your health, our priority 😊.)
          </p>
        </motion.div>

        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUpVariant}
          className="text-2xl font-bold text-blue-800 mb-4 text-center"
        >
          Our Healthcare Services
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          {services.map(({ Icon, title, description, color }, idx) => (
            <motion.div
              key={idx}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              custom={idx + 3}
              variants={fadeUpVariant}
              className="bg-blue-50 rounded-xl shadow-md p-6 hover:shadow-lg transition text-center"
            >
              <Icon className={`${color} text-4xl mx-auto mb-3`} />
              <h3 className="text-xl font-bold text-blue-800 mb-2">{title}</h3>
              <p className="text-gray-600">{description}</p>
            </motion.div>
          ))}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Home;
