<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inventory_imports', function (Blueprint $table) {
            $table->string('import_type')->default('inventory')->index();
        });
    }

    public function down(): void
    {
        Schema::table('inventory_imports', function (Blueprint $table) {
            $table->dropColumn('import_type');
        });
    }
};
