<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('prospectuses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_branch_id')->constrained()->cascadeOnDelete();
            $table->foreignId('session_id')->constrained()->cascadeOnDelete();
            $table->string('form_no');
            $table->foreignId('class_id')->constrained('classes')->cascadeOnDelete();
            $table->string('name');
            $table->string('father_name');
            $table->string('mobile_no');
            $table->decimal('total_amount', 10, 2)->default(0);
            $table->date('payment_date');
            $table->string('reference_number')->nullable();
            $table->enum('payment_mode', ['Cash', 'Cheque', 'Bank', 'DD', 'NEFT', 'Debit/Credit Card', 'Net Banking', 'IMPS', 'TPT', 'UPI']);
            $table->enum('interaction_type', ['Person', 'Online']);
            $table->string('meeting_id')->nullable();
            $table->date('test_date')->nullable();
            $table->time('test_time')->nullable();
            $table->string('status')->default('Prospectus'); // Prospectus, Registered
            $table->unique(['form_no', 'session_id']);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('prospectuses');
    }
};
