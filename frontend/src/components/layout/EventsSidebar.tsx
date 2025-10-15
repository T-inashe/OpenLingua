import { Calendar } from "lucide-react";

type Event = {
  id: string;
  title: string;
  description: string;
  datetime: string;
  attendingCount: number;
  attending: boolean;
  capacity?: number;
  location?: string;
  type?: string;
};

interface EventsSidebarProps {
  open: boolean;
  events: Event[];
  onClose: () => void;
  onAttend: (id: string) => void;
}

export default function EventsSidebar({ open, events, onClose, onAttend }: EventsSidebarProps) {
  return (
    <aside
      className={`fixed top-0 right-0 h-full w-80 bg-slate-900/95 backdrop-blur-lg border-l border-white/10 p-6 transform transition-transform duration-500 z-50 ${open ? "translate-x-0" : "translate-x-full"}`}
      role="complementary"
      aria-labelledby="sidebar-heading"
      aria-hidden={!open}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 id="sidebar-heading" className="text-white font-semibold text-xl">
          Upcoming Events
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white hover:bg-white/10 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all duration-200"
          aria-label="Close events sidebar"
        >
          ✕
        </button>
      </div>

      {events.length > 0 ? (
        <div className="space-y-4" role="list" aria-label="Upcoming events">
          {events.map((e) => (
            <article key={e.id} className="bg-white/5 p-4 rounded-lg border border-white/10 hover:bg-white/10 transition-colors duration-200" role="listitem">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-white font-semibold">{e.title}</h3>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    e.type === "qa"
                      ? "bg-blue-600/20 text-blue-400"
                      : e.type === "cultural"
                      ? "bg-purple-600/20 text-purple-400"
                      : e.type === "workshop"
                      ? "bg-green-600/20 text-green-400"
                      : "bg-gray-600/20 text-gray-400"
                  }`}
                >
                  {e.type}
                </span>
              </div>
              <p className="text-gray-300 text-sm mb-3">{e.description}</p>
              <div className="space-y-2 text-sm text-gray-400 mb-4">
                <time className="flex items-center gap-2" dateTime={e.datetime}>
                  📅 {new Date(e.datetime).toLocaleString()}
                </time>
                {e.location && <div className="flex items-center gap-2">📍 {e.location}</div>}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    👥 {e.attendingCount}
                    {e.capacity && `/${e.capacity}`} attending
                  </span>
                  {e.capacity && (
                    <span className={`text-xs ${e.attendingCount >= e.capacity ? "text-red-400" : "text-green-400"}`}>
                      {e.attendingCount >= e.capacity ? "Full" : `${e.capacity - e.attendingCount} spots left`}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => onAttend(e.id)}
                disabled={!e.attending && !!e.capacity && e.attendingCount >= e.capacity}
                className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed ${
                  e.attending ? "bg-green-600 hover:bg-green-700 focus:ring-green-500" : "bg-cyan-600 hover:bg-cyan-700 focus:ring-cyan-500"
                } text-white`}
                aria-pressed={e.attending}
                aria-label={e.attending ? `Stop attending ${e.title}` : `Attend ${e.title}`}
              >
                {e.attending ? "✅ Attending" : !e.capacity || e.attendingCount < e.capacity ? "👋 Join Event" : "🚫 Event Full"}
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Calendar size={48} className="text-gray-600 mx-auto mb-4" aria-hidden="true" />
          <p className="text-gray-400 text-lg">No upcoming events</p>
          <p className="text-gray-500 text-sm mt-1">Check back later for new events!</p>
        </div>
      )}
    </aside>
  );
}
