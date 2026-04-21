import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  FaSearch,
  FaClock,
  FaMapMarkerAlt,
  FaChevronRight,
  FaChevronDown,
  FaCalendarAlt
} from 'react-icons/fa';
import DashboardLayout from '../components/dashboard/Students/DashboardLayout';
import eventApi from '../api/eventApi';
import { uploadUrl } from '../utils/uploadUrl';

const filterOptions = ['All Events', 'Academic', 'Social', 'Meeting', 'Sports', 'Other'];

export default function Events() {
  const [activeFilter, setActiveFilter] = useState('All Events');
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await eventApi.list();
        const formatted = data.map(e => {
          const d = new Date(e.date);
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const month = months[d.getMonth()];
          const day = String(d.getDate()).padStart(2, '0');

          let categoryColor = 'bg-gray-100 text-gray-700';
          let dateColor = 'bg-gray-500';

          switch (e.category) {
            case 'Social': categoryColor = 'bg-purple-100 text-purple-700'; dateColor = 'bg-purple-500'; break;
            case 'Academic': categoryColor = 'bg-blue-100 text-blue-700'; dateColor = 'bg-blue-500'; break;
            case 'Sports': categoryColor = 'bg-emerald-100 text-emerald-700'; dateColor = 'bg-emerald-500'; break;
            case 'Meeting': categoryColor = 'bg-orange-100 text-orange-700'; dateColor = 'bg-orange-500'; break;
            default: categoryColor = 'bg-gray-100 text-gray-700'; dateColor = 'bg-gray-500';
          }

          return {
            id: e._id,
            date: `${month} ${day}`,
            day,
            month,
            category: e.category,
            categoryColor,
            dateColor,
            title: e.title,
            time: e.time,
            location: e.location,
            description: e.description,
            image: e.image
          };
        });
        setEvents(formatted);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredEvents = events.filter((event) => {
    const matchesFilter = activeFilter === 'All Events' || event.category === activeFilter;
    const matchesSearch =
      searchQuery === '' ||
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <DashboardLayout
      title="Student Events"
      breadcrumbs={[
        { label: 'Dashboard', path: '/student-portal' },
        { label: 'Events' }
      ]}
      showPageHeader={false}
    >
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-transparent px-6 sm:px-10 pt-8 pb-6">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Student Events</h1>
              <p className="text-sm text-slate-600">
                Discover workshops, social gatherings, and academic sessions happening around campus.
              </p>
            </div>
            <Link
              to="/events-post"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shrink-0"
            >
              Post an event
            </Link>
          </div>
        </header>

        {/* Search and Filter Bar */}
        <section className="px-10 pb-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              {/* Search Input */}
              <div className="flex-1 relative">
                <FaSearch className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white text-slate-900"
                />
              </div>

              {/* Filter Buttons */}
              <div className="flex gap-2">
                {filterOptions.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${activeFilter === filter
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Events List */}
        <section className="flex-1 px-10 pb-10">
          <div className="max-w-5xl mx-auto">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredEvents.map((event) => (
                <div key={event.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col group hover:shadow-md transition-shadow">
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
                        {event.date}
                      </span>
                      <span className="flex items-center gap-1 truncate max-w-[50%]">
                        <FaMapMarkerAlt className="w-3 h-3 shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-600 line-clamp-3 mb-3 flex-grow">
                      {event.description}
                    </p>
                    <div className="flex justify-between items-center text-xs border-t border-slate-50 pt-3">
                      <span className="font-semibold text-slate-500">{event.time}</span>
                      <button className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium transition-colors">
                        <span>Details</span>
                        <FaChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More Events Button */}
            <div className="flex justify-center pt-6">
              <button className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-slate-300 text-sm text-slate-700 bg-white hover:bg-slate-50 transition-colors">
                <FaChevronDown className="w-4 h-4" />
                <span>Load More Events</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

