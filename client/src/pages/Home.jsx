import { Link } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import BuildingIcon from '../components/common/BuildingIcon';
import GraduationCapIcon from '../components/common/GraduationCapIcon';
import logoImg from '../assets/logo/logo.png';
import hero1 from '../assets/homepage/hero-1.png';
import hero2 from '../assets/homepage/hero-2.png';
import hero3 from '../assets/homepage/hero-3.png';
import heroIllustration from '../assets/homepage/homepage1.png';
import heroOld from '../assets/hero_students.jpg';
import WrenchIcon from '../components/common/WrenchIcon';
import ChatIcon from '../components/common/ChatIcon';
import KeyIcon from '../components/common/KeyIcon';
import eventApi from '../api/eventApi';
import lostFoundApi from '../api/lostFoundApi';
import marketplaceApi from '../api/marketplaceApi';
import orderApi from '../api/orderApi';
import authApi from '../api/authApi';
import { uploadUrl } from '../utils/uploadUrl';
import AboutContent from '../components/common/AboutContent';
import HelpContent from '../components/common/HelpContent';
import { FaSearch, FaCalendarAlt, FaClock, FaShoppingCart, FaTruck, FaBoxOpen, FaArrowRight, FaArrowLeft } from 'react-icons/fa';
import toast from 'react-hot-toast';
import ReportFoundModal from '../components/common/ReportFoundModal';
import _ from 'lodash';

