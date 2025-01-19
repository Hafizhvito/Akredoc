import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, RefreshCw, ChevronLeft, ChevronRight, Plus, X, Calendar, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import SimpleReminderPopup from './SimpleReminderPopup';

/**
 * ==========================================
 * Author: Hafizh & Team
 * Description: Aplikasi Web Based
 * Project: AkreDoc TIUY
 * ==========================================
 */

const AUTH_CACHE_KEY = 'auth_cache';
const AUTH_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Simplified auth cache helper functions
const getAuthFromCache = () => {
  const cached = localStorage.getItem(AUTH_CACHE_KEY);
  if (!cached) return null;

  try {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < AUTH_CACHE_DURATION) {
      return data;
    }
    localStorage.removeItem(AUTH_CACHE_KEY);
  } catch (error) {
    localStorage.removeItem(AUTH_CACHE_KEY);
  }
  return null;
};

const setAuthCache = (data) => {
  localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify({
    data,
    timestamp: Date.now()
  }));
};

const createRequestManager = () => {
  const queue = [];
  let isProcessing = false;
  const delay = 1000; // 1 second delay between requests

  const processQueue = async () => {
    if (isProcessing || queue.length === 0) return;

    isProcessing = true;
    const { request, resolve, reject } = queue.shift();

    try {
      const response = await request();
      resolve(response);
    } catch (error) {
      reject(error);
    } finally {
      isProcessing = false;
      setTimeout(() => processQueue(), delay);
    }
  };

  return {
    enqueue: (request) => {
      return new Promise((resolve, reject) => {
        queue.push({ request, resolve, reject });
        processQueue();
      });
    }
  };
};

const requestManager = createRequestManager();

const DashboardCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [lastFetchTimestamp, setLastFetchTimestamp] = useState({});

  const [showEventModal, setShowEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    color: '#4F46E5'
  });
  const [selectedEvents, setSelectedEvents] = useState([]);

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const COLORS = [
    '#4F46E5', // Indigo
    '#DC2626', // Red
    '#059669', // Green
    '#D97706', // Amber
    '#7C3AED', // Purple
    '#DB2777', // Pink
    '#2563EB', // Blue
  ];

  const [eventsCache, setEventsCache] = useState({});

  const fetchEvents = useCallback(async () => {
    const monthKey = `${currentDate.getMonth()}-${currentDate.getFullYear()}`;
    const now = Date.now();
    const cacheAge = now - (lastFetchTimestamp[monthKey] || 0);

    if (eventsCache[monthKey] && cacheAge < 5 * 60 * 1000) {
      setEvents(eventsCache[monthKey]);
      return;
    }

    if (isLoadingEvents) return;

    setIsLoadingEvents(true);
    try {
      const response = await requestManager.enqueue(() =>
        axios.get('https://akredoc.my.id/api/events', {
          // axios.get('http://localhost:8000/api/events', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        })
      );

      setEvents(response.data);
      setEventsCache(prev => ({ ...prev, [monthKey]: response.data }));
      setLastFetchTimestamp(prev => ({ ...prev, [monthKey]: now }));
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoadingEvents(false);
    }
  }, [currentDate, eventsCache, isLoadingEvents, lastFetchTimestamp]);

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  // Handle event creation
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        'https://akredoc.my.id/api/events',
        // 'http://localhost:8000/api/events',
        newEvent,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setEvents([...events, response.data]);
      setShowEventModal(false);
      resetNewEvent();
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  // Reset new event form
  const resetNewEvent = () => {
    setNewEvent({
      title: '',
      description: '',
      start_date: '',
      end_date: '',
      color: '#4F46E5'
    });
  };

  // Handle date click to view events
  const handleDateClick = (day) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const eventsForDate = getEventsForDate(day); // Get events for the clicked date
    setSelectedEvents(eventsForDate); // Store events in state
    setShowEventModal(true); // Show the event modal
  };

  // Get events for a specific date
  const getEventsForDate = (day) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(event => {
      const eventDate = new Date(event.start_date).toISOString().split('T')[0];
      return eventDate === dateStr;
    });
  };

  // Check if a date is today
  const isToday = (day) => {
    const today = new Date();
    return day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear();
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const days = [];

    // Empty cells for previous month
    for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) {
      days.push(
        <div key={`empty-${i}`} className="h-28 bg-gray-50/50 border border-gray-200" />
      );
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = getEventsForDate(day);
      days.push(
        <div
          key={day}
          onClick={() => handleDateClick(day)}
          className={`h-28 p-2 border border-gray-200 hover:bg-emerald-50 transition-colors cursor-pointer
    ${isToday(day) ? 'bg-emerald-50/50 border-emerald-200' : 'bg-white'}`}
        >
          <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-sm
    ${isToday(day) ? 'bg-emerald-600 text-white' : 'text-gray-700'}`}>
            {day}
          </span>
          <div className="mt-1 space-y-1 overflow-hidden">
            {dayEvents.map((event, idx) => (
              <div
                key={idx}
                className="text-xs p-1 rounded-md truncate"
                style={{
                  backgroundColor: `${event.color}15`,
                  color: event.color,
                  border: `1px solid ${event.color}30`
                }}
              >

                {event.title}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return days;
  };

  return (
    <div className="w-full bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold text-gray-900">Kalender</h2>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center bg-gray-100 rounded-lg">
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                className="p-2 hover:bg-gray-200 rounded-l-lg transition-colors focus:outline-none"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>
              <span className="px-4 text-sm font-medium text-gray-700">
                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
              </span>
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                className="p-2 hover:bg-gray-200 rounded-r-lg transition-colors focus:outline-none"
              >
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            <button
              onClick={() => setShowEventModal(true)}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-emerald-700 transition-colors focus:outline-none"
            >
              <Plus className="h-4 w-4" />
              Acara baru
            </button>
          </div>
        </div>

        {/* Responsive Calendar Wrapper */}
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="min-w-[600px] sm:min-w-0 px-4 sm:px-0">
            {/* Days Header */}
            <div className="grid grid-cols-7 gap-px">
              {DAYS.map(day => (
                <div key={day} className="h-12 flex items-center justify-center bg-gray-50">
                  <span className="text-sm font-semibold text-gray-600">{day}</span>
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-px">
              {generateCalendarDays()}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-6">
              {selectedEvents.length > 0 ? (
                <h3 className="text-lg font-semibold text-gray-900">Rincian Acara</h3>
              ) : (
                <h3 className="text-lg font-semibold text-gray-900">Buat Acara Baru</h3>
              )}
              <button
                onClick={() => {
                  setShowEventModal(false);
                  setSelectedEvents([]); // Reset events when closing modal
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Show details or form based on selected events */}
            {selectedEvents.length > 0 ? (
              <div className="space-y-4">
                {selectedEvents.map((event, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-lg shadow-sm">
                    <h4 className="text-md font-bold text-gray-800">{event.title}</h4>
                    <p className="text-sm text-gray-600">{event.description || "Tidak ada deskripsi tersedia"}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(event.start_date).toLocaleString()} -{" "}
                      {event.end_date ? new Date(event.end_date).toLocaleString() : "No end date"}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Dibuat oleh: {event.user.name} ({event.user.role})
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <form onSubmit={handleCreateEvent} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Judul
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-black focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none"
                    value={newEvent.title}
                    onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                    placeholder="Judul acara"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deskripsi
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-black focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none"
                    rows={3}
                    value={newEvent.description}
                    onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="Deskripsi acara"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mulai
                    </label>
                    <div className="relative">
                      <input
                        type="datetime-local"
                        required
                        className="w-full pl-2 pr-8 py-2 border border-gray-300 rounded-lg bg-white text-black text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none"
                        value={newEvent.start_date}
                        onChange={e => setNewEvent({ ...newEvent, start_date: e.target.value })}
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none text-gray-500">
                        <Calendar className="h-4 w-4" />
                        <Clock className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Selesai
                    </label>
                    <div className="relative">
                      <input
                        type="datetime-local"
                        required
                        className="w-full pl-2 pr-8 py-2 border border-gray-300 rounded-lg bg-white text-black text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none"
                        value={newEvent.end_date}
                        onChange={e => setNewEvent({ ...newEvent, end_date: e.target.value })}
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none text-gray-500">
                        <Calendar className="h-4 w-4" />
                        <Clock className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Warna
                  </label>
                  <div className="flex gap-2">
                    {COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 transition-all ${newEvent.color === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                          }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewEvent({ ...newEvent, color })}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEventModal(false);
                      resetNewEvent();
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors  focus:outline-none"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors  focus:outline-none"
                  >
                    Buat Acara
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const DocumentCard = ({ doc }) => {
  const navigate = useNavigate();

  const getStatusColor = (status) => {
    const colors = {
      complete: "bg-emerald-100 text-emerald-700 border-emerald-200",
      "in-progress": "bg-blue-100 text-blue-700 border-blue-200",
      incomplete: "bg-red-100 text-red-700 border-red-200",
      draft: "bg-gray-100 text-gray-700 border-gray-200",
    };
    return colors[status] || colors.draft;
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return "bg-emerald-500";
    if (progress >= 40) return "bg-amber-500";
    return "bg-red-500";
  };

  const getDynamicStatus = () => {
    if (doc.title === "Evaluasi Diri Berbasis PPEPP") {
      return doc.progress === 100 ? "selesai" : "belum lengkap";
    }
    return doc.status || "draft"; // Gunakan 'draft' jika tidak ada status
  };

  const status = getDynamicStatus();

  return (
    <div
      onClick={() => navigate(`/${doc.route}`)}
      className="group cursor-pointer bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-emerald-200 transition-all duration-300"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-gray-800 group-hover:text-emerald-600 transition-colors">
            {doc.title}
          </h3>
          <p className="text-sm text-gray-500">{doc.department}</p>
        </div>
        {status && (
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        )}
      </div>

      {doc.progress !== undefined && (
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium text-gray-800">{doc.progress}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${getProgressColor(doc.progress)}`}
              style={{ width: `${doc.progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex justify-between items-center text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <span>Diperbarui {doc.lastUpdated}</span>
        </div>
        <span className="px-2 py-1 bg-gray-50 rounded-md">{doc.type}</span>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState(null);
  const [progress, setProgress] = useState(null);
  const [authChecked, setAuthChecked] = useState(false); // New state to track if auth was checked

  const [documents, setDocuments] = useState([
    {
      id: 1,
      title: "Evaluasi Diri Berbasis PPEPP",
      type: "Akademik",
      status: "selesai",
      lastUpdated: new Date().toISOString().split('T')[0],
      progress: 0,
      department: "Teknik Informatika",
      route: "ppepp",
      rolesAllowed: ["GKM", "Kaprodi", "Dekan", "Sekretaris Prodi", "Wakil Dekan 1", "Wakil Dekan 2", "Wakil Dekan 3", "Tendik", "Admin"],
    },
    {
      id: 2,
      title: "Manajemen Dokumen",
      type: "Pengelola Dokumen",
      status: null,
      lastUpdated: new Date().toISOString().split('T')[0],
      department: "Teknik Informatika",
      route: "manajemen-dokumen",
      rolesAllowed: ["GKM", "Kaprodi", "Dekan", "Sekretaris Prodi", "Wakil Dekan 1", "Wakil Dekan 2", "Wakil Dekan 3", "Tendik", "Admin"],
    },
    {
      id: 3,
      title: "Log Aktivitas",
      type: "Laporan",
      status: null,
      lastUpdated: new Date().toISOString().split('T')[0],
      department: "Teknik Informatika",
      route: "log-aktivitas",
      rolesAllowed: ["Admin", "GKM", "Kaprodi"],
    },
  ]);

  // Simplified checkAuth
  const checkAuth = useCallback(async () => {
    // Skip if already checked
    if (authChecked) return;

    // Check cache first
    const cachedAuth = getAuthFromCache();
    if (cachedAuth) {
      setRole(cachedAuth.role);
      setIsLoading(false);
      setAuthChecked(true);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setRole(null);
      setIsLoading(false);
      setAuthChecked(true);
      return;
    }

    try {
      const response = await axios.get('https://akredoc.my.id/api/check-auth', {
        headers: {
          Authorization: `Bearer ${token}`
        },
      });

      if (response.data.role) {
        setRole(response.data.role);
        setAuthCache({ role: response.data.role });
      }
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        setRole(null);
      }
    } finally {
      setIsLoading(false);
      setAuthChecked(true);
    }
  }, [authChecked]);

  // Only check auth once when component mounts
  useEffect(() => {
    if (!authChecked) {
      checkAuth();
    }
  }, [checkAuth, authChecked]);

  // Only fetch progress after auth is confirmed and role exists
  useEffect(() => {
    if (role && authChecked) {
      const fetchProgress = async () => {
        try {
          const response = await axios.get('https://akredoc.my.id/api/ppepp/progress', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });

          if (response.data.status === 'success') {
            setProgress(response.data.progress);
            setDocuments((prev) =>
              prev.map((doc) =>
                doc.title === "Evaluasi Diri Berbasis PPEPP"
                  ? { ...doc, progress: response.data.progress }
                  : doc
              )
            );
          }
        } catch (error) {
          console.error('Progress fetch failed:', error);
        }
      };

      fetchProgress();
    }
  }, [role, authChecked]);

  // Filter documents based on search query, selected filter, and role
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch =
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.department.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter =
        selectedFilter === "all" || doc.status === selectedFilter;
      const roleMatches =
        role && doc.rolesAllowed.some(r => r.toLowerCase() === role.toLowerCase());

      return matchesSearch && matchesFilter && roleMatches;
    });
  }, [documents, searchQuery, selectedFilter, role]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Header Section */}
      <div className="mb-4 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dasbor</h1>
        <p className="mt-1 text-sm text-gray-500">
          Selamat datang kembali! Berikut ikhtisar dokumen dan tugas Anda.
        </p>
      </div>

      {/* Reminder Section */}
      <SimpleReminderPopup />

      {/* Search Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Cari..."
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-800"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Documents Grid - Now above the calendar */}
      <div className="mb-4 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Dasbor</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {isLoading ? (
            <div className="col-span-full flex justify-center py-16">
              <RefreshCw className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
          ) : filteredDocuments.length > 0 ? (
            filteredDocuments.map((doc) => (
              <DocumentCard key={doc.id} doc={doc} />
            ))
          ) : (
            <div className="col-span-full text-center py-16">
              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Tidak ada yang ditemukan
                </h3>
                <p className="text-gray-500">
                  Coba sesuaikan pencarian untuk menemukan apa yang Anda cari.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Calendar Section - Now below the documents */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Kalendar</h2>
        <DashboardCalendar />
      </div>
    </div>
  );
};

export default Dashboard;