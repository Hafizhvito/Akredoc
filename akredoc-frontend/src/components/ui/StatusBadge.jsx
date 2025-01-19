// File: src/components/ui/StatusBadge.jsx
import React from 'react';

const StatusBadge = ({ status }) => {
    const variants = {
        complete: "bg-emerald-100 text-emerald-800 border-2 border-emerald-200 hover:bg-emerald-200 transition-colors",
        "in-progress": "bg-blue-100 text-blue-800 border-2 border-blue-200 hover:bg-blue-200 transition-colors",
        pending: "bg-rose-100 text-rose-800 border-2 border-rose-200 hover:bg-rose-200 transition-colors",
    };

    return (
        <span className={`px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm ${variants[status]}`}>
            {status === 'complete' && 'Sub Standar Mutu'}
            {status === 'in-progress' && 'Sudah Diisi'}
            {status === 'pending' && 'Belum Diisi'}
        </span>
    );
};

export default StatusBadge;