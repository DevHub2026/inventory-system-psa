<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stock_transactions', function (Blueprint $table): void {
            $table->foreignId('source_location_id')->nullable()->after('user_id')->constrained('locations')->nullOnDelete();
            $table->foreignId('destination_location_id')->nullable()->after('source_location_id')->constrained('locations')->nullOnDelete();
            $table->foreignId('related_inventory_item_id')->nullable()->after('destination_location_id')->constrained('inventory_items')->nullOnDelete();
            $table->uuid('transfer_uuid')->nullable()->after('related_inventory_item_id');

            $table->index('transfer_uuid');
        });
    }

    public function down(): void
    {
        Schema::table('stock_transactions', function (Blueprint $table): void {
            $table->dropIndex(['transfer_uuid']);
            $table->dropConstrainedForeignId('source_location_id');
            $table->dropConstrainedForeignId('destination_location_id');
            $table->dropConstrainedForeignId('related_inventory_item_id');
            $table->dropColumn('transfer_uuid');
        });
    }
};
