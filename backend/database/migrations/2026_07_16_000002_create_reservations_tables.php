<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reservations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('status')->default('PENDING');
            $table->date('start_date');
            $table->date('end_date');
            $table->text('remarks')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('reservation_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reservation_id')->constrained('reservations')->cascadeOnDelete();
            $table->foreignId('asset_id')->constrained('assets')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['reservation_id', 'asset_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservation_items');
        Schema::dropIfExists('reservations');
    }
};
