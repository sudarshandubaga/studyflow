<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('staff_attendances', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->date('attendance_date');
            $table->unsignedBigInteger('attendance_legend_id');
            $table->boolean('is_half_day')->default(false);
            $table->json('time_slots')->nullable();
            $table->unsignedBigInteger('school_id');
            $table->unsignedBigInteger('branch_id')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('attendance_legend_id')->references('id')->on('attendance_legends')->onDelete('cascade');
            
            $table->unique(['user_id', 'attendance_date', 'branch_id'], 'staff_att_unique');
        });
    }

    public function down()
    {
        Schema::dropIfExists('staff_attendances');
    }
};
