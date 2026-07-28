<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('borrow_extension_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('borrowing_id')->constrained()->cascadeOnDelete();
            $table->date('current_due_date');
            $table->date('requested_due_date');
            $table->text('reason');
            $table->string('status')->default('pending'); // pending, approved, rejected
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();

            $table->index(['borrowing_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('borrow_extension_requests');
    }
};