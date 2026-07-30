<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private array $tables = [
        'offices',
        'locations',
        'manufacturers',
        'asset_categories',
        'departments',
    ];

    public function up(): void
    {
        foreach ($this->tables as $table) {
            Schema::table($table, function (Blueprint $table) {
                if (! Schema::hasColumn($table->getTable(), 'created_by')) {
                    $table->unsignedBigInteger('created_by')->nullable()->after('is_active');
                }
                if (! Schema::hasColumn($table->getTable(), 'updated_by')) {
                    $table->unsignedBigInteger('updated_by')->nullable()->after('created_by');
                }
            });
        }
    }

    public function down(): void
    {
        foreach ($this->tables as $table) {
            Schema::table($table, function (Blueprint $table) {
                $table->dropColumn(array_filter(
                    ['created_by', 'updated_by'],
                    fn (string $col) => Schema::hasColumn($table->getTable(), $col),
                ));
            });
        }
    }
};
