<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
// 2024_12_13_094108_add_detail_to_documents_table.php
return new class extends Migration {
    public function up() {
        Schema::table('documents', function (Blueprint $table) {
            $table->string('detail')->nullable()->after('ppepp_section_id');
        });
    }

    public function down() {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropColumn('detail');
        });
    }
};

