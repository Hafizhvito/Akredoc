import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const DocumentCard = ({ doc, onUpdateLastSeen }) => {
  const navigate = useNavigate();
  const [timeSinceUpdate, setTimeSinceUpdate] = useState('');

  // Fungsi untuk menghitung waktu sejak update
  const calculateTimeSinceUpdate = () => {
    const updatedDate = new Date(doc.lastUpdated);
    return formatDistanceToNow(updatedDate, { addSuffix: true });
  };

  // Update waktu setiap menit
  useEffect(() => {
    const updateTimer = setInterval(() => {
      setTimeSinceUpdate(calculateTimeSinceUpdate());
    }, 60000); // Update setiap 1 menit

    // Update waktu pertama kali
    setTimeSinceUpdate(calculateTimeSinceUpdate());

    return () => clearInterval(updateTimer);
  }, [doc.lastUpdated]);

  // Fungsi untuk memperbarui waktu saat diklik
  const handleClick = () => {
    // Panggil fungsi untuk memperbarui last updated di parent
    onUpdateLastSeen();
    
    // Navigasi ke halaman terkait
    navigate(`/${doc.route}`);
  };

  const getStatusColor = (status) => {
    const colors = {
      complete: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'in-progress': 'bg-blue-100 text-blue-700 border-blue-200',
      pending: 'bg-amber-100 text-amber-700 border-amber-200',
      default: 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return colors[status] || colors.default;
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'bg-emerald-500';
    if (progress >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div
      onClick={handleClick}
      className="group cursor-pointer bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-emerald-200 transition-all duration-300"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-gray-800 group-hover:text-emerald-600 transition-colors">
            {doc.title}
          </h3>
          <p className="text-sm text-gray-500">{doc.department}</p>
        </div>
        {doc.status && (
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(doc.status)}`}>
            {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
          </span>
        )}
      </div>

      {doc.title === "Evaluasi Diri Berbasis PPEPP" && (
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
          <Clock className="w-4 h-4" />
          <span>Updated {timeSinceUpdate}</span>
        </div>
        <span className="px-2 py-1 bg-gray-50 rounded-md">{doc.type}</span>
      </div>
    </div>
  );
};

export default DocumentCard;