export default function Home() {
  const [displayText, setDisplayText] = useState('');
  const fullText = "Welcome to Your Online Dorm Portal.";
  const [activeTab, setActiveTab] = useState('home'); // home, lost-found, marketplace, events, about, help

  // Hero background carousel (Using Habesha/Ethiopian themed images)
  const heroImages = [
    hero1,
    hero2,
    hero3,
    heroIllustration,
    heroOld,
    'https://images.unsplash.com/photo-1541339907198-e08759dfc3f3?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1600&q=80'
  ];
  const [heroIndex, setHeroIndex] = useState(0);

  // Upcoming events slider
  const [events, setEvents] = useState([]);
  const eventsContainerRef = useRef(null);

  // Lost & found preview list
  const [lostItems, setLostItems] = useState([]);
  const [lostLoading, setLostLoading] = useState(true);
  const [lostSearchQuery, setLostSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  
  // Marketplace preview
  const [marketItems, setMarketItems] = useState([]);
  const [marketLoading, setMarketLoading] = useState(true);
  const [marketSearchQuery, setMarketSearchQuery] = useState('');

  useEffect(() => {
    let currentText = '';
    let index = 0;
    const interval = setInterval(() => {
      if (index < fullText.length) {
        currentText += fullText[index];
        setDisplayText(currentText);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Rotate hero background image
  useEffect(() => {
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroImages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  // Load a few upcoming events
  useEffect(() => {
    (async () => {
      try {
        const data = await eventApi.list();
        setEvents((data || []).slice(0, 10));
      } catch (err) {
        const msg = err.response?.data?.message || err.message;
        console.error('❌ Failed to load events for homepage:', msg);
        if (err.response?.data?.error) console.error('🔍 Detail:', err.response.data.error);
      }
    })();
  }, []);

  const fetchMarketItems = async (query = '') => {
    try {
      setMarketLoading(true);
      const data = await marketplaceApi.listPublic({ limit: 6, search: query });
      setMarketItems(data || []);
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      console.error('❌ Home marketplace fetch error:', msg);
      if (err.response?.data?.error) console.error('🔍 Detail:', err.response.data.error);
    } finally {
      setMarketLoading(false);
    }
  };

  const fetchLostItems = async (query = '') => {
    try {
      setLostLoading(true);
      const data = await lostFoundApi.listPublic({ limit: 6, search: query });
      setLostItems(data || []);
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      console.error('❌ Home lostFound fetch error:', msg);
      if (err.response?.data?.error) console.error('🔍 Detail:', err.response.data.error);
    } finally {
      setLostLoading(false);
    }
  };

  const debouncedMarketSearch = useCallback(
    _.debounce((q) => fetchMarketItems(q), 500),
    []
  );

  const debouncedLostSearch = useCallback(
    _.debounce((q) => fetchLostItems(q), 500),
    []
  );

  useEffect(() => {
    if (activeTab === 'marketplace') fetchMarketItems();
    if (activeTab === 'lost-found') fetchLostItems();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'marketplace') debouncedMarketSearch(marketSearchQuery);
  }, [marketSearchQuery, debouncedMarketSearch]);

  useEffect(() => {
    if (activeTab === 'lost-found') debouncedLostSearch(lostSearchQuery);
  }, [lostSearchQuery, debouncedLostSearch]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Very top bar with logo and login */}
      <header className="w-full px-2 py-3 flex items-center justify-between">
        <div className="flex items-center gap-0">
          <img src={logoImg} alt="AAU Logo" className="h-12 w-auto object-contain" />
          <div className="leading-tight">
            <p className="text-sm sm:text-base font-extrabold text-slate-900">
              Addis Ababa University
            </p>
            <p className="text-[11px] sm:text-xs font-semibold text-slate-700">
              Online Dormitory Management System
            </p>
          </div>
        </div>
        <Link
          to="/login"
          className="px-5 py-2.5 rounded-full bg-yellow-400 text-slate-900 text-xs sm:text-sm font-semibold shadow-md hover:bg-yellow-300"
        >
          Log in
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Top category bar */}
        <section className="max-w-3xl mx-auto px-4 pt-6">
          <div className="bg-white text-slate-900 rounded-3xl px-4 sm:px-8 py-3 flex flex-wrap items-center gap-3 shadow-sm border border-slate-100">
            <button
              type="button"
              onClick={() => setActiveTab('home')}
              className={`px-4 py-2 rounded-full text-sm sm:text-base font-bold transition-colors ${
                activeTab === 'home' ? 'bg-blue-600 text-white' : 'bg-transparent hover:bg-slate-100'
              }`}
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('lost-found')}
              className={`px-4 py-2 rounded-full text-sm sm:text-base font-bold transition-colors ${
                activeTab === 'lost-found' ? 'bg-blue-600 text-white' : 'bg-transparent hover:bg-slate-100'
              }`}
            >
              Lost &amp; Found
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('marketplace')}
              className={`px-4 py-2 rounded-full text-sm sm:text-base font-bold transition-colors ${
                activeTab === 'marketplace' ? 'bg-blue-600 text-white' : 'bg-transparent hover:bg-slate-100'
              }`}
            >
              Market Place
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('events')}
              className={`px-4 py-2 rounded-full text-sm sm:text-base font-bold transition-colors ${
                activeTab === 'events' ? 'bg-blue-600 text-white' : 'bg-transparent hover:bg-slate-100'
              }`}
            >
              Events
            </button>
            <div className="relative group">
              <button
                type="button"
                className="px-4 py-2 rounded-full text-sm sm:text-base font-bold transition-colors bg-transparent hover:bg-slate-100 flex items-center gap-1.5"
              >
                More
                <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
              </button>
              <div className="absolute top-full right-0 lg:left-0 lg:right-auto mt-2 w-48 bg-white/95 backdrop-blur-xl border border-slate-100 shadow-xl rounded-2xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                <Link to="/about" className="block px-5 py-3 text-sm font-bold text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-colors">
                  About Us
                </Link>
                <Link to="/help" className="block px-5 py-3 text-sm font-bold text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-colors">
                  Help &amp; Support
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Hero Section - Layered Modern Redesign */}
        {activeTab === 'home' && (
          <section className="max-w-7xl mx-auto px-4 py-8">
            <div className="relative min-h-[550px] lg:min-h-[600px] overflow-hidden rounded-[3rem] shadow-2xl border border-slate-100 bg-slate-50">
              {/* Background Immersive Carousel */}
              <div className="absolute inset-0 z-0 overflow-hidden">
                {heroImages.map((img, idx) => (
                  <div
                    key={idx}
                    className={`absolute inset-0 bg-cover bg-center transition-all duration-[2000ms] ease-out ${
                      idx === heroIndex ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-110 z-0'
                    }`}
                    style={{ backgroundImage: `url(${img})` }}
                  />
                ))}
                {/* Immersive Overlays */}
                <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent z-20 hidden lg:block" />
                <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/40 to-transparent z-20 lg:hidden" />
              </div>

              {/* Foreground Content Card - Left-Center Layout */}
              <div className="relative z-30 h-full flex items-center px-6 sm:px-12 py-10 lg:py-0">
                <div className="max-w-xl w-full mt-[100px] animate-in fade-in slide-in-from-left-6 duration-1000">
                  <div className="bg-white/40 backdrop-blur-2xl border border-white/60 p-6 sm:p-10 rounded-[2.5rem] shadow-xl shadow-blue-900/5 space-y-6">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-[1.15] tracking-tight">
                      {displayText || 'Manage Your Dorm Life Effortlessly'}
                      <span className="inline-block w-1.5 h-8 lg:h-12 bg-blue-600 ml-2 animate-pulse rounded-full" />
                    </h1>
                    
                    <div className="flex flex-wrap gap-4 pt-4">
                      <Link
                        to="/login"
                        className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/30 flex items-center gap-2 group"
                      >
                        Enter Portal <FaArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                      <button 
                        onClick={() => setActiveTab('about')}
                        className="px-8 py-4 bg-white/80 backdrop-blur-md text-slate-600 border border-slate-200 rounded-2xl font-bold text-sm hover:bg-white hover:text-blue-600 transition-all"
                      >
                        Learn More
                      </button>
                    </div>

                    {/* Quick Portal Stats */}
                    <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-200/50">
                      <div>
                        <p className="text-2xl font-black text-blue-600">15+</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Campuses Unified</p>
                      </div>
                      <div>
                        <p className="text-2xl font-black text-slate-900">50K+</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Students</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Carousel Navigation / Indicators */}
              <div className="absolute bottom-8 right-8 z-40 flex items-center gap-4 bg-white/20 backdrop-blur-xl p-3 rounded-2xl border border-white/30 transition-opacity hover:opacity-100 opacity-60">
                <div className="flex gap-2">
                  {heroImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setHeroIndex(idx)}
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${
                        idx === heroIndex ? 'bg-blue-600 w-8' : 'bg-blue-200'
                      }`}
                    />
                  ))}
                </div>
                <div className="h-4 w-px bg-slate-400/30" />
                <button 
                  onClick={() => setHeroIndex((prev) => (prev - 1 + heroImages.length) % heroImages.length)}
                  className="w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center text-slate-600 hover:text-blue-600 transition-all shadow-sm"
                >
                  <FaArrowLeft className="w-3 h-3" />
                </button>
                <button 
                  onClick={() => setHeroIndex((prev) => (prev + 1) % heroImages.length)}
                  className="w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center text-slate-600 hover:text-blue-600 transition-all shadow-sm"
                >
                  <FaArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Tab-specific content below hero */}
        {activeTab === 'home' && (
          <section className="max-w-6xl mx-auto px-4 pb-12">
            {/* Quick feature tiles */}
            <div className="pb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl bg-white border border-amber-100 p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <KeyIcon className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Room &amp; Placement</p>
                  <p className="text-xs text-slate-500">Check allocations and requests.</p>
                </div>
              </div>
              <div className="rounded-2xl bg-white border border-sky-100 p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                  <WrenchIcon className="w-5 h-5 text-sky-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Maintenance &amp; Complaints</p>
                  <p className="text-xs text-slate-500">Report and track issues.</p>
                </div>
              </div>
              <div className="rounded-2xl bg-white border border-emerald-100 p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <ChatIcon className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Notices &amp; Events</p>
                  <p className="text-xs text-slate-500">Stay updated with campus life.</p>
                </div>
              </div>
            </div>

            {/* Upcoming Events slider with continuous right-to-left motion */}
            <div>
              <div className="mb-4 text-center">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Upcoming Events</h2>
                <Link
                  to="/events"
                  className="mt-1 inline-block text-xs font-semibold text-blue-700 hover:text-blue-900"
                >
                  View all events
                </Link>
              </div>
              <div className="relative overflow-hidden">
                {events.length === 0 ? (
                  <div className="rounded-2xl bg-white border border-dashed border-slate-200 p-6 text-sm text-slate-500">
                    No upcoming events yet. Check back soon.
                  </div>
                ) : (
                  <div className="whitespace-nowrap py-2">
                    <div className="homepage-marquee-track">
                      {events.map((event, idx) => (
                        <div
                          key={`${event._id}-${idx}`}
                          className="min-w-[300px] max-w-sm rounded-[1.25rem] bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex-shrink-0 overflow-hidden flex flex-col group"
                        >
                          {/* Event Image */}
                          <div className="h-44 bg-slate-100 relative overflow-hidden">
                            {event.image?.path ? (
                              <img 
                                src={uploadUrl(event.image.path)} 
                                alt="" 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <FaCalendarAlt className="w-8 h-8 opacity-20" />
                              </div>
                            )}
                            <div className="absolute top-2 left-2">
                              <span className="px-2 py-0.5 bg-white/90 backdrop-blur-sm text-blue-700 text-[10px] font-bold rounded-lg uppercase shadow-sm">
                                {event.category || 'Event'}
                              </span>
                            </div>
                          </div>

                          <div className="p-5 flex-1">
                            <h3 className="text-base font-bold text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                              {event.title}
                            </h3>
                            <p className="mt-2 text-xs text-slate-600 line-clamp-3">
                              {event.description}
                            </p>
                          </div>
                          <div className="px-5 pb-5 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-50 pt-3">
                            <span className="flex items-center gap-1">
                              <FaClock className="w-3 h-3" />
                              {event.date
                                ? new Date(event.date).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })
                                : ''}
                            </span>
                            {event.registrationLink ? (
                              <a
                                href={event.registrationLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                Register Here
                              </a>
                            ) : (
                              <span>{event.time}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Marketplace preview */}
            <div className="mt-10">
              <div className="mb-4 text-center">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Student Marketplace</h2>
                <p className="text-sm text-slate-500 mt-1">Books, electronics & dorm essentials</p>
              </div>
              {marketLoading ? (
                <p className="text-center text-slate-500 text-sm">Loading listings…</p>
              ) : marketItems.length === 0 ? (
                <div className="rounded-2xl bg-white border border-dashed border-slate-200 p-6 text-sm text-slate-500 text-center">
                  No marketplace listings yet.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {marketItems.map((m) => (
                    <div
                      key={m._id}
                      className="bg-white rounded-[1.25rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
                    >
                      <div className="h-48 bg-slate-100">
                        {m.image?.path ? (
                          <img
                            src={uploadUrl(m.image.path)}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                            No photo
                          </div>
                        )}
                      </div>
                      <div className="p-5 flex-1 flex flex-col">
                        <p className="text-[11px] font-semibold text-emerald-600 uppercase">{m.category}</p>
                        <h3 className="text-base font-bold text-slate-900 line-clamp-2">{m.title}</h3>
                        <p className="mt-2 text-sm font-semibold text-emerald-700">
                          {m.price} {m.currency || 'ETB'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === 'lost-found' && (
          <section className="max-w-6xl mx-auto px-4 pb-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Lost &amp; Found</h2>
                <Link to="/lost-found" className="text-xs font-semibold text-blue-700 hover:text-blue-900">
                  Open full Lost &amp; Found
                </Link>
              </div>

              {/* Search Input */}
              <div className="relative w-full sm:w-64 group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-slate-400 group-focus-within:text-blue-600 w-3 h-3" />
                </div>
                <input
                  type="text"
                  placeholder="Search and find..."
                  value={lostSearchQuery}
                  onChange={(e) => setLostSearchQuery(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
                />
              </div>
            </div>
            {lostLoading && lostSearchQuery === '' ? (
              <p className="text-slate-500 text-sm">Loading items...</p>
            ) : lostItems.length === 0 ? (
              <div className="rounded-2xl bg-white border border-dashed border-slate-200 p-6 text-sm text-slate-500">
                No items reported yet.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {lostItems.map((item) => (
                  <div
                    key={item._id}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col"
                  >
                    <div className="h-32 bg-slate-100">
                      {item.image?.path ? (
                        <img
                          src={uploadUrl(item.image.path)}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                          No photo
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex-1">
                      <p className="text-[11px] font-semibold text-blue-600 uppercase mb-1">
                        {item.type === 'lost' ? 'Lost Item' : 'Found Item'}
                      </p>
                      <h3 className="text-sm font-bold text-slate-900">
                        {item.itemName || 'Unnamed Item'}
                      </h3>
                      <p className="mt-1 text-xs text-slate-600 line-clamp-3">
                        {item.description || 'No description provided.'}
                      </p>
                      <p className="mt-2 text-[11px] text-slate-500">
                        {item.location || 'Location not specified'}
                      </p>

                      {item.type === 'lost' && item.status === 'Open' && (
                        <button
                          onClick={() => {
                            setSelectedItem(item);
                            setShowReportModal(true);
                          }}
                          className="mt-3 w-full py-2 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-lg border border-blue-100 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-1.5"
                        >
                          <FaSearch className="w-3 h-3" />
                          <span>I Found This</span>
                        </button>
                      )}

                      {item.status === 'ReportedFound' && (
                        <div className="mt-2 p-1.5 bg-emerald-50 border border-emerald-100 rounded-lg text-center">
                          <p className="text-[9px] font-bold text-emerald-700 uppercase">
                            Reported Found
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {showReportModal && selectedItem && (
          <ReportFoundModal
            item={selectedItem}
            onClose={() => {
              setShowReportModal(false);
              setSelectedItem(null);
            }}
            onSuccess={fetchLostItems}
          />
        )}

        {activeTab === 'marketplace' && (
          <section className="max-w-6xl mx-auto px-4 pb-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Campus Shop</h2>
              
              {/* Search Input */}
              <div className="relative w-full sm:w-64 group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-slate-400 group-focus-within:text-red-600 w-3 h-3" />
                </div>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={marketSearchQuery}
                  onChange={(e) => setMarketSearchQuery(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all shadow-sm"
                />
              </div>
            </div>

            {marketLoading && marketSearchQuery === '' ? (
              <p className="text-slate-500 text-sm">Loading…</p>
            ) : marketItems.length === 0 ? (
              <div className="rounded-2xl bg-white border border-dashed border-slate-200 p-8 text-slate-500 text-sm flex flex-col items-center gap-2">
                <FaBoxOpen className="w-8 h-8 opacity-20" />
                <p>{marketSearchQuery ? `No results for "${marketSearchQuery}"` : "No products available yet."}</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {marketItems.map((m) => (
                  <div key={m._id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm group hover:shadow-md transition-shadow flex flex-col">
                    <div className="h-40 bg-slate-100 relative">
                      {m.image?.path ? (
                        <img src={uploadUrl(m.image.path)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <FaBoxOpen className="w-10 h-10 opacity-30" />
                        </div>
                      )}
                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-white/90 backdrop-blur-sm text-red-700 text-[10px] font-bold rounded-lg uppercase shadow-sm">{m.category}</span>
                      <span className="absolute top-2 right-2 px-2 py-0.5 bg-white/90 backdrop-blur-sm text-slate-600 text-[10px] font-bold rounded-lg shadow-sm">Stock: {m.stock ?? 0}</span>
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="text-sm font-bold text-slate-900 line-clamp-2">{m.title}</h3>
                      <p className="text-red-600 font-bold text-lg mt-1">{m.price} {m.currency || 'ETB'}</p>
                      <p className="text-xs text-slate-600 line-clamp-2 mt-1 flex-grow">{m.description}</p>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-2">
                        <FaTruck className="w-3 h-3" />
                        <span>Delivery: {m.deliveryTime || '10 minutes'}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">💳 Payment on delivery</p>
                      <button
                        disabled={!m.stock || m.stock <= 0}
                        onClick={async () => {
                          if (!authApi.isAuthenticated()) {
                            toast.error('Please login to place an order');
                            return;
                          }
                          try {
                            await orderApi.place(m._id);
                            toast.success(`Order placed! Delivery in ${m.deliveryTime || '10 minutes'}. Payment on delivery.`);
                            const data = await marketplaceApi.listPublic();
                            setMarketItems(data);
                          } catch (e) {
                            toast.error(e?.response?.data?.message || 'Order failed');
                          }
                        }}
                        className="mt-3 w-full py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        <FaShoppingCart className="w-3 h-3" />
                        {(!m.stock || m.stock <= 0) ? 'Out of Stock' : 'Order Now'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'events' && (
          <section className="max-w-6xl mx-auto px-4 pb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Campus Events</h2>
              <Link to="/events" className="text-xs font-semibold text-blue-700 hover:text-blue-900">
                View detailed events page
              </Link>
            </div>
            {events.length === 0 ? (
              <div className="rounded-2xl bg-white border border-dashed border-slate-200 p-8 text-slate-500 text-sm">
                No events have been scheduled yet.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {events.map((event) => (
                  <div key={event._id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col group">
                    <div className="h-40 bg-slate-100 relative">
                      {event.image?.path ? (
                        <img src={uploadUrl(event.image.path)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <FaCalendarAlt className="w-10 h-10 opacity-20" />
                        </div>
                      )}
                      <div className="absolute top-2 left-2">
                        <span className="px-2 py-0.5 bg-white/90 backdrop-blur-sm text-blue-700 text-[10px] font-bold rounded-lg uppercase shadow-sm">
                          {event.category || 'Event'}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="text-sm font-bold text-slate-900 line-clamp-2">{event.title}</h3>
                      <div className="px-0 pb-1 flex items-center justify-between text-[11px] text-slate-500 pt-3">
                        <span className="flex items-center gap-1">
                          <FaClock className="w-3 h-3" />
                          {event.date
                            ? new Date(event.date).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : ''}
                        </span>
                        <span>{event.time}</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-600 line-clamp-3 mb-2 flex-grow">
                        {event.description}
                      </p>
                      {event.registrationLink && (
                        <a
                          href={event.registrationLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors"
                        >
                          Register Here
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'about' && (
          <section className="max-w-7xl mx-auto px-4 pb-12">
            <AboutContent />
          </section>
        )}

        {activeTab === 'help' && (
          <section className="max-w-7xl mx-auto px-4 pb-12">
            <HelpContent />
          </section>
        )}
      </main>

    </div>
  );
}