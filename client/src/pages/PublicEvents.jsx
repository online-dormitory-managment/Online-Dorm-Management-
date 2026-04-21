import DashboardLayout from '../components/dashboard/Students/DashboardLayout';
import eventApi from '../api/eventApi';
import { useEffect, useState } from 'react';

export default function PublicEvents() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const data = await eventApi.list();
        setEvents(data || []);
      } catch (err) {
        console.error('Failed to load public events', err);
      }
    })();
  }, []);

  return (
    <DashboardLayout
      title="Campus Events"
      breadcrumbs={[
        { label: 'Home', path: '/home' },
        { label: 'Events' }
      ]}
      showPageHeader={true}
    >
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
        {events.length === 0 ? (
          <p className="text-slate-600">No upcoming events have been posted yet.</p>
        ) : (
          events.map((event) => (
            <div
              key={event._id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
            >
              <h2 className="text-lg font-semibold text-slate-900">{event.title}</h2>
              <p className="text-xs text-slate-500 mt-1">
                {event.date
                  ? `${new Date(event.date).toLocaleDateString()} · `
                  : ''}
                {event.time} • {event.location}
              </p>
              <p className="mt-3 text-sm text-slate-600">{event.description}</p>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}

