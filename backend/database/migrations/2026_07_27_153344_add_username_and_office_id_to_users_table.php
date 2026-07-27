<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Step 1: Add username column if it doesn't already exist
        if (! Schema::hasColumn('users', 'username')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('username')->nullable()->after('employee_number');
            });
        }

        // Step 2: Backfill username with employee_number for existing users
        // This preserves backward compatibility - existing users log in with the same value
        DB::table('users')->whereNull('username')->update([
            'username' => DB::raw('employee_number'),
        ]);

        // Step 3: Handle duplicate usernames by appending a suffix to duplicates
        $duplicates = DB::table('users')
            ->select('username', DB::raw('MIN(id) as keep_id'))
            ->whereNotNull('username')
            ->groupBy('username')
            ->havingRaw('COUNT(*) > 1')
            ->get();

        foreach ($duplicates as $dup) {
            $duplicateUsers = DB::table('users')
                ->where('username', $dup->username)
                ->where('id', '!=', $dup->keep_id)
                ->orderBy('id')
                ->get();

            foreach ($duplicateUsers as $index => $user) {
                $suffix = $index + 1;
                DB::table('users')
                    ->where('id', $user->id)
                    ->update(['username' => $user->username . '-' . $suffix]);
            }
        }

        // Step 4: Add unique index on username (if not already exists)
        try {
            Schema::table('users', function (Blueprint $table) {
                $table->unique('username', 'users_username_unique');
            });
        } catch (\Exception $e) {
            // Index may already exist from partial run
        }

        // Step 5: Add office_id foreign key (nullable)
        if (! Schema::hasColumn('users', 'office_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->foreignId('office_id')->nullable()->after('department_id')
                    ->constrained('offices')
                    ->nullOnDelete();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Drop foreign key first
            try {
                $table->dropForeign(['office_id']);
            } catch (\Exception $e) {
                // Foreign key may not exist
            }

            // Drop columns
            if (Schema::hasColumn('users', 'office_id')) {
                $table->dropColumn('office_id');
            }

            // Drop index
            try {
                $table->dropIndex('users_username_unique');
            } catch (\Exception $e) {
                // Index may not exist
            }

            // Drop username column
            if (Schema::hasColumn('users', 'username')) {
                $table->dropColumn('username');
            }
        });
    }
};
