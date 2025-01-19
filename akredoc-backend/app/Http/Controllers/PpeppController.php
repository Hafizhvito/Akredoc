<?php

namespace App\Http\Controllers;

use App\Models\PpeppSection;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use App\Models\Document;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\UploadedFile;
use Illuminate\Foundation\Auth\User;

class PpeppController extends Controller

{
    public function saveSection(Request $request)
    {
        try {
            // Pastikan pengguna terautentikasi
            if (!Auth::check()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Anda harus login terlebih dahulu'
                ], 401);
            }
    
            // Validasi data
            $validated = $request->validate([
                'section_code' => [
                    'required', 
                    'string', 
                    'in:A,B1,B2,B3,B4,B5,B6,B7,B8,C1,C2,C3,C4,C5,C6,C7,C8,C9,D1,D2,D3,D4'
                ],
                'content' => [
                    'nullable', 
                    'string', 
                    'max:10000'
                ],
                'detail' => [
                    'nullable', 
                    'string', 
                    'in:PENETAPAN,PELAKSANAAN,EVALUASI,PENGENDALIAN,PENINGKATAN'
                ],
            ], [
                'section_code.in' => 'Kode section tidak valid.',
                'content.max' => 'Konten terlalu panjang (maks 10000 karakter).',
                'detail.in' => 'Detail harus sesuai dengan kategori yang diizinkan.',
            ]);
    
            // Mulai transaksi
            DB::beginTransaction();
    
            // Simpan atau perbarui data section
            $section = PpeppSection::updateOrCreate(
                [
                    'section_code' => $validated['section_code'],
                    'user_id' => Auth::id(),
                ],
                [
                    'section_name' => $this->getSectionName($validated['section_code']),
                    'content' => $validated['content'] ?? '',
                    'status' => 'sukses'
                ]
            );
    
            // Tambahkan logging aktivitas
            $isNewSection = $section->wasRecentlyCreated;
            $action = $isNewSection ? 'create' : 'update';
    
            ActivityLog::create([
                'user_id' => Auth::id(),
                'action' => $action,
                'action_type' => 'ppepp_section',
                'action_id' => $section->id,
                'description' => sprintf(
                    '%s bagian PPEPP %s (%s)', 
                    ucfirst($action), 
                    $this->getSectionName($validated['section_code']), 
                    $validated['section_code']
                ),
                'ip_address' => $request->ip()
            ]);
    
            // Simpan atau perbarui dokumen terkait
            $document = Document::updateOrCreate(
                [
                    'ppepp_section_id' => $section->id,
                    'user_id' => Auth::id(),
                    'detail' => $validated['detail'] ?? null, // Pastikan detail diupdate
                ],
                [
                    'name' => "PPEPP_{$section->section_code}_{$section->id}",
                    'type' => 'PPEPP',
                    'size' => strlen($validated['content'] ?? ''),
                    'status' => 'active'
                ]
            );
    
            // Commit transaksi
            DB::commit();
    
            // Kembalikan respon sukses
            return response()->json([
                'status' => 'success',
                'message' => 'Bagian berhasil disimpan',
                'data' => [
                    'section' => $section,
                    'document' => $document
                ]
            ]);
    
        } catch (ValidationException $e) {
            DB::rollBack();
    
            // Log kesalahan validasi
            ActivityLog::create([
                'user_id' => Auth::id(),
                'action' => 'validation_error',
                'action_type' => 'ppepp_section',
                'description' => 'Kesalahan validasi saat menyimpan bagian PPEPP',
                'ip_address' => $request->ip()
            ]);
    
            return response()->json([
                'status' => 'error',
                'message' => 'Kesalahan validasi',
                'errors' => $e->errors()
            ], 422);
    
        } catch (\Exception $e) {
            DB::rollBack();
    
            // Log kesalahan server
            ActivityLog::create([
                'user_id' => Auth::id(),
                'action' => 'server_error',
                'action_type' => 'ppepp_section',
                'description' => 'Kesalahan server saat menyimpan bagian PPEPP: ' . $e->getMessage(),
                'ip_address' => $request->ip()
            ]);
    
            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan server saat menyimpan bagian',
                'error_details' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }
    

