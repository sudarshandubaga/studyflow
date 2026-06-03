<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('fee_installments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fee_structure_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->decimal('amount', 10, 2);
            $table->date('due_date')->nullable();
            $table->decimal('late_fee', 10, 2)->default(0);
            $table->integer('grace_days')->default(0);
            $table->integer('installment_order')->default(1);
            $table->foreignId('session_id')->constrained()->cascadeOnDelete();
            $table->unique(['fee_structure_id', 'name', 'session_id']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fee_installments');
    }
};