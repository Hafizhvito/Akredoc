// File: src/components/ui/TabButton.jsx
import React from 'react';

const TabButton = ({ tab, activeTab, onClick }) => (
    <button
        onClick={onClick}
        className={`px-6 py-3 rounded-lg text-base capitalize font-medium transition-all duration-300 ${activeTab === tab
                ? "bg-emerald-50 text-emerald-700 shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            }`}
    >
        {tab}
    </button>
);

export default TabButton;