// Tambahkan metode untuk mendapatkan log aktivitas
public function getActivityLogs()
{
    try {
        // Ambil log aktivitas terkait PPEPP untuk pengguna saat ini
        $logs = ActivityLog::where('action_type', 'ppepp_section')
            ->where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->paginate(50); // Batasi 50 log terakhir

        return response()->json([
            'status' => 'success',
            'data' => $logs
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'message' => 'Gagal mengambil log aktivitas'
        ], 500);
    }
}
    

    // PpeppController.php
    public function getSection($code)
    {
        try {
            $section = PpeppSection::where('section_code', $code)
                ->where('user_id', Auth::id())
                ->first();

            if (!$section) {
                // Jika section belum ada, kembalikan section kosong
                return response()->json([
                    'status' => 'success',
                    'data' => [
                        'section_code' => $code,
                        'content' => ''
                    ]
                ]);
            }

            return response()->json([
                'status' => 'success',
                'data' => $section
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching PPEPP section: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Server error occurred while fetching section'
            ], 500);
        }
    }

    public function getAllSections()
{
    try {
        $sections = PpeppSection::where('user_id', Auth::id())
            ->orderBy('section_code', 'asc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $sections
        ]);
    } catch (\Exception $e) {
        Log::error('Error fetching all PPEPP sections: ' . $e->getMessage());
        return response()->json([
            'status' => 'error',
            'message' => 'Server error occurred while fetching sections'
        ], 500);
    }
}

private function getSectionName($sectionCode)
{
    $sectionNames = [
        'A' => 'Kondisi Eksternal',
        'B1' => 'Sejarah Unit Pengelola Program Studi',
        'B2' => 'Visi, Misi, Tujuan, Strategi, dan Tata Nilai',
        'B3' => 'Organisasi dan Tata Kerja',
        'B4' => 'Mahasiswa dan Lulusan',
        'B5' => 'Dosen dan Tenaga Kependidikan',
        'B6' => 'Keuangan, Sarana, dan Prasarana',
        'B7' => 'Sistem Penjaminan Mutu',
        'B8' => 'Kinerja Unit Pengelola Program Studi',
        'D1' => 'Analisis Capaian Kinerja',
        'D2' => 'Analisis SWOT atau Analisis Lain yang Relevan',
        'D3' => 'Strategi Pengembangan',
        'D4' => 'Program Keberlanjutan',
        'C1' => 'Visi, Misi, Tujuan dan Strategi',
        'C2' => 'Tata Kelola, Tata Pamong, dan Kerjasama',
        'C3' => 'Mahasiswa',
        'C4' => 'Sumber Daya Manusia',
        'C5' => 'Keuangan, Sarana, dan Prasarana',
        'C6' => 'Pendidikan',
        'C7' => 'Penelitian',
        'C8' => 'Pengabdian Kepada Masyarakat',
        'C9' => 'Kerjasama',

    ];

    return $sectionNames[$sectionCode] ?? $sectionCode;
}

