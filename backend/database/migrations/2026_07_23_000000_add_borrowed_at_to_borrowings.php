<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('borrowings', function (Blueprint $table) {
            // Add borrowed_at timestamp to store exact borrow date and time
            if (! Schema::hasColumn('borrowings', 'borrowed_at')) {
                $table->timestamp('borrowed_at')->nullable()->after('borrow_date');
            }
        });
    }

    public function down(): void
    {
        Schema::table('borrowings', function (Blueprint $table) {
            if (Schema::hasColumn('borrowings', 'borrowed_at')) {
                $table->dropColumn('borrowed_at');
            }
        });
    }
};
