<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lost_asset_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asset_id')->constrained('assets')->cascadeOnDelete();
            $table->foreignId('reporter_id')->constrained('users')->cascadeOnDelete();
            $table->text('description');
            $table->string('last_known_location')->nullable();
            $table->date('date_lost')->nullable();
            $table->text('remarks')->nullable();
            $table->string('status')->default('PENDING');

            // Workflow engine fields
            $table->foreignId('workflow_version_id')->nullable()->constrained('workflow_versions')->nullOnDelete();
            $table->unsignedTinyInteger('current_level_order')->nullable();
            $table->string('workflow_status')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['asset_id', 'status']);
            $table->index(['reporter_id', 'status']);
            $table->index('workflow_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lost_asset_reports');
    }
};