// Fungsi untuk upload dokumen
public function uploadDocument(Request $request) {
    try {
        // Validasi input
        $validator = Validator::make($request->all(), [
            'section_code' => 'required|string|max:100',
            'file' => 'required|file|max:10240', // Maksimal 10MB
            'detail' => 'required|string|max:100',
        ], [
            'file.max' => 'Ukuran file maksimal 10MB.',
            'file.required' => 'File harus diunggah.',
            'detail.required' => 'Detail harus diisi.',
            'detail.max' => 'Detail tidak boleh lebih dari 100 karakter.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validasi gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Dapatkan atau buat section berdasarkan section_code
        $section = PpeppSection::where('section_code', $request->input('section_code'))
            ->where('user_id', Auth::id())
            ->first();

        if (!$section) {
            // Jika section belum ada, buat section baru
            $section = PpeppSection::create([
                'user_id' => Auth::id(),
                'section_code' => $request->input('section_code'),
                'section_name' => $this->getSectionName($request->input('section_code')),
                'content' => '',
                'status' => 'draft',
                'detail' => '',
            ]);
        }

        // Ambil informasi pengguna
        $user = Auth::user();
        /** @var UploadedFile $file */
        $file = $request->file('file');
        $originalFileName = $file->getClientOriginalName();
        $fileName = $originalFileName;

        // Simpan file dan dapatkan path relatif
        $filePath = $file->storeAs("documents/{$user->id}", $fileName, 'public');

        // Simpan informasi dokumen ke database
        $document = Document::create([
            'name' => $fileName,
            'type' => $file->getClientMimeType(),
            'size' => $file->getSize(),
            'user_id' => $user->id,
            'ppepp_section_id' => $section->id,
            'status' => 'active',
            'detail' => $request->input('detail'), // Simpan detail ke kolom
        ]);

        // Logging aktivitas
        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'upload',
            'action_type' => 'ppepp_document',
            'action_id' => $document->id,
            'description' => sprintf(
                'Mengunggah dokumen "%s" untuk bagian PPEPP %s (%s), Detail: %s',
                $originalFileName,
                $section->section_name,
                $section->section_code,
                $request->input('detail')
            ),
            'ip_address' => $request->ip(),
        ]);

        // Kembalikan respon sukses
        return response()->json([
            'status' => 'success',
            'message' => 'Dokumen berhasil diunggah',
            'data' => $document,
        ], 201);

    } catch (ValidationException $e) {
        // Penanganan error validasi
        return response()->json([
            'status' => 'error',
            'message' => 'Validasi gagal',
            'errors' => $e->errors(),
        ], 422);
    } catch (\Exception $e) {
        // Penanganan error umum
        Log::error('Error mengunggah dokumen: ' . $e->getMessage(), ['exception' => $e]);
        return response()->json([
            'status' => 'error',
            'message' => 'Terjadi kesalahan saat mengunggah dokumen.',
        ], 500);
    }
}


    public function getSectionIdByCode(Request $request, $sectionCode)
    {
        try {
            $section = PpeppSection::where('section_code', $sectionCode)
                ->where('user_id', Auth::id())
                ->first();
    
            if (!$section) {
                // Jika section belum ada, buat section baru
                $section = PpeppSection::create([
                    'user_id' => Auth::id(),
                    'section_code' => $sectionCode,
                    'section_name' => $this->getSectionName($sectionCode),
                    'content' => '',
                    'status' => 'draft'
                ]);
            }
    
            Log::info("Section ID for {$sectionCode}: {$section->id}");
    
            return response()->json([
                'status' => 'success',
                'data' => [
                    'id' => $section->id,
                    'section_code' => $section->section_code,
                    'section_name' => $section->section_name
                ]
            ]);
    
        } catch (\Exception $e) {
            Log::error('Error getting section ID: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Server error occurred while fetching section ID'
            ], 500);
        }
    }
    

private function getOrCreateSection(string $sectionCode): PpeppSection
{
    return PpeppSection::updateOrCreate(
        ['section_code' => $sectionCode, 'user_id' => Auth::id()],
        ['section_name' => $this->getSectionName($sectionCode), 'content' => '', 'status' => 'draft']
    );
}

public function createSection(Request $request)
{
    try {
        $validated = $request->validate(['section_code' => 'required|string']);
        $section = PpeppSection::create([
            'user_id' => Auth::id(),
            'section_code' => $validated['section_code'],
            'section_name' => $this->getSectionName($validated['section_code']),
            'content' => '',
            'status' => 'draft'
        ]);
        return response()->json(['status' => 'success', 'data' => $section], 201);
    } catch (\Exception $e) {
        return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
    }
}

