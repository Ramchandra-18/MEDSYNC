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
import Header from "../Components/Header";
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
    description:
      "Every action is auditable. No hidden surprises—just reliable, secure workflows.",
    color: "text-purple-500",
  },
  {
    Icon: FaMobileAlt,
    title: "Mobile Friendly",
    description:
      "Book appointments, view results, or check bills easily from your phone or tablet.",
    color: "text-pink-500",
  },
  {
    Icon: FaUserMd,
    title: "Expert Medical Staff",
    description:
      "Our team is highly qualified and committed to top-quality patient care—every day.",
    color: "text-indigo-600",
  },
];

const fadeUpVariant = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 1) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: "easeOut" },
  }),
};

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-sky-50 via-slate-50 to-emerald-50 text-slate-900 overflow-x-hidden flex flex-col">
      <Header />

      <main className="flex-grow">
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-4 lg:px-8 pt-24 pb-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left column */}
          <div className="space-y-8">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUpVariant}
              custom={1}
              className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Blockchain-powered Hospital Management
            </motion.div>

            <motion.h1
              initial="hidden"
              animate="visible"
              variants={fadeUpVariant}
              custom={2}
              className="text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight text-slate-900"
            >
              Welcome to{" "}
              <span className="bg-gradient-to-r from-sky-500 via-emerald-500 to-cyan-500 bg-clip-text text-transparent">
                MedSync
              </span>
              <br />
              Your Partner in Health & Wealth
            </motion.h1>

            <motion.p
              initial="hidden"
              animate="visible"
              variants={fadeUpVariant}
              custom={3}
              className="text-base md:text-lg text-slate-600 max-w-xl"
            >
              MedSync Hospital delivers world-class healthcare through cutting-edge
              technology, experienced professionals, and uncompromised patient care,
              synchronizing expertise, innovation, and compassion for better outcomes.
            </motion.p>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUpVariant}
              custom={4}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-4"
            >
              <button
                onClick={() => navigate("/register")}
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 via-sky-400 to-emerald-400 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-200 hover:brightness-110 transition"
              >
                Get Started!!
              </button>
              <p className="text-xs text-slate-500 italic">
               ( Your health, our priority. )
              </p>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUpVariant}
              custom={5}
              className="grid grid-cols-3 gap-4 max-w-md text-sm"
            >
              <div>
                <p className="text-2xl font-semibold text-sky-600">10K+</p>
                <p className="text-slate-600">Patients served</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-emerald-600">150+</p>
                <p className="text-slate-600">Specialist doctors</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-cyan-600">24/7</p>
                <p className="text-slate-600">Care & support</p>
              </div>
            </motion.div>
          </div>

          {/* Right column */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUpVariant}
            custom={3}
            className="relative"
          >
            <div className="absolute -inset-6 bg-sky-200/40 blur-3xl -z-10" />
            <div className="rounded-3xl border border-sky-100 bg-white/80 backdrop-blur-xl p-6 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <p className="text-xs uppercase tracking-[0.22em] text-sky-600">
                  Real-time Overview
                </p>
                <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600">
                  Live dashboard
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div className="rounded-2xl bg-sky-50 border border-sky-100 p-4">
                  <p className="text-xs text-slate-500 mb-1">Bed occupancy</p>
                  <p className="text-2xl font-semibold text-sky-600">86%</p>
                  <p className="mt-1 text-[11px] text-emerald-600">
                    +12% optimized in last month
                  </p>
                </div>
                <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
                  <p className="text-xs text-slate-500 mb-1">Blockchain records</p>
                  <p className="text-2xl font-semibold text-emerald-600">100%</p>
                  <p className="mt-1 text-[11px] text-slate-600">
                    Tamper-proof medical history
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-gradient-to-r from-sky-50 via-sky-100 to-emerald-50 border border-sky-100 p-4 text-xs">
                <p className="text-sky-700 font-medium mb-1">
                  One platform for patients, doctors, and staff.
                </p>
                <p className="text-slate-600">
                  Manage appointments, prescriptions, billing, and insurance with
                  transparent, auditable workflows powered by blockchain.
                </p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Services */}
        <section className="bg-white/80 border-t border-slate-100">
          <div className="max-w-6xl mx-auto px-4 lg:px-8 py-16">
            <motion.h2
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeUpVariant}
              custom={1}
              className="text-center text-2xl md:text-3xl font-semibold mb-3 text-slate-900"
            >
              Comprehensive Healthcare Services
            </motion.h2>
            <motion.p
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeUpVariant}
              custom={2}
              className="text-center text-slate-600 max-w-2xl mx-auto mb-10 text-sm md:text-base"
            >
              From digital records to expert care, MedSync connects every step of the
              patient journey into a single, secure ecosystem.
            </motion.p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map(({ Icon, title, description, color }, idx) => (
                <motion.div
                  key={title}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-80px" }}
                  custom={idx + 3}
                  variants={fadeUpVariant}
                  className="group rounded-2xl bg-white border border-slate-100 hover:border-sky-300 hover:-translate-y-1 transition-transform shadow-sm hover:shadow-md p-6"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="rounded-2xl bg-sky-50 p-3 border border-slate-100 group-hover:border-sky-300 transition">
                      <Icon className={`${color} text-2xl`} />
                    </div>
                    <h3 className="text-base font-semibold text-slate-900">
                      {title}
                    </h3>
                  </div>
                  <p className="text-sm text-slate-600">{description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Home;
