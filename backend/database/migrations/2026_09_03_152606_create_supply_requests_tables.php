<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('supply_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('office_id')->nullable()->constrained('offices')->nullOnDelete();
            $table->string('status')->default('PENDING'); // PENDING, APPROVED, FULFILLED, PARTIALLY_FULFILLED, REJECTED, CANCELLED
            $table->foreignId('workflow_version_id')->nullable()->constrained('workflow_versions')->nullOnDelete();
            $table->integer('current_level_order')->default(1);
            $table->string('workflow_status')->default('PENDING_APPROVAL'); // PENDING_APPROVAL, APPROVED, REJECTED, CANCELLED
            $table->text('remarks')->nullable();
            $table->foreignId('fulfilled_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('fulfilled_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('supply_request_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supply_request_id')->constrained('supply_requests')->cascadeOnDelete();
            $table->foreignId('inventory_item_id')->constrained('inventory_items')->cascadeOnDelete();
            $table->integer('quantity_requested')->default(1);
            $table->integer('quantity_issued')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supply_request_items');
        Schema::dropIfExists('supply_requests');
    }
};
