<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_count_sessions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('location_id')->nullable()->constrained('locations')->nullOnDelete();
            $table->foreignId('started_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('completed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('reconciled_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status')->default('draft');
            $table->timestamp('counted_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('reconciled_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['location_id', 'status']);
        });

        Schema::create('inventory_count_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('inventory_count_session_id')->constrained('inventory_count_sessions')->cascadeOnDelete();
            $table->foreignId('inventory_item_id')->constrained('inventory_items')->cascadeOnDelete();
            $table->integer('expected_quantity');
            $table->integer('actual_quantity')->nullable();
            $table->integer('variance')->default(0);
            $table->text('remarks')->nullable();
            $table->timestamp('counted_at')->nullable();
            $table->foreignId('counted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('reconciliation_transaction_id')->nullable()->constrained('stock_transactions')->nullOnDelete();
            $table->timestamps();

            $table->unique(['inventory_count_session_id', 'inventory_item_id'], 'inventory_count_unique_item');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_count_items');
        Schema::dropIfExists('inventory_count_sessions');
    }
};
