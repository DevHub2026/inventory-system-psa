<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('document_templates', function (Blueprint $table) {
            $columns = [
                'header_org_name',
                'header_office_name',
                'header_title',
                'logo_url',
                'body_template',
                'footer_text',
                'footer_notes',
                'signature_blocks',
                'paper_size',
                'orientation',
                'margin_top',
                'margin_bottom',
                'margin_left',
                'margin_right',
                'font_family',
                'font_size',
                'text_alignment',
            ];

            $existing = array_values(array_filter(
                $columns,
                fn (string $col) => Schema::hasColumn('document_templates', $col)
            ));

            if ($existing !== []) {
                $table->dropColumn($existing);
            }
        });
    }

    public function down(): void
    {
        Schema::table('document_templates', function (Blueprint $table) {
            $table->string('header_org_name')->nullable()->default('PHILIPPINE STATISTICS AUTHORITY');
            $table->string('header_office_name')->nullable()->default('Regional Statistical Services Office');
            $table->string('header_title')->nullable();
            $table->string('logo_url')->nullable();
            $table->longText('body_template')->nullable();
            $table->text('footer_text')->nullable();
            $table->text('footer_notes')->nullable();
            $table->json('signature_blocks')->nullable();
            $table->string('paper_size')->default('A4');
            $table->string('orientation')->default('portrait');
            $table->decimal('margin_top', 5, 2)->default(25);
            $table->decimal('margin_bottom', 5, 2)->default(25);
            $table->decimal('margin_left', 5, 2)->default(25);
            $table->decimal('margin_right', 5, 2)->default(25);
            $table->string('font_family')->default('Arial');
            $table->integer('font_size')->default(12);
            $table->string('text_alignment')->default('left');
        });
    }
};
