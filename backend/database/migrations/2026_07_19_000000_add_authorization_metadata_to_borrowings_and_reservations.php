<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('borrowings', function (Blueprint $table) {
            if (! Schema::hasColumn('borrowings', 'authorized_by')) {
                $table->foreignId('authorized_by')->nullable()->after('remarks')->constrained('users')->nullOnDelete();
            }

            if (! Schema::hasColumn('borrowings', 'authorized_at')) {
                $table->timestamp('authorized_at')->nullable()->after('authorized_by');
            }
        });

        Schema::table('reservations', function (Blueprint $table) {
            if (! Schema::hasColumn('reservations', 'authorized_by')) {
                $table->foreignId('authorized_by')->nullable()->after('remarks')->constrained('users')->nullOnDelete();
            }

            if (! Schema::hasColumn('reservations', 'authorized_at')) {
                $table->timestamp('authorized_at')->nullable()->after('authorized_by');
            }
        });
    }

    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            if (Schema::hasColumn('reservations', 'authorized_at')) {
                $table->dropColumn('authorized_at');
            }

            if (Schema::hasColumn('reservations', 'authorized_by')) {
                $table->dropConstrainedForeignId('authorized_by');
            }
        });

        Schema::table('borrowings', function (Blueprint $table) {
            if (Schema::hasColumn('borrowings', 'authorized_at')) {
                $table->dropColumn('authorized_at');
            }

            if (Schema::hasColumn('borrowings', 'authorized_by')) {
                $table->dropConstrainedForeignId('authorized_by');
            }
        });
    }
};
