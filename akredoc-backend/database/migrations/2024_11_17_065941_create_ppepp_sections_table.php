<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
// 2024_11_17_065941_create_ppepp_sections_table.php
return new class extends Migration
{
    public function up()
    {
        Schema::create('ppepp_sections', function (Blueprint $table) {
            $table->id();
            $table->string('section_code'); // e.g., 'A', 'B1', 'C1', etc.
            $table->string('section_name');
            $table->text('content')->nullable();
            $table->timestamps();
            $table->foreignId('user_id')->constrained();
            $table->string('status')->default('draft'); 
        });
    }

    public function down()
    {
        Schema::dropIfExists('ppepp_sections');
    }
};
