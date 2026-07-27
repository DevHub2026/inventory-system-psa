<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inventory_items', function (Blueprint $table) {
            $table->enum('type', ['non_expendable', 'expendable'])
                  ->default('non_expendable')
                  ->after('asset_id')
                  ->comment('non_expendable = durable assets; expendable = consumable supplies');
        });
    }

    public function down(): void
    {
        Schema::table('inventory_items', function (Blueprint $table) {
            $table->dropColumn('type');
        });
    }
};
