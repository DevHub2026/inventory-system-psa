<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_custom_fields', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('field_key')->unique();
            $table->string('field_type')->default('text'); // text, number, date, boolean, select
            $table->json('options')->nullable(); // for select type
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('inventory_item_custom_fields', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inventory_item_id')->constrained('inventory_items')->cascadeOnDelete();
            $table->foreignId('inventory_custom_field_id')->constrained('inventory_custom_fields')->cascadeOnDelete();
            $table->text('value')->nullable();
            $table->timestamps();

            $table->unique(['inventory_item_id', 'inventory_custom_field_id'], 'item_custom_field_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_item_custom_fields');
        Schema::dropIfExists('inventory_custom_fields');
    }
};