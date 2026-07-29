<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('document_type');
            $table->text('description')->nullable();
            $table->string('version')->default('1.0');
            $table->string('status')->default('active');
            $table->boolean('is_default')->default(false);
            $table->string('file_path');
            $table->string('file_name');
            $table->unsignedBigInteger('file_size')->default(0);
            $table->string('mime_type')->nullable();
            $table->string('extension')->nullable();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('upload_date')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['document_type', 'status']);
            $table->index(['document_type', 'is_default']);
            $table->index('upload_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_templates');
    }
};
