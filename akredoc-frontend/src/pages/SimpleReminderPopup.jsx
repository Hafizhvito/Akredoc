import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const SimpleReminderPopup = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 relative shadow-lg">
                <button
                    onClick={() => setIsVisible(false)}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="space-y-6">
                    <div className="text-center">
                        <h3 className="text-2xl font-semibold text-gray-900">Selamat Datang Kembali</h3>
                        <p className="text-gray-600 mt-2">Berikut adalah pengingat aktivitas Anda</p>
                    </div>

                    <div className="space-y-3">
                        <p className="text-gray-800 font-medium">Daftar aktivitas yang perlu diselesaikan:</p>
                        <ul className="space-y-2">
                            {[
                                'Melengkapi dan mengecek dokumen evaluasi diri PPEPP',
                                'Memeriksa jadwal rapat dan kegiatan akademik mendatang',
                                'Memperbarui progress dokumen akademik'
                            ].map((item, index) => (
                                <li key={index} className="flex items-center gap-2 text-gray-600">
                                    <span className="text-emerald-500">•</span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <button
                        onClick={() => setIsVisible(false)}
                        className="w-full bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SimpleReminderPopup;