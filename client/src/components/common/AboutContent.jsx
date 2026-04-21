import React from 'react';
import { FaPlay, FaUniversity, FaGlobeAfrica, FaShieldAlt, FaRocket, FaUsers, FaArrowRight } from 'react-icons/fa';
import heroIllustration from '../../assets/homepage/homepage1.png';

export default function AboutContent() {
  const campuses = [
    { name: "6 Kilo (Main Campus)", type: "Administration", specialty: "Natural Sciences & Informatics" },
    { name: "5 Kilo", type: "AAiT", specialty: "Engineering & Technology" },
    { name: "4 Kilo", type: "College of Natural Sciences", specialty: "Physics, Math, Bio" },
    { name: "FBE", type: "Business & Economics", specialty: "Economics, Management, Accounting" }
  ];

  const pillars = [
    {
      title: "Efficiency",
      desc: "Reducing administrative overhead by 80% through automated room placement and digital clearances.",
      icon: <FaRocket className="w-5 h-5" />
    },
    {
      title: "Transparency",
      desc: "Live tracking of requests, orders, and maintenance issues for every student, proctor, and admin of the university.",
      icon: <FaUsers className="w-5 h-5" />
    },
    {
      title: "Security",
      desc: "State-of-the-art data protection for student records and campus marketplace transactions.",
      icon: <FaShieldAlt className="w-5 h-5" />
    }
  ];

  return (
    <div className="space-y-24 pb-20">
      {/* Narrative Section */}
      <div className="max-w-4xl mx-auto text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pt-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-widest border border-blue-100">
          <FaGlobeAfrica className="w-3 h-3" />
          <span>ESTABLISHED 1950 • DIGITALIZED 2026</span>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          Modernizing the <br />
          <span className="text-blue-600">Student Journey at AAU.</span>
        </h1>
        
        <p className="text-lg text-slate-600 leading-relaxed font-medium max-w-3xl mx-auto">
          The Online Dormitory project reflects Addis Ababa University's commitment to excellence and digital transformation. We've built a seamless ecosystem that connects all 15+ campuses, ensuring that student welfare and academic focus remain our top priorities.
        </p>
      </div>

      {/* Creative Video Section */}
      <div className="max-w-5xl mx-auto">
        <div className="relative group rounded-[3rem] overflow-hidden shadow-2xl shadow-blue-400/20 border-[8px] border-white aspect-video bg-blue-900">
          <img 
            src={heroIllustration} 
            alt="AAU Student Life Video" 
            className="w-full h-full object-cover brightness-[0.75] contrast-[1.1] group-hover:scale-105 transition-transform duration-[2000ms]" 
          />
          
          {/* Glassmorphic Play Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <button className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-2xl border border-white/30 flex items-center justify-center text-white shadow-2xl hover:scale-110 active:scale-95 transition-all group/btn">
              <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center shadow-lg group-hover/btn:bg-blue-500 transition-colors">
                <FaPlay className="w-7 h-7 translate-x-1" />
              </div>
            </button>
          </div>

          <div className="absolute bottom-0 inset-x-0 p-10 bg-gradient-to-t from-blue-950/80 via-blue-950/40 to-transparent flex justify-between items-end">
            <div className="text-white">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-300 mb-2">NOW PLAYING</p>
              <h3 className="text-2xl font-bold">The Digital Dormitory Revolution</h3>
            </div>
            <div className="px-5 py-2.5 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 text-white text-[11px] font-bold tracking-widest">
              OFFICIAL TOUR
            </div>
          </div>
        </div>
      </div>

      {/* Core Pillars Grid */}
      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 px-4">
        {pillars.map((p, idx) => (
          <div key={idx} className="p-10 rounded-[2.5rem] bg-white border border-blue-50 shadow-xl shadow-blue-500/5 space-y-4 hover:-translate-y-2 transition-transform duration-500 group">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center group-hover:rotate-6 transition-transform">
              {p.icon}
            </div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">{p.title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">
              {p.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Campus Reach - Clean Refined Style */}
      <div className="max-w-6xl mx-auto rounded-[4rem] p-10 md:p-16 border border-blue-100 bg-white/50 backdrop-blur-2xl overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-1000">
          <FaUniversity className="w-64 h-64 text-blue-900" />
        </div>
        
        <div className="relative z-10 grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">Our Campus <br /><span className="text-blue-600 font-black">Reach.</span></h2>
            <p className="text-slate-600 leading-relaxed font-medium text-lg">
              Serving the essential units of Addis Ababa University. We provide specialized support for the heart of the city's academic landscape.
            </p>
            <button className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20">
              Explore Our Units <FaArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {campuses.map((c, idx) => (
              <div key={idx} className="p-6 bg-white rounded-3xl border border-blue-50 shadow-sm hover:shadow-md transition-shadow">
                <h4 className="font-bold text-slate-900 mb-1">{c.name}</h4>
                <p className="text-[10px] uppercase tracking-widest text-blue-600 font-bold mb-2">{c.type}</p>
                <p className="text-xs text-slate-500 leading-tight">{c.specialty}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legacy Section */}
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Addis Ababa University Legacy</h2>
          <div className="h-1 w-20 bg-blue-600 mx-auto rounded-full" />
        </div>
        
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-4">
            <p className="text-slate-600 leading-relaxed font-medium">
              As the oldest and largest higher learning institution in Ethiopia, AAU has been the cradle of leadership and innovation since 1950. Our dormitory systems are now evolving to match that legacy.
            </p>
            <p className="text-slate-600 leading-relaxed font-medium">
              We bridges historical values with future-ready technology to provide students with a space where they can thrive academically and socially.
            </p>
          </div>
          <div className="bg-slate-500 rounded-[2.5rem] aspect-square overflow-hidden border-8 border-white shadow-2xl shadow-blue-500/10">
             <img src={heroIllustration} alt="AAU History" className="w-full h-full object-cover grayscale opacity-50 contrast-125" />
          </div>
        </div>
      </div>

      {/* Refined Identity Footer */}
      <div className="text-center space-y-6 pt-10">
        <div className="flex flex-col items-center gap-4 opacity-50 hover:opacity-100 transition-opacity">
          <div className="h-1 w-32 bg-gradient-to-r from-transparent via-blue-600 to-transparent" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Addis Ababa University • 2026</p>
        </div>
      </div>
    </div>
  );
}
