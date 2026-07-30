<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inventory_items', function (Blueprint $table): void {
            $table->string('classification', 32)->nullable()->after('type');
            $table->string('item_nature', 32)->nullable()->after('classification');
            $table->text('classification_reason')->nullable()->after('item_nature');
            $table->index('classification');
            $table->index('item_nature');
        });

        DB::table('inventory_items')
            ->orderBy('id')
            ->chunkById(200, function ($rows): void {
                foreach ($rows as $row) {
                    $isExpendable = $row->type === 'expendable';

                    DB::table('inventory_items')
                        ->where('id', $row->id)
                        ->update([
                            'classification' => $isExpendable ? 'SUPPLY' : 'PPE',
                            'item_nature' => $isExpendable ? 'CONSUMABLE_SUPPLY' : 'ACCOUNTABLE_PROPERTY',
                            'classification_reason' => $isExpendable
                                ? 'Backfilled from legacy expendable type.'
                                : 'Backfilled from legacy non_expendable type.',
                        ]);
                }
            });
    }

    public function down(): void
    {
        Schema::table('inventory_items', function (Blueprint $table): void {
            $table->dropIndex(['classification']);
            $table->dropIndex(['item_nature']);
            $table->dropColumn(['classification', 'item_nature', 'classification_reason']);
        });
    }
};
