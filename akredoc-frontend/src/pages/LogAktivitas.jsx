import React, { useState, useEffect, useMemo } from 'react';
import { Search, Edit3, Filter, ChevronDown } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const LogAktivitas = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [logsPerPage, setLogsPerPage] = useState(10);
  const [startDate, setStartDate] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Fetch Logs
  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://akredoc.my.id/api/activity-logs', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          window.location.replace('/login');
          return;
        }
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Filtering and Pagination
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const action = log.action?.toLowerCase().trim() || '';
      const matchesSearch = action.includes(searchQuery.toLowerCase());
      const matchesFilter = selectedFilter === 'all' || action === selectedFilter;
      const matchesDate = !startDate || new Date(log.created_at).toDateString() === startDate.toDateString();
      return matchesSearch && matchesFilter && matchesDate;
    });
  }, [logs, searchQuery, selectedFilter, startDate]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / logsPerPage));

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedFilter, startDate, logsPerPage]);

  // Ensure current page stays within bounds
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * logsPerPage;
    return filteredLogs.slice(startIndex, startIndex + logsPerPage);
  }, [filteredLogs, currentPage, logsPerPage]);


  const PaginationControls = () => {
    const handlePageChange = (newPage) => {
      if (newPage >= 1 && newPage <= totalPages) {
        setCurrentPage(newPage);
      }
    };

    // Generate page numbers array
    const getPageNumbers = () => {
      const pageNumbers = [];
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
      return pageNumbers;
    };

    return (
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 px-4">
        <div className="flex items-center space-x-2 text-gray-600">
          <span className="text-sm">Dokumen per halaman:</span>
          <select
            value={logsPerPage}
            onChange={(e) => setLogsPerPage(Number(e.target.value))}
            className="bg-white text-gray-700 text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 appearance-none cursor-pointer"
          >
            {[10, 20, 50, 100].map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            className="px-3 py-1.5 text-sm font-medium rounded-md text-white bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Pertama
          </button>

          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1.5 text-sm font-medium rounded-md text-white bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Sebelumnya
          </button>

          <div className="flex items-center gap-1">
            {getPageNumbers().map((number) => (
              <button
                key={number}
                onClick={() => handlePageChange(number)}
                className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition-colors
                  ${currentPage === number
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-emerald-50'
                  }`}
              >
                {number}
              </button>
            ))}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 text-sm font-medium rounded-md text-white bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Selanjutnya
          </button>

          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 text-sm font-medium rounded-md text-white bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Terakhir
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6">
      <main className="max-w-7xl mx-auto py-4 sm:py-8">
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Edit3 className="h-8 w-8 text-emerald-500" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Log Aktivitas</h1>
              <p className="text-sm text-gray-500">Kelola log aktivitas dengan mudah</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
            <input
              type="text"
              placeholder="Cari log aktivitas..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <DatePicker
            selected={startDate}
            onChange={setStartDate}
            placeholderText="Pilih Tanggal"
            className="px-4 py-3 border border-gray-300 rounded-full bg-white focus:ring-2 focus:ring-emerald-500"
          />

          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={`flex items-center gap-2 px-4 py-3 border rounded-full ${selectedFilter !== 'all' ? 'border-emerald-500 text-emerald-600' : 'border-gray-300 text-gray-700'}`}
            >
              <Filter className="h-5 w-5" />
              {selectedFilter !== 'all' ? `Filter: ${selectedFilter}` : 'Filter'}
              <ChevronDown className="h-5 w-5" />
            </button>

            {showFilterMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-10">
                {['all', 'upload', 'edit', 'delete'].map(option => (
                  <button
                    key={option}
                    onClick={() => {
                      setSelectedFilter(option);
                      setShowFilterMenu(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 capitalize ${selectedFilter === option ? 'bg-emerald-100 text-emerald-600' : 'text-gray-700'}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tindakan
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipe Tindakan
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deskripsi
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pengguna
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Waktu
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedLogs.length > 0 ? (
                    paginatedLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {log.action}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                          {log.action_type}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {log.description || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {log.user?.name || 'Tidak Diketahui'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(log.created_at).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                        Tidak ada log yang ditemukan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && totalPages > 1 && <PaginationControls />}
        </div>
      </main>
    </div>
  );
};

export default LogAktivitas;