// Fungsi untuk menghapus dokumen
public function deleteDocument(Request $request, $id)
    {
        $document = Document::find($id);

        if (!$document) {
            return response()->json(['status' => 'error', 'message' => 'Dokumen tidak ditemukan'], 404);
        }

        $sectionCode = $document->section_code; // Simpan section_code sebelum menghapus dokumen

        $document->delete();

        return response()->json(['status' => 'success', 'section_code' => $sectionCode]);
    }
    
    public function getDocumentsBySection($sectionId)
    {
        try {
            $documents = Document::where('ppepp_section_id', $sectionId)
                ->where('user_id', Auth::id())
                ->get();
    
            // Include metadata in the response
            $documents = $documents->map(function ($document) {
                $document->metadata = json_decode($document->metadata, true);
                return $document;
            });
    
    
            return response()->json([
                'status' => 'success',
                'data' => $documents
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengambil dokumen: ' . $e->getMessage() // Include error message
            ], 500);
        }
    }


        public function getTotalDocuments(Request $request, $sectionCode) {
            try {
                $detail = $request->query('detail'); // Ambil detail dari query parameter
                $query = PpeppSection::where("section_code", $sectionCode)->first()->documents();
        
                if ($detail) {
                    $query->where('detail', $detail);
                }
        
                $total = $query->count();
                return response()->json(['status' => 'success', 'total' => $total]);
            } catch (\Throwable $th) {
                return response()->json(['status' => 'error', 'message' => $th->getMessage()], 500); // Return error status with message
            }
        }

        // (untuk dashboard.jsx)
        public function getProgress()
{
    try {
        $userId = Auth::id();

        // Total section yang harus diselesaikan (124)
        $totalSections = 124;

        // Hitung jumlah section yang selesai
        $completedSections = 0;

        // Bagian A
        $completedSections += $this->checkSectionCompletion('A', $userId);

        // Bagian B (B1-B8)
        for ($i = 1; $i <= 8; $i++) {
            $completedSections += $this->checkSectionCompletion("B{$i}", $userId);
        }

        // Bagian C (C1-C9 dengan PPEPP)
        for ($i = 1; $i <= 9; $i++) {
            $sectionCode = "C{$i}";
            $detailLabels = ['PENETAPAN', 'PELAKSANAAN', 'EVALUASI', 'PENGENDALIAN', 'PENINGKATAN'];
            
            foreach ($detailLabels as $detail) {
                // Cek konten
                $contentCompleted = $this->checkDetailContentCompletion($sectionCode, $detail, $userId);
                
                // Cek dokumen
                $documentsCompleted = $this->checkDetailDocumentsCompletion($sectionCode, $detail, $userId);
                
                if ($contentCompleted || $documentsCompleted) {
                    $completedSections++;
                }
            }
        }

        // Bagian D (D1-D4)
        for ($i = 1; $i <= 4; $i++) {
            $completedSections += $this->checkSectionCompletion("D{$i}", $userId);
        }

        // Hitung progress
        $progress = ($completedSections / $totalSections) * 100;

        return response()->json([
            'status' => 'success',
            'progress' => round($progress),
            'completed_sections' => $completedSections,
            'total_sections' => $totalSections
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'message' => 'Failed to calculate progress',
            'error' => $e->getMessage(),
        ], 500);
    }
}

// Helper method untuk memeriksa kelengkapan section
private function checkSectionCompletion($sectionCode, $userId)
{
    $section = PpeppSection::where('user_id', $userId)
        ->where('section_code', $sectionCode)
        ->first();

    // Section dianggap selesai jika ada content
    return !empty($section?->content) ? 1 : 0;
}

// Helper method untuk memeriksa kelengkapan detail konten (untuk dashboard.jsx)
private function checkDetailContentCompletion($sectionCode, $detail, $userId)
{
    $section = PpeppSection::where('user_id', $userId)
        ->where('section_code', $sectionCode)
        ->first();

    // Cek apakah detail konten sudah terisi
    return !empty($section?->{strtolower($detail)}) ? 1 : 0;
}

// Helper method untuk memeriksa kelengkapan dokumen
private function checkDetailDocumentsCompletion($sectionCode, $detail, $userId)
{
    $section = PpeppSection::where('user_id', $userId)
        ->where('section_code', $sectionCode)
        ->first();

    if (!$section) return 0;

    // Ambil dokumen yang sudah diunggah untuk section dan detail tertentu
    $uploadedDocuments = $section->documents()
        ->where('detail', $detail)
        ->count();

    // Definisikan jumlah dokumen yang dibutuhkan
    $requiredDocuments = $this->getRequiredDocumentsCount($sectionCode, $detail);

    return $uploadedDocuments >= $requiredDocuments ? 1 : 0;
}

