<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('asset_issuance_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asset_id')->constrained('assets')->onDelete('cascade');
            $table->foreignId('previous_employee_id')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('new_employee_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('transferred_by')->constrained('users')->onDelete('cascade');
            $table->date('transfer_date');
            $table->text('reason');
            $table->text('remarks')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asset_issuance_histories');
    }
};
