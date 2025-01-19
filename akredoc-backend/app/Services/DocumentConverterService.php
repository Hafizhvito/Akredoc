<?php

namespace App\Services;

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Writer\Pdf\Tcpdf;
use Barryvdh\DomPDF\Facade\Pdf;
use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpPresentation\PhpPresentation;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class DocumentConverterService
{
    public function convertToPdf($content, $documentName)
    {
        $pdf = PDF::loadHTML('<h1>' . nl2br(e($content)) . '</h1>');
        return $pdf->download($documentName . '.pdf');
    }
    

    public function convertToExcel($content, $documentName)
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setCellValue('A1', $content);
    
        $filePath = storage_path('app/temp/' . $documentName . '.xlsx');
        
        // Ensure directory exists
        if (!file_exists(dirname($filePath))) {
            mkdir(dirname($filePath), 0755, true);
        }
    
        $writer = new Xlsx($spreadsheet);
        $writer->save($filePath);
    
        return response()->download($filePath);
    }
    

    public function convertToWord($content, $documentName)
    {
        $phpWord = new PhpWord();
        $section = $phpWord->addSection();
        $section->addText($content);
    
        $filePath = storage_path('app/temp/' . $documentName . '.docx');
        
        // Ensure directory exists
        if (!file_exists(dirname($filePath))) {
            mkdir(dirname($filePath), 0755, true);
        }
    
        $objWriter = \PhpOffice\PhpWord\IOFactory::createWriter($phpWord, 'Word2007');
        $objWriter->save($filePath);
    
        return response()->download($filePath);
    }
    

    public function convertToPowerPoint($content, $documentName)
{
    try {
        $phpPresentation = new \PhpOffice\PhpPresentation\PhpPresentation();
        $slide = $phpPresentation->getActiveSlide();
    
        // Buat shape teks menggunakan cara yang lebih umum
        $shape = $slide->createRichTextShape();
        $shape->setHeight(300)
            ->setWidth(600)
            ->setOffsetX(150)
            ->setOffsetY(200);
    
        // Tambahkan teks langsung ke shape
        $textRun = $shape->createTextRun($content);

        $objWriter = \PhpOffice\PhpPresentation\IOFactory::createWriter($phpPresentation, 'PowerPoint2007');
        $filePath = storage_path('app/temp/' . $documentName . '.pptx');
        
        // Pastikan direktori ada
        if (!file_exists(storage_path('app/temp'))) {
            mkdir(storage_path('app/temp'), 0755, true);
        }
        
        $objWriter->save($filePath);

        return response()->download($filePath)->deleteFileAfterSend(true);

    } catch (\Exception $e) {
        Log::error('PowerPoint conversion error: ' . $e->getMessage());
        return response()->json([
            'status' => 'error',
            'message' => 'Gagal membuat dokumen PowerPoint',
            'error_details' => $e->getMessage()
        ], 500);
    }
}   
}