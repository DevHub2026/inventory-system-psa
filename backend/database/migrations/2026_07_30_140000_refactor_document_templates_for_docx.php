<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('document_templates', function (Blueprint $table) {
            if (! Schema::hasColumn('document_templates', 'validation_status')) {
                $table->string('validation_status')->nullable()->after('extension');
            }
            if (! Schema::hasColumn('document_templates', 'validation_result')) {
                $table->json('validation_result')->nullable()->after('validation_status');
            }
            if (! Schema::hasColumn('document_templates', 'has_unknown_placeholders')) {
                $table->boolean('has_unknown_placeholders')->default(false)->after('validation_result');
            }
            if (! Schema::hasColumn('document_templates', 'change_notes')) {
                $table->text('change_notes')->nullable()->after('has_unknown_placeholders');
            }
        });
    }

    public function down(): void
    {
        Schema::table('document_templates', function (Blueprint $table) {
            $columns = array_filter([
                'validation_status',
                'validation_result',
                'has_unknown_placeholders',
                'change_notes',
            ], fn (string $col) => Schema::hasColumn('document_templates', $col));

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
};
