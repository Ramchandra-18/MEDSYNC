import React from "react";
import { FaEnvelope, FaPhoneAlt, FaMapMarkerAlt } from "react-icons/fa";
import Header from "../Components/Header";
import Footer from "../Components/Footer";

const ContactUs = () => {
  return (
    <div className="min-h-screen w-screen flex flex-col bg-sky-200 font-sans px-4">
      {/* Fixed header */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Header />
      </div>

      {/* Main content area should flex-grow */}
      <div className="pt-[72px] w-full max-w-6xl mx-auto flex-grow mb-0">
        {/* Page Title */}
        <h2 className="text-4xl font-bold text-blue-700 mb-8 tracking-tight text-center mt-8">
          Contact Us
        </h2>

        {/* Main Container */}
        <div className="bg-white shadow-lg rounded-lg w-full grid grid-cols-1 md:grid-cols-2 overflow-hidden">
          {/* Left section - Info */}
          <div className="p-8 bg-blue-50 flex flex-col justify-center">
            <h3 className="text-2xl font-bold text-blue-700 mb-4">
              We'd love to hear from you
            </h3>
            <p className="text-gray-700 mb-6 leading-relaxed">
              At <span className="font-semibold">MedSync</span>, we’re committed to helping you with appointments, medical inquiries, technical issues, or partnership opportunities. Our team is always ready to support you with quick and effective solutions.
            </p>
            {/* Contact Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <FaEnvelope className="text-blue-600 text-xl" />
                <a
                  href="mailto:support@medsync.com"
                  className="hover:underline text-gray-800"
                >
                  work.medsync@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-3">
                <FaPhoneAlt className="text-blue-600 text-xl" />
                <a href="tel:+1800123456" className="hover:underline text-gray-800">
                 8088237366
                </a>
              </div>
              <div className="flex items-center gap-3">
                <FaMapMarkerAlt className="text-blue-600 text-xl" />
                <span className="text-gray-800">
                  VTU's CPGS KALABURAGI
                </span>
              </div>
            </div>
          </div>
          {/* Right section - Form */}
          <div className="p-8">
            <h3 className="text-2xl font-bold text-blue-700 mb-4">Send us a message</h3>
            <form className="space-y-5">
              <div>
                <label className="block text-gray-800 mb-1 font-medium">Name</label>
                <input
                  type="text"
                  placeholder="Your Full Name"
                  required
                  className="w-full border border-gray-300 p-3 text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-gray-800 mb-1 font-medium">Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  required
                  className="w-full border border-gray-300 p-3 text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-black mb-1 font-medium">Message</label>
                <textarea
                  placeholder="Type your message here..."
                  rows="4"
                  required
                  className="w-full border border-gray-300 p-3 text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 mt-10 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Footer will always be at the bottom */}
      <Footer />
    </div>
  );
};

export default ContactUs;
