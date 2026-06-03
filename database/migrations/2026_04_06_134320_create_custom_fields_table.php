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
        Schema::create('custom_fields', function (Blueprint $table) {
            $table->id();
            $table->foreignId('custom_field_category_id')->constrained('custom_field_categories')->onDelete('cascade');
            $table->string('name');
            $table->enum('field_type', ['Textbox', 'textarea', 'Pulldown', 'radio', 'checkbox', 'date']);
            $table->enum('data_type', ['Numeric', 'Alpha-Numeric', 'Alphabetic', 'Alphabetic Special', 'Alphanumeric Special', 'Numeric Special']);
            $table->text('options')->nullable(); // JSON or comma separated string
            $table->boolean('is_mandatory')->default(false);
            $table->boolean('show_on_table')->default(true);
            $table->string('default_value')->nullable();
            $table->string('placeholder')->nullable();
            $table->string('validation_message')->nullable();
            $table->integer('max_length')->nullable();
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('custom_fields');
    }
};
