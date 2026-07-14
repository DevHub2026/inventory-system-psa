<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('asset_identifiers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asset_id')->constrained('assets')->cascadeOnDelete();
            $table->string('identifier_type');
            $table->string('identifier_value')->unique();
            $table->boolean('is_primary')->default(false);
            $table->timestamps();

            $table->index('asset_id');
            $table->index('identifier_type');
            $table->index('identifier_value');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asset_identifiers');
    }
};
