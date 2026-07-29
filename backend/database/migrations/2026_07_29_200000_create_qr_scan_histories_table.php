<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('qr_scan_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asset_id')->constrained('assets')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action_performed')->default('VIEW');
            $table->string('device')->nullable();
            $table->string('platform')->nullable();
            $table->string('browser')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamp('scanned_at')->useCurrent();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['asset_id', 'scanned_at']);
            $table->index(['user_id', 'scanned_at']);
            $table->index('action_performed');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('qr_scan_histories');
    }
};
