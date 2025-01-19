import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
    Search, Trash2, Edit3, Download, Save
} from 'lucide-react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

// Utility: Create axios instance with interceptors
const createAxiosInstance = () => {
    const axiosInstance = axios.create({
        baseURL: 'https://akredoc.my.id/api'
    });

    axiosInstance.interceptors.request.use(
        (config) => {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers['Authorization'] = `Bearer ${token}`;
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    axiosInstance.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response && error.response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
            return Promise.reject(error);
        }
    );

    return axiosInstance;
};

// Utility: Handle errors consistently
const handleError = (error, defaultMessage) => {
    console.error(error);
    return error.response?.data?.message || defaultMessage;
};

const ManajemenDokumen = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [documents, setDocuments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingDoc, setEditingDoc] = useState(null);
    const [deletingDocId, setDeletingDocId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [documentsPerPage, setDocumentsPerPage] = useState(10);
    const [selectedDocuments, setSelectedDocuments] = useState([]);

    const axiosInstance = useMemo(() => createAxiosInstance(), []);

    // Fetch Documents
    const fetchDocuments = async () => {
        setIsLoading(true);
        try {
            const response = await axiosInstance.get('/ppepp/documents');
            setDocuments(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            toast.error(handleError(error, 'Gagal memuat dokumen'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    const handleDownload = async (doc) => {
        try {
            console.log(`Attempting to download document ID: ${doc.id}`);

            // Check if document is PPEPP type
            if (doc.type === 'PPEPP') {
                // For PPEPP documents, show all format options
                const { value: format } = await Swal.fire({
                    title: 'Pilih Format Download',
                    input: 'select',
                    inputOptions: {
                        'txt': 'Text (.txt)',
                        'pdf': 'PDF (.pdf)',
                        'xlsx': 'Excel (.xlsx)',
                        'docx': 'Word (.docx)',
                        'pptx': 'PowerPoint (.pptx)'
                    },
                    inputPlaceholder: 'Pilih format dokumen',
                    showCancelButton: true,
                    inputValidator: (value) => value ? null : 'Anda harus memilih format dokumen'
                });

                if (format) {
                    const response = await axiosInstance.get(`/documents/${doc.id}/download`, {
                        params: { format },
                        responseType: 'blob'
                    });

                    const url = window.URL.createObjectURL(new Blob([response.data]));
                    const link = document.createElement('a');
                    link.href = url;
                    const filename = `${doc.name.replace(/^[0-9a-f]+_/, '')}.${format}`; // Remove uniqid prefix and add extension
                    link.setAttribute('download', filename);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();

                    toast.success(`Dokumen berhasil diunduh dalam format ${format.toUpperCase()}`);
                }
            } else {
                // For uploaded files (non-PPEPP), download original directly
                const response = await axiosInstance.get(`/documents/${doc.id}/download`, {
                    params: { format: 'original' },
                    responseType: 'blob'
                });

                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                const filename = doc.name.replace(/^[0-9a-f]+_/, ''); // Remove the uniqid prefix
                link.setAttribute('download', filename);
                document.body.appendChild(link);
                link.click();
                link.remove();

                toast.success('Dokumen berhasil diunduh');
            }
        } catch (error) {
            toast.error(handleError(error, 'Gagal mengunduh dokumen'));
        }
    };

    // Delete Single Document
    const handleDelete = async (docId) => {
        if (!docId) {
            toast.error('ID dokumen tidak valid');
            return;
        }

        const result = await Swal.fire({
            title: 'Konfirmasi Hapus Dokumen',
            text: 'Apakah Anda yakin ingin menghapus dokumen ini? Tindakan ini tidak dapat dibatalkan.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal'
        });

        if (result.isConfirmed) {
            try {
                setDeletingDocId(docId);
                await axiosInstance.delete(`/documents/${docId}`);

                Swal.fire({
                    title: 'Dokumen Dihapus!',
                    text: 'Dokumen Anda telah berhasil dihapus.',
                    icon: 'success',
                    confirmButtonColor: '#10B981'
                });

                fetchDocuments();
            } catch (error) {
                Swal.fire({
                    title: 'Gagal Menghapus!',
                    text: handleError(error, 'Gagal menghapus dokumen'),
                    icon: 'error',
                    confirmButtonColor: '#EF4444'
                });
            } finally {
                setDeletingDocId(null);
            }
        }
    };

    // Multi-Select Handlers
    const handleSelectDocument = (docId) => {
        setSelectedDocuments(prev =>
            prev.includes(docId)
                ? prev.filter(id => id !== docId)
                : [...prev, docId]
        );
    };

    const handleSelectAll = () => {
        const allDocIds = filteredDocuments.map(doc => doc.id);
        setSelectedDocuments(
            selectedDocuments.length === allDocIds.length ? [] : allDocIds
        );
    };

    // Di ManajemenDokumen.jsx
    const handleBulkDelete = async () => {
        if (selectedDocuments.length === 0) {
            toast.warning('Pilih dokumen terlebih dahulu');
            return;
        }

        const result = await Swal.fire({
            title: `Konfirmasi Hapus ${selectedDocuments.length} Dokumen`,
            text: 'Apakah Anda yakin ingin menghapus dokumen yang dipilih?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal'
        });

        if (result.isConfirmed) {
            try {
                // Hapus dokumen satu per satu seperti penghapusan manual
                for (let i = 0; i < selectedDocuments.length; i++) {
                    const docId = selectedDocuments[i];

                    // Menghapus dokumen satu per satu
                    await axiosInstance.delete(`/documents/${docId}`);
                    // Simulasi dengan memberi delay supaya penghapusan terlihat satu per satu
                    await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay

                    // Menampilkan notifikasi setelah setiap dokumen dihapus
                    Swal.fire({
                        title: 'Dokumen Dihapus!',
                        text: `Dokumen dengan ID ${docId} telah berhasil dihapus.`,
                        icon: 'success',
                        confirmButtonColor: '#10B981'
                    });
                }

                toast.success(`Berhasil menghapus ${selectedDocuments.length} dokumen`);
                fetchDocuments();  // Ambil data terbaru setelah penghapusan
                setSelectedDocuments([]);  // Reset selectedDocuments setelah penghapusan
            } catch (error) {
                Swal.fire({
                    title: 'Gagal Menghapus!',
                    text: handleError(error, 'Gagal menghapus dokumen'),
                    icon: 'error',
                    confirmButtonColor: '#EF4444'
                });
            }
        }
    };

    // Filtering and Pagination
    const filteredDocuments = useMemo(() => {
        return documents
            .filter((doc) =>
                doc.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .slice(
                (currentPage - 1) * documentsPerPage,
                currentPage * documentsPerPage
            );
    }, [documents, searchQuery, currentPage, documentsPerPage]);

    const totalPages = useMemo(() =>
        Math.ceil(
            documents.filter((doc) =>
                doc.name.toLowerCase().includes(searchQuery.toLowerCase())
            ).length / documentsPerPage
        ),
        [documents, searchQuery, documentsPerPage]
    );


    const Pagination = () => {
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
                        value={documentsPerPage}
                        onChange={(e) => {
                            setDocumentsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                        }}
                        className="bg-white text-gray-700 text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 appearance-none cursor-pointer"
                    >
                        {[10, 20, 50, 100].map(num => (
                            <option key={num} value={num}>{num}</option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 text-sm font-medium rounded-md text-white bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                        Pertama
                    </button>

                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 text-sm font-medium rounded-md text-white bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                        Sebelumnya
                    </button>

                    <div className="flex items-center gap-1">
                        {getPageNumbers().map((number) => (
                            <button
                                key={number}
                                onClick={() => setCurrentPage(number)}
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
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 text-sm font-medium rounded-md text-white bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                        Selanjutnya
                    </button>

                    <button
                        onClick={() => setCurrentPage(totalPages)}
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
        <div className="min-h-screen bg-gray-50">
            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
                    <div className="flex items-center gap-4">
                        <Edit3 className="h-8 w-8 text-emerald-500" />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Manajemen Dokumen</h1>
                            <p className="text-sm text-gray-500">Kelola dokumen Anda dengan mudah</p>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
                        <input
                            type="text"
                            placeholder="Cari dokumen..."
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-full focus:ring-blue-500 focus:border-blue-500 text-gray-800 bg-white"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                </div>

                {/* Bulk Delete Button */}
                {selectedDocuments.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex items-center justify-between">
                        <span>
                            {selectedDocuments.length} dokumen dipilih
                        </span>
                        <button
                            onClick={handleBulkDelete}
                            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-2"
                        >
                            <Trash2 className="h-5 w-5" />
                            Hapus Dokumen Terpilih
                        </button>
                    </div>
                )}

                {/* Document Table */}
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
                                        <th className="px-4 py-3 w-12">
                                            <input
                                                type="checkbox"
                                                checked={selectedDocuments.length === filteredDocuments.length && filteredDocuments.length > 0}
                                                onChange={handleSelectAll}
                                                className="form-checkbox h-5 w-5 text-emerald-600"
                                            />
                                        </th>
                                        {['Nama Dokumen', 'Tipe', 'Kriteria', 'Ukuran', 'Pengunggah', 'Aksi'].map((header) => (
                                            <th
                                                key={header}
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                            >
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredDocuments.length > 0 ? (
                                        filteredDocuments.map((doc) => (
                                            <tr
                                                key={doc.id}
                                                className="hover:bg-gray-50 transition-colors"
                                            >
                                                <td className="px-4 py-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedDocuments.includes(doc.id)}
                                                        onChange={() => handleSelectDocument(doc.id)}
                                                        className="form-checkbox h-5 w-5 text-emerald-600"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {doc.name.replace(/^[0-9a-f]+_/, '')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                                                    {doc.type}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {doc.criteria || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {(doc.size / 1024).toFixed(2)} KB
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {doc.user?.name || 'Tidak Diketahui'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleDownload(doc)}
                                                            className="px-3 py-2 text-sm bg-emerald-500 text-white rounded-md hover:bg-emerald-600 flex items-center gap-1 transition-colors"
                                                        >
                                                            <Download className="h-4 w-4" />
                                                            Unduh
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(doc.id)}
                                                            disabled={deletingDocId === doc.id}
                                                            className={`px-3 py-2 text-sm text-white rounded-md flex items-center gap-1 transition-colors ${deletingDocId === doc.id
                                                                ? 'bg-red-300'
                                                                : 'bg-red-500 hover:bg-red-600'
                                                                }`}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                            Hapus
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                                                Tidak ada dokumen yang ditemukan.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {!isLoading && totalPages > 1 && <Pagination />}
                </div>
            </main>
        </div>
    );
};

export default ManajemenDokumen;
