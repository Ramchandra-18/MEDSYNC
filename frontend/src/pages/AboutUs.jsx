import React from "react";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import { FaGithub, FaLinkedin, FaEnvelope } from "react-icons/fa";

const AboutUs = () => (
  <>
    <Header />
    <div className="min-h-screen w-screen bg-gradient-to-br from-sky-50 via-slate-50 to-emerald-50 flex flex-col items-center font-sans">
      <main className="w-full max-w-5xl px-4 sm:px-6 lg:px-8 pt-16 pb-12 flex-1">
        {/* Hero */}
        <section className="text-center mb-12">
          <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 text-sky-700 text-[11px] font-semibold uppercase tracking-[0.25em]">
            <span>MedSync</span>
            <span className="h-1 w-1 rounded-full bg-sky-500" />
            <span>Hospital OS</span>
          </p>
          <h1 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            MedSync
          </h1>
          <p className="mt-3 max-w-3xl mx-auto text-sm sm:text-base md:text-lg text-slate-700 leading-relaxed">
            MedSync is a blockchain‑powered hospital management system built to
            provide secure, real‑time, and transparent healthcare operations.
          </p>
        </section>

        {/* Timeline + summary card */}
        <section className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-start mb-10">
          {/* Vertical timeline */}
          <div className="bg-white/90 border border-sky-100 rounded-3xl shadow-xl backdrop-blur-sm px-5 sm:px-7 py-6">
            <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-4">
              How MedSync is designed to work
            </h2>
            <div className="-my-4 relative">
              {/* Item 1 */}
              <div className="relative pl-7 py-4 group">
                <div className="absolute left-2 top-0 bottom-0 w-px bg-slate-200 group-last:hidden" />
                <div className="absolute left-2 top-5 w-2.5 h-2.5 rounded-full bg-sky-500 ring-4 ring-sky-100" />
                <div className="flex flex-col gap-1">
                  <span className="inline-flex w-fit px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 text-[10px] font-semibold uppercase tracking-[0.18em]">
                    Patient journey
                  </span>
                  <h3 className="text-sm sm:text-base font-semibold text-slate-900">
                    End‑to‑end patient management
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    From registration and appointments to discharge, MedSync
                    keeps a single, consistent patient record that updates in
                    real time across departments.
                  </p>
                </div>
              </div>

              {/* Item 2 */}
              <div className="relative pl-7 py-4 group">
                <div className="absolute left-2 top-0 bottom-0 w-px bg-slate-200 group-last:hidden" />
                <div className="absolute left-2 top-5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                <div className="flex flex-col gap-1">
                  <span className="inline-flex w-fit px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold uppercase tracking-[0.18em]">
                    Secure data
                  </span>
                  <h3 className="text-sm sm:text-base font-semibold text-slate-900">
                    Records on blockchain
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    Key clinical and administrative events are written to a
                    tamper‑evident ledger, making audits and compliance checks
                    straightforward.
                  </p>
                </div>
              </div>

              {/* Item 3 */}
              <div className="relative pl-7 py-4 group">
                <div className="absolute left-2 top-0 bottom-0 w-px bg-slate-200 group-last:hidden" />
                <div className="absolute left-2 top-5 w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-amber-100" />
                <div className="flex flex-col gap-1">
                  <span className="inline-flex w-fit px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-semibold uppercase tracking-[0.18em]">
                    Operations
                  </span>
                  <h3 className="text-sm sm:text-base font-semibold text-slate-900">
                    Real‑time scheduling & workflows
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    Appointments, ward allocations, and task assignments update
                    instantly so doctors, nurses, and admins work from the same
                    live timeline.
                  </p>
                </div>
              </div>

              {/* Item 4 */}
              <div className="relative pl-7 py-4 group">
                <div className="absolute left-2 top-0 bottom-0 w-px bg-slate-200 group-last:hidden" />
                <div className="absolute left-2 top-5 w-2.5 h-2.5 rounded-full bg-purple-500 ring-4 ring-purple-100" />
                <div className="flex flex-col gap-1">
                  <span className="inline-flex w-fit px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-semibold uppercase tracking-[0.18em]">
                    Revenue & pharmacy
                  </span>
                  <h3 className="text-sm sm:text-base font-semibold text-slate-900">
                    Billing and pharmacy integration
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    Orders, bills, and pharmacy stock movements stay in sync
                    with clinical events, reducing manual entry and missed
                    charges.
                  </p>
                </div>
              </div>

              {/* Item 5 */}
              <div className="relative pl-7 py-4 group">
                <div className="absolute left-2 top-0 bottom-0 w-px bg-slate-200 group-last:hidden" />
                <div className="absolute left-2 top-5 w-2.5 h-2.5 rounded-full bg-sky-700 ring-4 ring-sky-200" />
                <div className="flex flex-col gap-1">
                  <span className="inline-flex w-fit px-2 py-0.5 rounded-full bg-slate-900 text-slate-100 text-[10px] font-semibold uppercase tracking-[0.18em]">
                    Experience
                  </span>
                  <h3 className="text-sm sm:text-base font-semibold text-slate-900">
                    Portals for patients, Doctor, Staff & Pharmacy
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    Clean, responsive interfaces give each role the right level
                    of detail—from doctors on rounds to patients checking their
                    own history.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Mission card */}
          <aside className="bg-sky-900 text-sky-50 rounded-3xl shadow-xl px-6 sm:px-7 py-6 space-y-4">
            <h2 className="text-lg font-semibold">Our mission</h2>
            <p className="text-xs sm:text-sm text-sky-100/80">
              Seamless patient care and efficient hospital management—delivered
              by smart tech, empowered staff, and truly modern medicine.
            </p>
            <div className="grid grid-cols-2 gap-3 text-center text-[11px] sm:text-xs">
              <div className="rounded-2xl bg-sky-800/70 px-3 py-3">
                <p className="text-lg font-bold text-white">Secure</p>
                <p className="mt-1 text-sky-100/80">Ledger‑backed records</p>
              </div>
              <div className="rounded-2xl bg-sky-800/70 px-3 py-3">
                <p className="text-lg font-bold text-white">Real‑time</p>
                <p className="mt-1 text-sky-100/80">Operational visibility</p>
              </div>
              <div className="rounded-2xl bg-sky-800/70 px-3 py-3">
                <p className="text-lg font-bold text-white">Modular</p>
                <p className="mt-1 text-sky-100/80">OPD, billing, pharmacy</p>
              </div>
              <div className="rounded-2xl bg-sky-800/70 px-3 py-3">
                <p className="text-lg font-bold text-white">Human‑centric</p>
                <p className="mt-1 text-sky-100/80">Built for clinicians</p>
              </div>
            </div>
          </aside>
        </section>

        {/* Dev credit */}
        <section className="mb-6 flex justify-center">
          <div className="max-w-3xl w-full flex flex-col sm:flex-row items-center gap-4 sm:gap-6 bg-white/85 border border-sky-100 rounded-2xl px-5 sm:px-6 py-4 backdrop-blur shadow-lg">
            <img
              src="/profile.jpg"
              alt="Ramchandra"
              className="h-16 w-16 rounded-full object-cover border border-sky-300 shadow-sm"
            />
            <div className="text-center sm:text-left">
              <p className="text-[11px] uppercase tracking-[0.3em] text-sky-700 font-semibold">
                Developed by
              </p>
              <p className="text-lg sm:text-xl font-semibold text-slate-900 mt-1">
                RAMCHANDRA
              </p>
              <p className="text-xs sm:text-sm text-slate-700">
                Full‑Stack Developer • CODEMATES LTD
              </p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-3 text-lg">
                <a
                  href="mailto:rajalasangi@gmail.com"
                  className="text-sky-700 hover:text-sky-900 transition-colors"
                  aria-label="Email"
                >
                  <FaEnvelope />
                </a>
                <a
                  href="https://github.com/Ramchandra-18"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-700 hover:text-sky-900 transition-colors"
                  aria-label="GitHub"
                >
                  <FaGithub />
                </a>
                <a
                  href="https://www.linkedin.com/in/ramchandra-a-730876284"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-700 hover:text-sky-900 transition-colors"
                  aria-label="LinkedIn"
                >
                  <FaLinkedin />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
    <Footer />
  </>
);

export default AboutUs;
