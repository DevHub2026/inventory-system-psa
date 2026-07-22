<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('borrowings', function (Blueprint $table): void {
            $table->foreignId('reservation_id')->nullable()->after('asset_id')->constrained('reservations')->nullOnDelete();
        });

        Schema::table('reservation_items', function (Blueprint $table): void {
            $table->timestamp('fulfilled_at')->nullable()->after('asset_id');
        });
    }

    public function down(): void
    {
        Schema::table('borrowings', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('reservation_id');
        });

        Schema::table('reservation_items', function (Blueprint $table): void {
            $table->dropColumn('fulfilled_at');
        });
    }
};
