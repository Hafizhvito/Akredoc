import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronDown, ChevronUp, Save, Upload, Edit2, Trash2, FileText, X
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Ppepp = () => {
  const [visibleSections, setVisibleSections] = useState({});
  const [textContent, setTextContent] = useState({});
  const [saveStatus, setSaveStatus] = useState({});
  const [badgeCount, setBadgeCount] = useState({});
  const [documents, setDocuments] = useState({});
  const [uploadStates, setUploadStates] = useState({});
  const [selectedFiles, setSelectedFiles] = useState({});
  const [documentTotals, setDocumentTotals] = useState({});
  const [ppeppProgress, setPpeppProgress] = useState(0);

  const navigate = useNavigate();

  const detailLabels = ['PENETAPAN', 'PELAKSANAAN', 'EVALUASI', 'PENGENDALIAN', 'PENINGKATAN'];

  const generateSectionKey = (prefix, number = '') => {
    return `${prefix}${number}`.toUpperCase();
  };

  const isDetailComplete = (sectionCode, detail) => {
    const totalUploaded = documentTotals[sectionCode]?.[detail] || 0;
    const required = documentRequirements[sectionCode]?.[detail] || 0;

    // Cek jumlah dokumen
    const hasRequiredDocs = totalUploaded >= required;

    // Cek konten teks (jika ada)
    const section = sections.find(s => s.key === sectionCode);
    const hasContent = section?.content?.[detail.toLowerCase()]?.trim().length > 0;

    // Section dianggap complete jika dokumen lengkap DAN konten terisi
    return hasRequiredDocs && hasContent;
  };

  const sections = [
    {
      title: "A. KONDISI EKSTERNAL",
      key: generateSectionKey('A'),
      textArea: true
    },
    {
      title: "B. PROFIL UNIT PENGELOLA PROGRAM STUDI",
      key: generateSectionKey('B'),
      textArea: true,
      subsections: [
        { label: "B.1. Sejarah Unit Pengelola Program Studi", key: generateSectionKey('B', 1), textArea: true },
        { label: "B.2. Visi, Misi, Tujuan, Strategi, dan Tata Nilai", key: generateSectionKey('B', 2), textArea: true },
        { label: "B.3. Organisasi dan Tata Kerja", key: generateSectionKey('B', 3), textArea: true },
        { label: "B.4. Mahasiswa dan Lulusan", key: generateSectionKey('B', 4), textArea: true },
        { label: "B.5. Dosen dan Tenaga Kependidikan", key: generateSectionKey('B', 5), textArea: true },
        { label: "B.6. Keuangan, Sarana, dan Prasarana", key: generateSectionKey('B', 6), textArea: true },
        { label: "B.7. Sistem Penjaminan Mutu", key: generateSectionKey('B', 7), textArea: true },
        { label: "B.8. Kinerja Unit Pengelola Program Studi dan Program Studi yang Diakreditasi", key: generateSectionKey('B', 8), textArea: true },
      ],
    },
    ...Array.from({ length: 9 }, (_, i) => {
      const sectionNumber = i + 1;
      return {
        title: `C.${sectionNumber}. ${['VISI, MISI, TUJUAN DAN STRATEGI', 'TATA KELOLA, TATA PAMONG, DAN KERJASAMA', 'MAHASISWA', 'SUMBER DAYA MANUSIA', 'KEUANGAN, SARANA, DAN PRASARANA', 'PENDIDIKAN', 'PENELITIAN', 'PENGABDIAN KEPADA MASYARAKAT', 'KERJASAMA'][i]}`,
        key: generateSectionKey('C', sectionNumber),
        details: detailLabels.map(label => ({
          label,
          text: `Penjelasan tentang ${label.toLowerCase()} untuk C.${sectionNumber}`
        })),
      };
    }),
    {
      title: "D. ANALISIS DAN PENETAPAN PROGRAM PENGEMBANGAN UNIT PENGELOLA PROGRAM STUDI TERKAIT PROGRAM STUDI YANG DIAKREDITASI",
      key: generateSectionKey('D'),
      textArea: true,
      subsections: [
        { label: "D.1. Analisis Capaian Kinerja", key: generateSectionKey('D', 1), textArea: true },
        { label: "D.2. Analisis SWOT atau Analisis Lain yang Relevan", key: generateSectionKey('D', 2), textArea: true },
        { label: "D.3. Strategi Pengembangan", key: generateSectionKey('D', 3), textArea: true },
        { label: "D.4. Program Keberlanjutan", key: generateSectionKey('D', 4), textArea: true },
      ],
    },
  ];

  const documentRequirements = {
    C1: { PENETAPAN: 3, PELAKSANAAN: 3, EVALUASI: 1, PENGENDALIAN: 1, PENINGKATAN: 1 },
    C2: { PENETAPAN: 4, PELAKSANAAN: 3, EVALUASI: 1, PENGENDALIAN: 1, PENINGKATAN: 1 },
    C3: { PENETAPAN: 3, PELAKSANAAN: 3, EVALUASI: 1, PENGENDALIAN: 1, PENINGKATAN: 1 },
    C4: { PENETAPAN: 4, PELAKSANAAN: 4, EVALUASI: 1, PENGENDALIAN: 1, PENINGKATAN: 1 },
    C5: { PENETAPAN: 2, PELAKSANAAN: 2, EVALUASI: 1, PENGENDALIAN: 1, PENINGKATAN: 1 },
    C6: { PENETAPAN: 6, PELAKSANAAN: 6, EVALUASI: 1, PENGENDALIAN: 1, PENINGKATAN: 1 },
    C7: { PENETAPAN: 4, PELAKSANAAN: 4, EVALUASI: 1, PENGENDALIAN: 1, PENINGKATAN: 1 },
    C8: { PENETAPAN: 4, PELAKSANAAN: 4, EVALUASI: 1, PENGENDALIAN: 1, PENINGKATAN: 1 },
    C9: { PENETAPAN: 7, PELAKSANAAN: 7, EVALUASI: 1, PENGENDALIAN: 1, PENINGKATAN: 1 },
  };

  useEffect(() => {
    const fetchPpeppData = async () => {
      try {
        // const response = await axios.get('http://localhost:8000/api/ppepp/sections', {
        const response = await axios.get('https://akredoc.my.id/api/ppepp/sections', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });

        if (response.data.status === 'success') {
          const sectionsData = response.data.data;
          const newTextContent = {};
          const newVisibleSections = {};
          const newSaveStatus = {};

          sections.forEach((section) => {
            if (section.textArea) {
              newTextContent[section.key] = '';
              newVisibleSections[section.key] = false;
              newSaveStatus[section.key] = '';
            }

            if (section.subsections) {
              section.subsections.forEach((subsection) => {
                newTextContent[subsection.key] = '';
                newVisibleSections[subsection.key] = false;
                newSaveStatus[subsection.key] = '';
              });
            }
          });

          sectionsData.forEach((backendSection) => {
            if (newTextContent.hasOwnProperty(backendSection.section_code)) {
              newTextContent[backendSection.section_code] = backendSection.content || '';
            }
          });

          setTextContent(newTextContent);
          setVisibleSections(newVisibleSections);
          setSaveStatus(newSaveStatus);

          // Handle C sections documents
          const cSections = sectionsData.filter(section => section.section_code.startsWith('C'));
          const documentPromises = cSections.map(async (section) => {
            await fetchSectionDocuments(section.id);
            const details = ['PENETAPAN', 'PELAKSANAAN', 'EVALUASI', 'PENGENDALIAN', 'PENINGKATAN'];
            for (const detail of details) {
              await fetchDocumentTotals(section.section_code, detail);
            }
          });

          await Promise.all(documentPromises);
        }
      } catch (error) {
        console.error("Error fetching PPEPP data:", error);
      }
    };

    fetchPpeppData();
  }, []);


  const fetchDocumentTotals = useCallback(async (sectionKey, detail) => {
    try {
      const response = await axios.get(
        `https://akredoc.my.id/api/documents/${sectionKey}/total?detail=${detail}`, // Tambahkan detail sebagai query parameter
        // `http://localhost:8000/api/documents/${sectionKey}/total?detail=${detail}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      if (response.data.status === 'success') {
        setDocumentTotals((prev) => ({
          ...prev,
          [sectionKey]: {
            ...prev[sectionKey],
            [detail]: response.data.total,
          },
        }));
      } else {
        console.error("Failed to fetch document totals:", response.data.message);
      }
    } catch (error) {
      console.error("Error fetching document totals", error);
    }
  }, []);

  const handleTextChange = (section, value) => setTextContent((prev) => ({ ...prev, [section]: value }));

  const fetchPpeppProgress = async () => {
    try {
      // const response = await axios.get('http://localhost:8000/api/ppepp/progress', {
      const response = await axios.get('https://akredoc.my.id/api/ppepp/progress', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (response.data.status === 'success') {
        setPpeppProgress(response.data.progress);


      }
    } catch (error) {
      console.error("Error fetching PPEPP progress:", error);
    }
  };

  const handleSave = useCallback(async (section) => {
    if (!textContent[section] || textContent[section].trim() === '') {
      setSaveStatus((prev) => ({ ...prev, [section]: 'Konten tidak boleh kosong!' }));
      return;
    }

    try {
      setSaveStatus((prev) => ({ ...prev, [section]: 'Menyimpan...' }));

      // const response = await axios.post('http://localhost:8000/api/ppepp/save-section', {
      const response = await axios.post('https://akredoc.my.id/api/ppepp/save-section', {
        section_code: section,
        content: textContent[section],
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data.status === 'success') {
        setSaveStatus((prev) => ({ ...prev, [section]: 'Berhasil tersimpan!' }));
      } else {
        throw new Error(response.data.message || 'Gagal menyimpan');
      }
    } catch (error) {
      setSaveStatus((prev) => ({
        ...prev,
        [section]: `Gagal menyimpan: ${error.response?.data?.message || error.message}`,
      }));
    }
    // noted need to fix
    await fetchPpeppProgress(); // fetching per save arent good enough 
  }, [textContent]);

  const toggleVisibility = (section) => setVisibleSections((prev) => ({ ...prev, [section]: !prev[section] }));

  const fetchSectionDocuments = useCallback(async (sectionId) => {
    try {
      // const response = await axios.get(`http://localhost:8000/api/ppepp/documents/${sectionId}`, {
      const response = await axios.get(`https://akredoc.my.id/api/ppepp/documents/${sectionId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (response.data.status === 'success') {
        const documents = response.data.data.map(doc => ({
          ...doc,
          detail: doc.detail || "N/A",
        }));

        setDocuments((prev) => ({
          ...prev,
          [sectionId]: documents,
        }));
      }
    } catch (error) {
      console.error(`Error fetching documents for section ${sectionId}:`, error);
    }
  }, []);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        // const response = await axios.get("http://localhost:8000/api/ppepp/documents", {
        const response = await axios.get("https://akredoc.my.id/api/ppepp/documents", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        if (response.data.status === "success") {
          setDocuments(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching documents:", error);
      }
      console.log("Current documents state:", documents);
      console.log("Current document totals state:", documentTotals);
    };

    fetchDocuments();
  }, []);

  const handleFileSelect = (sectionKey, detail, event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFiles((prev) => ({
        ...prev,
        [`${sectionKey}_${detail}`]: file,
      }));
    }
  };

  const fetchDocumentTotalsWithDelay = useCallback((sectionKey, detail, delay = 1000) => {
    setTimeout(() => fetchDocumentTotals(sectionKey, detail), delay);
  }, [fetchDocumentTotals]);

  const handleUpload = async (sectionCode, detail, retries = 3, delay = 1000) => {
    const file = selectedFiles[`${sectionCode}_${detail}`];
    if (!file) {
      alert("Silakan pilih dokumen terlebih dahulu");
      return;
    }

    const section = sections.find((sec) => sec.key === sectionCode);
    const ppeppSectionId = section?.id;

    try {
      const formData = new FormData();
      formData.append("section_code", sectionCode);
      formData.append("file", file);
      formData.append("detail", detail);

      setUploadStates((prev) => ({
        ...prev,
        [`${sectionCode}_${detail}`]: {
          status: "pending",
          message: "Mengunggah...",
          progress: 0,
        },
      }));

      const response = await axios.post("https://akredoc.my.id/api/ppepp/documents/upload", formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadStates((prev) => ({
            ...prev,
            [`${sectionCode}_${detail}`]: {
              status: "pending",
              message: `Mengunggah... ${percentCompleted}%`,
              progress: percentCompleted,
            },
          }));
        },
      });

      if (response.data.status === "success") {
        // Update document totals
        await fetchDocumentTotals(sectionCode, detail);

        // Check completion status
        const isComplete = isDetailComplete(sectionCode, detail);

        setUploadStates((prev) => ({
          ...prev,
          [`${sectionCode}_${detail}`]: {
            status: "success",
            message: `Dokumen berhasil diunggah. Status: ${isComplete ? 'Lengkap' : 'Belum lengkap'}.`,
            progress: 100,
          },
        }));

        // Clear the selected file after successful upload
        setSelectedFiles((prev) => {
          const updated = { ...prev };
          delete updated[`${sectionCode}_${detail}`];
          return updated;
        });

        fetchSectionDocuments(ppeppSectionId);
        fetchDocumentTotalsWithDelay(sectionCode, detail);
      }
    } catch (error) {
      if (error.response?.status === 429 && retries > 0) {
        // Exponential backoff retry
        setTimeout(() => handleUpload(sectionCode, detail, retries - 1, delay * 2), delay);
      } else {
        setUploadStates((prev) => ({
          ...prev,
          [`${sectionCode}_${detail}`]: {
            status: "error",
            message: "Gagal mengunggah dokumen",
            progress: 0,
          },
        }));
      }
    }
    await fetchPpeppProgress();
  };

  useEffect(() => {
    fetchPpeppProgress();
  }, []);

  const handleDeleteDocument = async (documentId, sectionId, detail) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus dokumen ini?')) {
      return;
    }

    try {
      // const response = await axios.delete(`http://localhost:8000/api/ppepp/documents/${documentId}`, {
      const response = await axios.delete(`https://akredoc.my.id/api/ppepp/documents/${documentId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.data.status === 'success') {
        alert('Dokumen berhasil dihapus.');
        fetchSectionDocuments(sectionId); // Refresh documents after deletion
        updateDocumentCounts(sectionId, detail); // Update document count
      } else {
        throw new Error(response.data.message || 'Gagal menghapus dokumen.');
      }
    } catch (error) {
      console.error('Error response:', error.response?.data);
      alert(error.response?.data?.message || 'Gagal menghapus dokumen');
    }
  };


  const renderDocumentManagementSection = (sectionKey, detail) => {
    console.log(documentTotals);
    const uploadKey = `${sectionKey}_${detail}`;
    const maxAllowedFiles = documentRequirements[sectionKey]?.[detail] || 1;
    //const uploadedFilesCount = documentTotals[sectionKey] || 0; 
    const uploadedFilesCount = documentTotals[sectionKey]?.[detail] || 0;
    const remainingFiles = maxAllowedFiles - uploadedFilesCount;

    const handleFileSelect = (sectionKey, detail, e) => {
      const selectedFile = e.target.files[0];
      setSelectedFiles((prevState) => ({
        ...prevState,
        [`${sectionKey}_${detail}`]: selectedFile,
      }));
    };

    const handleFileCancel = (sectionKey, detail) => {
      setSelectedFiles((prevState) => {
        const updatedFiles = { ...prevState };
        delete updatedFiles[`${sectionKey}_${detail}`]; // Hapus file yang dipilih
        return updatedFiles;
      });
    };

    return (
      <div className="mt-4 bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h5 className="text-sm font-semibold text-gray-700">Dokumen untuk {detail}</h5>
        </div>

        <p className="text-gray-600 mt-2 text-sm">
          {`${uploadedFilesCount}/${maxAllowedFiles} dokumen diunggah`}
        </p>

        <div className="mt-2 flex items-center space-x-2">
          {remainingFiles > 0 && (
            <>
              <input
                type="file"
                className="hidden"
                id={`file-upload-${uploadKey}`}
                onChange={(e) => handleFileSelect(sectionKey, detail, e)}
                disabled={remainingFiles <= 0}
              />
              <label
                htmlFor={`file-upload-${uploadKey}`}
                className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-700 cursor-pointer"
              >
                <Upload className="h-5 w-5 mr-2" />
                Pilih Dokumen
              </label>
              {selectedFiles[uploadKey] && (
                <button
                  onClick={() => handleUpload(sectionKey, detail)}
                  className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-700"
                >
                  <Upload className="h-5 w-5 mr-2" />
                  Unggah
                </button>
              )}
            </>
          )}
        </div>

        {/* Tampilkan nama file yang dipilih dengan tombol cancel */}
        {selectedFiles[uploadKey] && (
          <div className="mt-2 flex items-center space-x-2">
            <p className="text-sm text-gray-600">{selectedFiles[uploadKey].name}</p>
            <button
              type="button"
              onClick={() => handleFileCancel(sectionKey, detail)}
              className="text-red-500 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Tampilkan progres upload */}
        {uploadStates[uploadKey]?.progress && (
          <div className="relative w-full h-2 bg-gray-200 rounded mt-3">
            <div
              style={{ width: `${uploadStates[uploadKey].progress}%` }}
              className="absolute top-0 left-0 h-full bg-blue-500 rounded"
            />
          </div>
        )}

        {/* Tampilkan pesan status upload */}
        {uploadStates[uploadKey]?.message && (
          <p className={`text-sm mt-2 ${uploadStates[uploadKey].status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {uploadStates[uploadKey].message}
          </p>
        )}
      </div>
    );
  };

  const renderSectionContent = (section) => {
    if (!section.textArea) return null;

    const renderTextArea = (item) => (
      <div key={item.key || item.label} className="mt-6">
        {item.label && ( // Hanya tampilkan label jika ada subsection
          <label className="block text-lg font-semibold text-gray-800">{item.label}</label>
        )}
        <textarea
          value={textContent[item.key || section.key]}
          onChange={(e) => handleTextChange(item.key || section.key, e.target.value)}
          className="w-full h-48 p-4 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition duration-200 ease-in-out"
          placeholder="Masukkan teks disini..."
        />
        <div className="flex items-center justify-between mt-2">
          <button
            onClick={() => handleSave(item.key || section.key)}
            className="inline-flex items-center px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors gap-2"
          >
            <Save className="h-4 w-4" />
            Simpan
          </button>
          {saveStatus[item.key || section.key] && (
            <span className="text-emerald-500 text-sm animate-fade-in">
              {saveStatus[item.key || section.key]}
            </span>
          )}
        </div>
      </div>
    );

    return section.subsections ? section.subsections.map(renderTextArea) : renderTextArea(section);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.key} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  {section.title}
                </h2>
                <button
                  onClick={() => toggleVisibility(section.key)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {visibleSections[section.key] ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </button>
              </div>
              {visibleSections[section.key] && (
                <>{renderSectionContent(section)}</>
              )}
              {visibleSections[section.key] && section.details && (
                <div className="mt-4 space-y-4">
                  {section.details.map((detail) => (
                    <div key={detail.label} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <h4 className="text-sm font-semibold text-gray-700">{detail.label}</h4>
                        {/* <div className="flex gap-2">
                        {renderDocumentManagementSection(section.key, detail.label)}
                        </div> */}
                      </div>
                      <p className="text-gray-600 mt-2 text-sm">{detail.text}</p>
                      {renderDocumentManagementSection(section.key, detail.label)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Ppepp;