import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const Statistics = () => {
    const [statistics, setStatistics] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedRole, setSelectedRole] = useState(null);
    const [activeTab, setActiveTab] = useState('ikhtisar');

    const CHART_COLORS = [
        '#10B981', // Emerald
        '#6366F1', // Indigo
        '#F59E0B', // Amber
        '#EC4899', // Pink
        '#8B5CF6', // Purple
        '#14B8A6'  // Teal
    ];

    useEffect(() => {
        const fetchStatistics = async () => {
            try {
                const response = await fetch('https://akredoc.my.id/api/ppepp/statistics', {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                });
                const data = await response.json();

                if (data.status === 'success') {
                    setStatistics(data.data);
                    setLoading(false);
                }
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchStatistics();
        const interval = setInterval(fetchStatistics, 300000);
        return () => clearInterval(interval);
    }, []);

    const StatusBadge = ({ status, count }) => {
        const config = {
            complete: {
                icon: CheckCircle,
                color: 'text-emerald-700',
                bg: 'bg-emerald-100 border-emerald-200',
                iconColor: 'text-emerald-600'
            },
            incomplete: {
                icon: XCircle,
                color: 'text-red-700',
                bg: 'bg-red-100 border-red-200',
                iconColor: 'text-red-600'
            }
        }[status] || {
            icon: AlertCircle,
            color: 'text-amber-700',
            bg: 'bg-amber-100 border-amber-200',
            iconColor: 'text-amber-600'
        };

        const Icon = config.icon;

        return (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-md border ${config.bg} shadow-sm`}>
                <Icon className={`w-5 h-5 ${config.iconColor}`} />
                <span className={`text-sm font-semibold capitalize ${config.color}`}>
                    {status === 'complete' ? 'Selesai' : status === 'incomplete' ? 'Belum Selesai' : 'Perhatian'}
                    {count !== undefined && ` (${count})`}
                </span>
            </div>
        );
    };

    const ProgressCount = ({ current, total }) => (
        <div className="flex items-center gap-2">
            <span className="bg-white px-3 py-1 rounded-md border border-gray-200 shadow-sm font-mono text-sm">
                <span className="text-red-600 font-bold">{current}</span>
                <span className="text-gray-500">/</span>
                <span className="text-gray-700 font-medium">{total}</span>
            </span>
            <StatusBadge status="incomplete" />
        </div>
    );

    const DetailedSection = ({ code, data }) => {
        if (typeof data === 'object' && data.status) {
            return (
                <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
                    <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-800">{code}</span>
                        <StatusBadge status={data.status} />
                    </div>
                </div>
            );
        }

        return (
            <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
                <div className="font-medium text-gray-800 mb-3 pb-2 border-b">{code}</div>
                <div className="space-y-3">
                    {Object.entries(data).map(([subSection, details]) => (
                        <div key={subSection} className="flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-700">{subSection}:</span>
                                <ProgressCount
                                    current={details.uploaded}
                                    total={details.required}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const pieChartData = useMemo(() => {
        return Object.entries(statistics).map(([role, users]) => ({
            role,
            completion: users.reduce((acc, user) => {
                const totalSections = Object.keys(user.sections).length;
                const completedSections = Object.values(user.sections).filter(section =>
                    section.status === 'complete' ||
                    (Object.values(section).every(s => s.status === 'complete'))
                ).length;
                return acc + (completedSections / totalSections * 100);
            }, 0) / users.length
        }));
    }, [statistics]);

    const handlePieClick = (data) => {
        if (data && data.payload) {
            setSelectedRole(data.payload.role);
            setActiveTab('detail');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 p-6 rounded-lg">
                <div className="text-red-600">Terjadi kesalahan: {error}</div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6 bg-gray-50">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-900">Ikhtisar Progres PPEPP</h2>
                        <span className="text-sm text-gray-500">
                            Terakhir Diperbarui: {new Date().toLocaleString('id-ID')}
                        </span>
                    </div>
                </div>

                <div className="flex space-x-2 p-4 border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('ikhtisar')}
                        className={`px-4 py-2 rounded-lg transition-colors focus:outline-none ${activeTab === 'ikhtisar'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-gray-100 hover:bg-emerald-50 text-gray-700'
                            }`}
                    >
                        Ikhtisar
                    </button>
                    {selectedRole && (
                        <button
                            onClick={() => setActiveTab('detail')}
                            className={`px-4 py-2 rounded-lg transition-colors focus:outline-none ${activeTab === 'detail'
                                ? 'bg-emerald-500 text-white'
                                : 'bg-gray-100 hover:bg-emerald-50 text-gray-700'
                                }`}
                        >
                            Detail {selectedRole}
                        </button>
                    )}
                </div>

                <div className="p-6">
                    {activeTab === 'ikhtisar' ? (
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="h-96">
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie
                                            data={pieChartData}
                                            dataKey="completion"
                                            nameKey="role"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius="60%"
                                            outerRadius="80%"
                                            paddingAngle={2}
                                            onClick={handlePieClick}
                                            label={({ role, completion }) =>
                                                `${role} (${completion.toFixed(0)}%)`}
                                        >
                                            {pieChartData.map((_, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                                                    className="cursor-pointer hover:opacity-80"
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend
                                            onClick={(entry) => {
                                                setSelectedRole(entry.role);
                                                setActiveTab('detail');
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-4">
                                {Object.entries(statistics).map(([role, users]) => (
                                    <div
                                        key={role}
                                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 
                                                cursor-pointer hover:border-emerald-200 transition-colors"
                                        onClick={() => {
                                            setSelectedRole(role);
                                            setActiveTab('detail');
                                        }}
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="font-semibold text-gray-900">{role}</h3>
                                            <span className="text-sm text-emerald-600 bg-emerald-50 
                                                        px-3 py-1 rounded-full border border-emerald-200">
                                                {users.length} pengguna
                                            </span>
                                        </div>
                                        <div className="space-y-2">
                                            {users.map((user, idx) => (
                                                <div key={idx} className="text-sm text-gray-600">
                                                    {user.user}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {selectedRole && statistics[selectedRole]?.map((userData, userIndex) => (
                                <div key={userIndex} className="bg-gray-50 rounded-lg shadow-md p-6 border border-gray-200">
                                    <div className="border-b border-gray-300 pb-4 mb-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {userData.user}
                                            </h3>
                                            <button
                                                onClick={() => setActiveTab('ikhtisar')}
                                                className="px-4 py-2 rounded-md bg-emerald-50 text-emerald-700 
                                                        hover:bg-emerald-100 border border-emerald-200 focus:outline-none"
                                            >
                                                Kembali ke Ikhtisar
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {Object.entries(userData.sections).map(([code, data]) => (
                                            <DetailedSection key={code} code={code} data={data} />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Statistics;