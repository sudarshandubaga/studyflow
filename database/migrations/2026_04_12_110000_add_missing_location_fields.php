<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('countries', function (Blueprint $table) {
            if (!Schema::hasColumn('countries', 'phone_code')) {
                $table->string('phone_code', 10)->nullable()->after('short_name');
            }
        });

        Schema::table('states', function (Blueprint $table) {
            if (!Schema::hasColumn('states', 'short_name')) {
                $table->string('short_name', 10)->nullable()->after('name');
            }
        });

        Schema::table('cities', function (Blueprint $table) {
            if (!Schema::hasColumn('cities', 'short_name')) {
                $table->string('short_name', 10)->nullable()->after('name');
            }
        });
    }

    public function down(): void
    {
        Schema::table('countries', function (Blueprint $table) {
            $table->dropColumn('phone_code');
        });
        Schema::table('states', function (Blueprint $table) {
            $table->dropColumn('short_name');
        });
        Schema::table('cities', function (Blueprint $table) {
            $table->dropColumn('short_name');
        });
    }
};
