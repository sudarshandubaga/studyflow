<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // 1. Fee Heads (Master)
        Schema::create('fee_heads', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('short_name')->nullable();
            $table->boolean('is_admission_fee')->default(false);
            $table->boolean('is_refundable')->default(false);
            $table->boolean('is_once_a_year')->default(false);
            $table->boolean('is_once_a_career')->default(false);
            $table->foreignId('student_category_id')->nullable()->constrained('student_categories')->nullOnDelete();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained('school_branches')->cascadeOnDelete();
            $table->foreignId('session_id')->constrained()->cascadeOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 2. Bill Schemes (Master)
        Schema::create('bill_schemes', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->date('date')->nullable();
            $table->string('slab')->nullable(); // Describing installments/slices
            $table->foreignId('session_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained('school_branches')->cascadeOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 3. Bill Scheme Details
        Schema::create('bill_scheme_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bill_scheme_id')->constrained()->cascadeOnDelete();
            $table->foreignId('fee_head_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 12, 2)->default(0);
            $table->timestamps();
        });

        // 4. Bill Scheme Section Assignments
        Schema::create('bill_scheme_sections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bill_scheme_id')->constrained()->cascadeOnDelete();
            $table->foreignId('section_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
        });

        // 5. Bill Scheme Student Assignments
        Schema::create('bill_scheme_students', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bill_scheme_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->timestamps();
        });

        // 6. Fee Concessions (Master)
        Schema::create('fee_concessions', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('session_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained('school_branches')->cascadeOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 7. Fee Concession Details (Multiple Entry per head)
        Schema::create('fee_concession_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fee_concession_id')->constrained()->cascadeOnDelete();
            $table->foreignId('fee_head_id')->constrained()->cascadeOnDelete();
            $table->enum('amount_type', ['percentage', 'value'])->default('value');
            $table->decimal('amount_value', 12, 2)->default(0);
            $table->timestamps();
        });

        // 8. Fee Concession Student Assignments
        Schema::create('fee_concession_students', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fee_concession_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->timestamps();
        });

        // 9. Fee Fines
        Schema::create('fee_fines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained()->cascadeOnDelete();
            $table->integer('grace_period')->default(0);
            $table->enum('fine_type', ['Normal', 'Slab'])->default('Normal');
            $table->enum('time_period', ['Daily', 'Weekly', 'Forthnightly', 'Monthly'])->default('Daily');
            $table->decimal('amount', 12, 2)->default(0);
            $table->foreignId('branch_id')->constrained('school_branches')->cascadeOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 10. Fee Banks
        Schema::create('fee_banks', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained('school_branches')->cascadeOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 11. Fee Charges (Actual processing uses the assignments above)
        Schema::create('fee_charges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('bill_scheme_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('class_id')->nullable()->constrained('classes')->nullOnDelete();
            $table->foreignId('section_id')->nullable()->constrained('sections')->nullOnDelete();
            $table->foreignId('concession_id')->nullable()->constrained('fee_concessions')->nullOnDelete();
            $table->enum('charge_type', ['Class', 'Section', 'Individual'])->default('Class');
            $table->decimal('total_amount', 12, 2)->default(0);
            $table->decimal('concession_amount', 12, 2)->default(0);
            $table->decimal('net_amount', 12, 2)->default(0);
            $table->string('remarks')->nullable();
            $table->enum('status', ['Active', 'Cancelled'])->default('Active');
            $table->foreignId('branch_id')->constrained('school_branches')->cascadeOnDelete();
            $table->foreignId('session_id')->constrained()->cascadeOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // 12. Fee Charge Details
        Schema::create('fee_charge_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fee_charge_id')->constrained('fee_charges')->cascadeOnDelete();
            $table->foreignId('fee_head_id')->constrained('fee_heads')->cascadeOnDelete();
            $table->decimal('amount', 12, 2)->default(0);
            $table->decimal('concession_amount', 12, 2)->default(0);
            $table->decimal('net_amount', 12, 2)->default(0);
            $table->string('installment_label')->nullable();
            $table->date('due_date')->nullable();
            $table->timestamps();
        });

        // 13. Fee Receipts
        Schema::create('fee_receipts', function (Blueprint $table) {
            $table->id();
            $table->string('receipt_no')->unique();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('class_id')->nullable()->constrained('classes')->nullOnDelete();
            $table->foreignId('section_id')->nullable()->constrained('sections')->nullOnDelete();
            $table->date('receipt_date');
            $table->string('payment_mode')->default('Cash');
            $table->decimal('total_amount', 12, 2)->default(0);
            $table->decimal('fine_amount', 12, 2)->default(0);
            $table->decimal('concession_amount', 12, 2)->default(0);
            $table->decimal('paid_amount', 12, 2)->default(0);
            $table->string('cheque_no')->nullable();
            $table->date('cheque_date')->nullable();
            $table->string('bank_name')->nullable();
            $table->string('transaction_id')->nullable();
            $table->string('remarks')->nullable();
            $table->foreignId('fee_bank_id')->nullable()->constrained('fee_banks')->nullOnDelete();
            $table->enum('status', ['Paid', 'Cancelled'])->default('Paid');
            $table->foreignId('branch_id')->constrained('school_branches')->cascadeOnDelete();
            $table->foreignId('session_id')->constrained()->cascadeOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('cancelled_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('cancelled_at')->nullable();
            $table->string('cancel_reason')->nullable();
            $table->timestamps();
        });

        // 14. Fee Receipt Details
        Schema::create('fee_receipt_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fee_receipt_id')->constrained('fee_receipts')->cascadeOnDelete();
            $table->foreignId('fee_head_id')->constrained('fee_heads')->cascadeOnDelete();
            $table->foreignId('fee_charge_detail_id')->nullable()->constrained('fee_charge_details')->nullOnDelete();
            $table->decimal('amount', 12, 2)->default(0);
            $table->decimal('fine_amount', 12, 2)->default(0);
            $table->decimal('concession_amount', 12, 2)->default(0);
            $table->decimal('paid_amount', 12, 2)->default(0);
            $table->string('installment_label')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fee_receipt_details');
        Schema::dropIfExists('fee_receipts');
        Schema::dropIfExists('fee_charge_details');
        Schema::dropIfExists('fee_charges');
        Schema::dropIfExists('fee_banks');
        Schema::dropIfExists('fee_fines');
        Schema::dropIfExists('fee_concession_students');
        Schema::dropIfExists('fee_concession_details');
        Schema::dropIfExists('fee_concessions');
        Schema::dropIfExists('bill_scheme_students');
        Schema::dropIfExists('bill_scheme_sections');
        Schema::dropIfExists('bill_scheme_details');
        Schema::dropIfExists('bill_schemes');
        Schema::dropIfExists('fee_heads');
    }
};

