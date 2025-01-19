<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use App\Services\DocumentConverterService;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Storage;

class ManajemenDokumenController extends Controller
{
    protected $documentConverterService;

    public function __construct(DocumentConverterService $documentConverterService)
    {
        $this->documentConverterService = $documentConverterService;
    }

    public function downloadDocument(Request $request, $id)
    {
        try {
            $document = Document::with('ppeppSection')->findOrFail($id);
            $format = $request->input('format', 'original');
    
            // Get CLEAN filename (without uniqid) - ALWAYS use this for downloads
            $originalFileName = preg_replace('/^[0-9a-f]+_/', '', $document->name); //Get original filename without uniqid()
            $cleanFileName = pathinfo($originalFileName, PATHINFO_FILENAME); //Get file name without extension
            $extension = pathinfo($originalFileName, PATHINFO_EXTENSION); //Get file extension
            $finalFileName = $cleanFileName . '.' . $extension; //Combine
    
            if ($format === 'original') {
                $filePath = storage_path('app/public/documents/' . Auth::id() . '/' . $document->name);
    
                if (!file_exists($filePath)) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'File tidak ditemukan'
                    ], 404);
                }
    
                return response()->download($filePath, $finalFileName); 
            }
    
            // Konversi dokumen sesuai format yang dipilih
            $content = $document->ppeppSection->content ?? '';
            switch ($format) {
                case 'pdf':
                    return $this->documentConverterService->convertToPdf($content, $finalFileName . '.pdf'); 
                case 'xlsx':
                    return $this->documentConverterService->convertToExcel($content, $finalFileName . '.xlsx'); 
                case 'docx':
                    return $this->documentConverterService->convertToWord($content, $finalFileName . '.docx'); 
                case 'pptx':
                    return $this->documentConverterService->convertToPowerPoint($content, $finalFileName . '.pptx'); 
                default:
                    // Default: Plain text
                    return response($content, 200, [
                        'Content-Type' => 'text/plain',
                        'Content-Disposition' => 'attachment; filename="' . $finalFileName . '.txt"'
                    ]);
            }
    
        } catch (\Exception $e) {
            Log::error('Download document error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengunduh dokumen',
                'error_details' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Update dokumen berdasarkan ID
     *
     * @param \Illuminate\Http\Request $request
     * @param int $id ID dokumen
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateDocument(Request $request, $id)
    {
        try {
            $document = Document::with('ppeppSection')->findOrFail($id);

            // Validasi input
            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|string|max:255',
                'content' => 'sometimes|string|max:10000'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Cek otorisasi
            if ($document->user_id !== Auth::id()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Anda tidak memiliki izin mengubah dokumen ini'
                ], 403);
            }

            DB::beginTransaction();

            // Update nama dokumen
            if ($request->has('name')) {
                $document->name = $request->name;
            }

            // Update konten di section terkait
            if ($request->has('content') && $document->ppeppSection) {
                $document->ppeppSection->content = $request->content;
                $document->ppeppSection->save();
            }

            $document->save();

            // Log aktivitas update
            ActivityLog::create([
                'user_id' => Auth::id(),
                'action' => 'update',
                'action_type' => 'document',
                'action_id' => $document->id,
                'description' => "Memperbarui dokumen: {$document->name}",
                'ip_address' => $request->ip()
            ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Dokumen berhasil diperbarui',
                'data' => $document
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Update document error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal memperbarui dokumen',
                'error_details' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Hapus dokumen berdasarkan ID
     *
     * @param int $id ID dokumen
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroyDocument($id)
    {
        try {
            Log::info("Mencoba menghapus dokumen dengan ID: {$id}");

            // Temukan dokumen dengan ID
            $document = Document::with('ppeppSection')->findOrFail($id);

            // Cek apakah pengguna memiliki izin untuk menghapus dokumen ini
            if ($document->user_id !== Auth::id()) {
                Log::warning("Pengguna tidak memiliki izin untuk menghapus dokumen ID: {$id}");
                return response()->json([
                    'status' => 'error',
                    'message' => 'Anda tidak memiliki izin menghapus dokumen ini'
                ], 403);
            }

            DB::beginTransaction();

            // Hapus dokumen itu sendiri terlebih dahulu
            Log::info("Menghapus dokumen ID: {$id}");
            $document->delete();

            // Hapus section terkait jika ada
            if ($document->ppeppSection) {
                Log::info("Menghapus section terkait dengan dokumen ID: {$id}");
                $document->ppeppSection->delete();
            }

            // Log aktivitas delete
            ActivityLog::create([
                'user_id' => Auth::id(),
                'action' => 'delete',
                'action_type' => 'document',
                'action_id' => $document->id,
                'description' => "Menghapus dokumen: {$document->name}",
                'ip_address' => request()->ip()
            ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Dokumen berhasil dihapus'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();  // Rollback jika ada kesalahan
            Log::error("Error menghapus dokumen ID {$id}: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menghapus dokumen',
                'error_details' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Dapatkan daftar semua dokumen dengan relasi terkait
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAllDocuments()
    {
        try {
            $documents = Document::with('ppeppSection', 'user')
                ->where('user_id', Auth::id())
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'status' => 'success',
                'data' => $documents
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching documents: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengambil daftar dokumen'
            ], 500);
        }
    }

    public function bulkDestroyDocuments(Request $request)
{
    try {
        $documentIds = $request->input('document_ids', []);

        if (empty($documentIds)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Tidak ada dokumen yang dipilih'
            ], 400);
        }

        DB::beginTransaction();

        // Validasi izin
        $unauthorizedDocs = Document::whereIn('id', $documentIds)
            ->where('user_id', '!=', Auth::id())
            ->get();

        if ($unauthorizedDocs->isNotEmpty()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Anda tidak memiliki izin menghapus beberapa dokumen'
            ], 403);
        }

        // Hapus dokumen
        $deletedCount = Document::whereIn('id', $documentIds)
            ->where('user_id', Auth::id())
            ->delete();

        // Log aktivitas
        ActivityLog::create([
            'user_id' => Auth::id(),
            'action' => 'bulk_delete',
            'action_type' => 'documents',
            'description' => "Menghapus {$deletedCount} dokumen",
            'ip_address' => request()->ip()
        ]);

        DB::commit();

        return response()->json([
            'status' => 'success',
            'message' => "Berhasil menghapus {$deletedCount} dokumen"
        ]);

    } catch (\Exception $e) {
        DB::rollBack();
        Log::error('Bulk delete documents error: ' . $e->getMessage());
        return response()->json([
            'status' => 'error',
            'message' => 'Gagal menghapus dokumen'
        ], 500);
    }
}

}