import React from "react";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import { FaGithub, FaLinkedin, FaEnvelope } from "react-icons/fa";


const AboutUs = () => (
  <>
    <Header />
    <div className="min-h-screen w-screen bg-gradient-to-br from-sky-200 via-sky-100 to-sky-300 flex flex-col items-center font-sans">
      {/* Accent bar and headline */}
      <div className="w-full flex flex-col items-center py-12 animate-fade-in">
        <div className="mb-12 flex flex-col items-center">
          <span className="uppercase tracking-widest text-blue-700 font-semibold mb-2">
            Innovating Healthcare
          </span>
          <h2 className="text-5xl sm:text-6xl font-extrabold mb-4 text-blue-800 tracking-tight drop-shadow-lg">
            About Us
          </h2>
          <div className="h-1 w-24 bg-blue-500 rounded mt-2 mb-4" />
          <p className="max-w-3xl text-lg sm:text-xl text-gray-700 text-center">
            <span className="font-bold text-blue-700">MedSync</span> is a
            blockchain-powered hospital management system built to provide
            secure, real-time, and transparent healthcare operations.
          </p>
        </div>

        <div className="w-full px-6 flex-grow flex flex-col items-center">
          <div className="w-full max-w-6xl bg-white/90 border border-sky-200 mx-auto p-10 rounded-3xl shadow-2xl backdrop-blur-sm">
            <p className="text-gray-800 text-lg leading-relaxed mb-6">
              Our platform leverages distributed technology to protect patient
              data, streamline coordination between departments, and ensure
              every action is fully auditable.
            </p>
            <p className="text-gray-800 text-lg mb-8">
              <span className="font-semibold text-blue-700">Our mission:</span>{" "}
              Seamless patient care and efficient hospital management—delivered
              by smart tech, empowered staff, and truly modern medicine.
            </p>
            <ul className="list-disc pl-6 text-gray-800 space-y-2 mb-8 text-base sm:text-lg">
              <li>End-to-end patient management</li>
              <li>Secure records on blockchain</li>
              <li>Real-time appointment scheduling</li>
              <li>Automated billing and pharmacy integration</li>
              <li>Responsive mobile portal for patients &amp; staff</li>
            </ul>
            <p className="text-gray-600 italic text-center font-medium">
              For more info, reach out or explore our platform’s features!
            </p>
          </div>
        </div>

        {/* Developed by section */}
        <div className="w-full px-6 mt-10 mb-6 flex justify-center">
          <div className="max-w-3xl w-full flex flex-col sm:flex-row items-center gap-4 sm:gap-6 bg-white/60 border border-sky-200 rounded-2xl px-6 py-4 backdrop-blur">
            {/* Photo */}
            <img
              src="/profile.jpg"
              alt="Your Name"
              className="h-16 w-16 rounded-full object-cover border border-sky-300"
            />

            {/* Text + links */}
            <div className="text-center sm:text-left">
              <p className="text-sm uppercase tracking-[0.2em] text-sky-700 font-semibold">
                Developed by
              </p>
              <p className="text-lg font-semibold text-slate-900">
                RAMCHANDRA
              </p>
              <p className="text-sm text-slate-700">
                Full‑Stack Developer • CODEMATES LTD
              </p>

              <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-3 text-lg">
  <a
    href="mailto:rajalasangi@gmail.com"
    className="text-blue-700 hover:text-blue-900 transition-colors"
    aria-label="Email"
  >
    <FaEnvelope />
  </a>
  <a
    href="https://github.com/Ramchandra-18"
    target="_blank"
    rel="noreferrer"
    className="text-blue-700 hover:text-blue-900 transition-colors"
    aria-label="GitHub"
  >
    <FaGithub />
  </a>
  <a
    href="https://www.linkedin.com/in/ramchandra-a-730876284"
    target="_blank"
    rel="noreferrer"
    className="text-blue-700 hover:text-blue-900 transition-colors"
    aria-label="LinkedIn"
  >
    <FaLinkedin />
  </a>
</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Footer />
  </>
);

export default AboutUs;
  