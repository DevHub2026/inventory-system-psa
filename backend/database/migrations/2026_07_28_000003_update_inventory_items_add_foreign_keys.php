<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inventory_items', function (Blueprint $table) {
            // Add unit_id foreign key
            $table->foreignId('unit_id')->nullable()->after('unit')->constrained('units')->nullOnDelete();
            
            // Add manufacturer_id foreign key
            $table->foreignId('manufacturer_id')->nullable()->after('asset_id')->constrained('manufacturers')->nullOnDelete();
            
            // Add office_id foreign key
            $table->foreignId('office_id')->nullable()->after('manufacturer_id')->constrained('offices')->nullOnDelete();
            
            // Add location_id foreign key
            $table->foreignId('location_id')->nullable()->after('office_id')->constrained('locations')->nullOnDelete();
            
            // Add indexes
            $table->index('unit_id');
            $table->index('manufacturer_id');
            $table->index('office_id');
            $table->index('location_id');
        });
    }

    public function down(): void
    {
        Schema::table('inventory_items', function (Blueprint $table) {
            $table->dropForeign(['unit_id']);
            $table->dropForeign(['manufacturer_id']);
            $table->dropForeign(['office_id']);
            $table->dropForeign(['location_id']);
            
            $table->dropIndex(['unit_id']);
            $table->dropIndex(['manufacturer_id']);
            $table->dropIndex(['office_id']);
            $table->dropIndex(['location_id']);
            
            $table->dropColumn(['unit_id', 'manufacturer_id', 'office_id', 'location_id']);
        });
    }
};
