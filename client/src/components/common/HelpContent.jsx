import React from 'react';
import { FaPlay, FaQuestionCircle, FaUserShield, FaTools, FaEnvelope } from 'react-icons/fa';

export default function HelpContent() {
  const tutorialVideos = [
    { title: "Portal Tour", duration: "1:20", category: "Getting Started" },
    { title: "Room Application", duration: "2:45", category: "Placement" },
    { title: "Selling Items", duration: "3:10", category: "Marketplace" },
    { title: "Reporting Issues", duration: "2:15", category: "Maintenance" }
  ];

  const steps = [
    {
      title: "Log In",
      desc: "Access your dashboard using your AAU student ID and the secure password provided during registration.",
      icon: <FaUserShield className="w-5 h-5 text-blue-600" />
    },
    {
      title: "Explore Services",
      desc: "Browse the Marketplace, check Lost & Found, or view upcoming campus events directly from your home feed.",
      icon: <FaQuestionCircle className="w-5 h-5 text-emerald-600" />
    },
    {
      title: "Request Help",
      desc: "If something is broken or you have a concern, use the maintenance and complaints forms to alert your proctor.",
      icon: <FaTools className="w-5 h-5 text-amber-600" />
    }
  ];

  return (
    <div className="space-y-20 pb-20">
      {/* Introduction */}
      <div className="max-w-3xl mx-auto text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 pt-12">
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">
          How can we <span className="text-blue-600">guide you?</span>
        </h2>
        <p className="text-lg text-slate-600 font-medium">
          Whether you're new to the dorm or a senior student, these resources will help you navigate the Online Dormitory platform like a pro.
        </p>
      </div>

      {/* Video Tutorials Grid */}
      <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {tutorialVideos.map((video, idx) => (
          <div key={idx} className="group relative bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500">
            <div className="aspect-video bg-slate-100 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-slate-900/40 transition-colors z-10" />
              <FaPlay className="w-8 h-8 text-white z-20 group-hover:scale-125 transition-transform" />
              <div className="absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-black/60 backdrop-blur text-[10px] font-bold text-white z-20">
                {video.duration}
              </div>
            </div>
            <div className="p-5">
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">{video.category}</p>
              <h4 className="font-bold text-slate-900">{video.title}</h4>
            </div>
          </div>
        ))}
      </div>

      {/* Step by Step Guide */}
      <div className="max-w-5xl mx-auto bg-slate-50 rounded-[3rem] p-8 md:p-12 lg:p-16 space-y-12">
        <h3 className="text-2xl font-bold text-center text-slate-900">Three Steps to Mastery</h3>
        <div className="grid md:grid-cols-3 gap-12 relative">
          {/* Connector Line (Desktop) */}
          <div className="hidden md:block absolute top-[2.5rem] inset-x-20 h-0.5 bg-slate-200" />
          
          {steps.map((step, idx) => (
            <div key={idx} className="relative z-10 flex flex-col items-center text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-white border-4 border-slate-50 flex items-center justify-center shadow-lg transform group-hover:rotate-6 transition-transform">
                {step.icon}
              </div>
              <h4 className="font-bold text-slate-900">{step.title}</h4>
              <p className="text-sm text-slate-500 leading-relaxed max-w-[200px]">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Simplified Contact */}
      <div className="max-w-xl mx-auto p-10 bg-gradient-to-br from-slate-900 to-blue-900 rounded-[2.5rem] shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-blue-100 mx-auto flex items-center justify-center text-blue-900 shadow-inner">
          <FaEnvelope className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-white tracking-tight">Still have questions?</h3>
          <p className="text-blue-200/70 text-sm">Our support team is here for you 24/7.</p>
        </div>
        <button className="px-8 py-3.5 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-yellow-400 transition-colors shadow-lg shadow-white/5">
          Email support
        </button>
      </div>
    </div>
  );
}