// Method untuk mendapatkan jumlah dokumen yang dibutuhkan (untuk dashboard.jsx)
private function getRequiredDocumentsCount($sectionCode, $detail)
{
    $requirements = [
        'C1' => ['PENETAPAN' => 3, 'PELAKSANAAN' => 3, 'EVALUASI' => 1, 'PENGENDALIAN' => 1, 'PENINGKATAN' => 1],
        'C2' => ['PENETAPAN' => 4, 'PELAKSANAAN' => 3, 'EVALUASI' => 1, 'PENGENDALIAN' => 1, 'PENINGKATAN' => 1],
        'C3' => ['PENETAPAN' => 3, 'PELAKSANAAN' => 3, 'EVALUASI' => 1, 'PENGENDALIAN' => 1, 'PENINGKATAN' => 1],
        'C4' => ['PENETAPAN' => 4, 'PELAKSANAAN' => 4, 'EVALUASI' => 1, 'PENGENDALIAN' => 1, 'PENINGKATAN' => 1],
        'C5' => ['PENETAPAN' => 2, 'PELAKSANAAN' => 2, 'EVALUASI' => 1, 'PENGENDALIAN' => 1, 'PENINGKATAN' => 1],
        'C6' => ['PENETAPAN' => 6, 'PELAKSANAAN' => 6, 'EVALUASI' => 1, 'PENGENDALIAN' => 1, 'PENINGKATAN' => 1],
        'C7' => ['PENETAPAN' => 4, 'PELAKSANAAN' => 4, 'EVALUASI' => 1, 'PENGENDALIAN' => 1, 'PENINGKATAN' => 1],
        'C8' => ['PENETAPAN' => 4, 'PELAKSANAAN' => 4, 'EVALUASI' => 1, 'PENGENDALIAN' => 1, 'PENINGKATAN' => 1],
        'C9' => ['PENETAPAN' => 7, 'PELAKSANAAN' => 7, 'EVALUASI' => 1, 'PENGENDALIAN' => 1, 'PENINGKATAN' => 1],
    ];

    return $requirements[$sectionCode][$detail] ?? 0;
}

// (untuk Statisctics.jsx)
public function getStatistics()
{
    try {
        $roles = ['Kaprodi', 'Sekretaris Prodi', 'Dekan', 'Wakil Dekan 1', 'Wakil Dekan 2', 'Wakil Dekan 3', 'Tendik'];
        $statistics = [];

        foreach ($roles as $role) {
            $users = User::where('role', $role)->get();

            $roleData = [];
            foreach ($users as $user) {
                $userSections = [];

                // Sections A, B1-B8, D1-D4 (text-based)
                $textSections = array_merge(['A'], array_map(fn($i) => "B{$i}", range(1, 8)), array_map(fn($i) => "D{$i}", range(1, 4)));
                foreach ($textSections as $sectionCode) {
                    $section = PpeppSection::where('section_code', $sectionCode)
                        ->where('user_id', $user->id)
                        ->first();

                    $userSections[$sectionCode] = [
                        'status' => $section && !empty($section->content) ? 'complete' : 'incomplete',
                        'content' => $section->content ?? null,
                    ];
                }

                // Sections C1-C9 (file-based with details)
                foreach (range(1, 9) as $i) {
                    $sectionCode = "C{$i}";
                    $details = ['PENETAPAN', 'PELAKSANAAN', 'EVALUASI', 'PENGENDALIAN', 'PENINGKATAN'];

                    $detailStatus = [];
                    foreach ($details as $detail) {
                        $uploadedDocs = Document::where('ppepp_section_id', function ($query) use ($user, $sectionCode) {
                            $query->select('id')
                                ->from('ppepp_sections')
                                ->where('section_code', $sectionCode)
                                ->where('user_id', $user->id);
                        })->where('detail', $detail)->count();

                        $requiredDocs = $this->getRequiredDocumentsCount($sectionCode, $detail);
                        $detailStatus[$detail] = [
                            'uploaded' => $uploadedDocs,
                            'required' => $requiredDocs,
                            'status' => $uploadedDocs >= $requiredDocs ? 'complete' : 'incomplete',
                        ];
                    }

                    $userSections[$sectionCode] = $detailStatus;
                }

                $roleData[] = [
                    'user' => $user->name,
                    'sections' => $userSections,
                ];
            }

            $statistics[$role] = $roleData;
        }

        return response()->json([
            'status' => 'success',
            'data' => $statistics,
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'message' => $e->getMessage(),
        ], 500);
    }
}

public function getDetailedStatistics()
{
   
}
}
