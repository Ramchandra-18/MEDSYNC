import React from "react";
import { FaEnvelope, FaPhoneAlt, FaMapMarkerAlt } from "react-icons/fa";
import Header from "../Components/Header";
import Footer from "../Components/Footer";

const ContactUs = () => {
  return (
    <div className="min-h-screen w-screen flex flex-col bg-gradient-to-br from-sky-50 via-slate-50 to-emerald-50 font-sans">
      {/* fixed header */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Header />
      </div>

      {/* background accents */}
      <div className="pointer-events-none fixed inset-0 opacity-60 mix-blend-multiply">
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-sky-200 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-emerald-200 blur-3xl" />
      </div>

      {/* main */}
      <main className="relative z-10 flex-1 pt-[76px] pb-10 px-4 flex justify-center">
        <div className="w-full max-w-6xl">
          {/* title */}
          <div className="text-center mb-8">
            <p className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-sky-100 text-sky-700 text-[11px] font-semibold uppercase tracking-[0.25em]">
              Get in touch
            </p>
            <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Contact MedSync
            </h2>
            <p className="mt-2 max-w-2xl mx-auto text-sm sm:text-base text-slate-600">
              Questions about appointments, records, technical issues, or
              partnerships? The MedSync team is ready to help.
            </p>
          </div>

          {/* card */}
          <div className="bg-white/90 backdrop-blur-xl shadow-[0_18px_50px_rgba(15,23,42,0.12)] border border-white/70 rounded-3xl grid grid-cols-1 md:grid-cols-2 overflow-hidden">
            {/* left: info */}
            <div className="p-6 sm:p-8 bg-sky-50/70 border-r border-slate-100 flex flex-col justify-center">
              <h3 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-3">
                We’d love to hear from you
              </h3>
              <p className="text-sm sm:text-base text-slate-700 mb-6 leading-relaxed">
                At <span className="font-semibold text-sky-700">MedSync</span>,
                we’re committed to supporting hospitals and patients with
                reliable, real‑time tools. Reach out for product queries,
                support, or collaboration.
              </p>

              <div className="space-y-4 text-sm sm:text-base">
                <div className="flex items-center gap-3">
                  <span className="h-9 w-9 flex items-center justify-center rounded-full bg-sky-100 text-sky-700">
                    <FaEnvelope className="text-sm" />
                  </span>
                  <a
                    href="mailto:work.medsync@gmail.com"
                    className="hover:underline text-slate-800 break-all"
                  >
                    work.medsync@gmail.com
                  </a>
                </div>

                <div className="flex items-center gap-3">
                  <span className="h-9 w-9 flex items-center justify-center rounded-full bg-sky-100 text-sky-700">
                    <FaPhoneAlt className="text-sm" />
                  </span>
                  <a
                    href="tel:8088237366"
                    className="hover:underline text-slate-800"
                  >
                    8088237366
                  </a>
                </div>

                <div className="flex items-center gap-3">
                  <span className="h-9 w-9 flex items-center justify-center rounded-full bg-sky-100 text-sky-700">
                    <FaMapMarkerAlt className="text-sm" />
                  </span>
                  <span className="text-slate-800">
                    VTU&apos;s CPGS, Kalaburagi
                  </span>
                </div>
              </div>
            </div>

            {/* right: form */}
            <div className="p-6 sm:p-8">
              <h3 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-4">
                Send us a message
              </h3>
              <form className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-800 mb-1.5">
                    Name
                  </label>
                  <input
                    type="text"
                    placeholder="Your full name"
                    required
                    className="w-full border border-slate-200 text-sm text-slate-900 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-800 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    required
                    className="w-full border border-slate-200 text-sm text-slate-900 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-800 mb-1.5">
                    Message
                  </label>
                  <textarea
                    placeholder="Tell us how we can help..."
                    rows={4}
                    required
                    className="w-full border border-slate-200 text-sm text-slate-900 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full mt-4 text-sm font-semibold text-white bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-700 hover:to-emerald-700 py-3 rounded-lg shadow-md hover:shadow-lg transition"
                >
                  Send message
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ContactUs;
