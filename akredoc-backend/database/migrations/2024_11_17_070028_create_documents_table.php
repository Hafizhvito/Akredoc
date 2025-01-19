<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
// 2024_11_17_070028_create_documents_table.php
return new class extends Migration
{
    public function up()
    {
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('type');
            $table->string('size');
            $table->foreignId('user_id')->constrained();
            $table->foreignId('ppepp_section_id')->constrained('ppepp_sections')->onDelete('cascade'); // Tambahkan onDelete('cascade')
            $table->string('status')->default('active');
            $table->timestamps();
            
        });
    }
    

    public function down()
    {
        Schema::dropIfExists('documents');
    }
};