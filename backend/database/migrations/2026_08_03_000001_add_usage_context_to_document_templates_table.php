<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds usage_context to document_templates.
 *
 * This column stores a stable key (e.g. BORROWING_RECEIPT) that identifies
 * the exact system workflow area a template is intended for. It is separate
 * from document_type, which identifies the file format/kind.
 *
 * nullable — existing templates without a context remain compatible and
 * the system continues using its default document_type lookup as fallback.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('document_templates', function (Blueprint $table) {
            $table->string('usage_context', 64)->nullable()->after('document_type')
                ->comment('Stable workflow area key — e.g. BORROWING_RECEIPT, PERMANENT_ISSUANCE');
            $table->index('usage_context');
        });
    }

    public function down(): void
    {
        Schema::table('document_templates', function (Blueprint $table) {
            $table->dropIndex(['usage_context']);
            $table->dropColumn('usage_context');
        });
    }
};
