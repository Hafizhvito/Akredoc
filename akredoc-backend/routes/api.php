<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PpeppController;
use App\Models\Document;
use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\ManajemenDokumenController;
use App\Http\Controllers\NotificationController;

// Public routes
Route::post('/login', [AuthController::class, 'login']);
Route::post('/login/remember', [AuthController::class, 'loginWithRememberToken']);
Route::post('/register', [AuthController::class, 'createUser']);
Route::post('/forgot-password', [AuthController::class, 'sendResetLink']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);
Route::post('/check-email-users', [AuthController::class, 'checkEmailUsers']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::get('/check-auth', [AuthController::class, 'checkAuth']);
    Route::post('/check-auth', [AuthController::class, 'checkAuth']);
    Route::post('/log-activity', [ActivityLogController::class, 'logActivity']);
    Route::get('/users', [AuthController::class, 'getUsers']);
    

    // PPEPP Sections
    Route::post('/ppepp/save-section', [PpeppController::class, 'saveSection']);
    Route::get('/ppepp/section/{code}', [PpeppController::class, 'getSection']);
    Route::get('/ppepp/activity-logs', [PpeppController::class, 'getActivityLogs']);
    Route::get('/ppepp/sections', [PpeppController::class, 'getAllSections']);

     // Dokumen Manajemen
    Route::get('/documents', [ManajemenDokumenController::class, 'getAllDocuments']);
    Route::get('/documents/{id}/download', [ManajemenDokumenController::class, 'downloadDocument']);
    Route::put('/documents/{id}', [ManajemenDokumenController::class, 'updateDocument']);
    Route::delete('/documents/{id}', [ManajemenDokumenController::class, 'destroyDocument']);
    Route::post('/documents/bulk-delete', [ManajemenDokumenController::class, 'bulkDestroyDocuments']);

    Route::get('/ppepp/documents/{sectionId}', [PpeppController::class, 'getDocumentsBySection']);
    Route::post('/ppepp/documents/upload', [PpeppController::class, 'uploadDocument']);
    Route::delete('/ppepp/documents/{id}', [PpeppController::class, 'deleteDocument']);
    Route::get('/ppepp/section/{sectionCode}', [PpeppController::class, 'getSectionIdByCode']); 
    Route::post('/ppepp/sections', [PpeppController::class, 'createSection']); 

    Route::get('/documents/{id}/total', [PpeppController::class, 'getTotalDocuments']); 
    Route::get('/documents/{sectionCode}/{detail}/total', [PpeppController::class, 'getTotalDocumentsByDetail']);

    Route::get('/ppepp/progress', [PpeppController::class, 'getProgress']);

    Route::get('/ppepp/statistics', [PpeppController::class, 'getStatistics']);

    Route::get('/ppepp/detailed-statistics', [PpeppController::class, 'getDetailedStatistics']);

    // Log Aktivitas
    Route::get('/activity-logs', function () {
        return \App\Models\ActivityLog::with('user')->get();
    });
    // Document
    Route::get('/ppepp/documents', function () {
        return Document::with('ppeppSection', 'user')->get();
    });
    Route::apiResource('events', EventController::class)
    ->middleware(['auth:sanctum']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::apiResource('events', EventController::class);
        Route::get('events/month', [EventController::class, 'getMonthEvents']);
    });
    
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::post('/notifications', [NotificationController::class, 'store']);
        Route::put('/notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
    });
    
});

