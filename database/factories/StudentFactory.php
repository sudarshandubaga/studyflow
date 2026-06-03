<?php

namespace Database\Factories;

use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class StudentFactory extends Factory
{
    protected $model = Student::class;

    public function definition(): array
    {
        $fn = fake()->firstName();
        $ln = fake()->lastName();
        
        return [
            'school_id' => 1,
            'branch_id' => 1,
            'session_id' => 1,
            'first_name' => $fn,
            'last_name' => $ln,
            'gender' => fake()->randomElement(['Male', 'Female']),
            'dob' => fake()->date('Y-m-d', '2015-01-01'),
            'email' => fake()->unique()->safeEmail(),
            'mobile_no' => fake()->unique()->numerify('9#########'),
            'enrollment_no' => fake()->unique()->numerify('ADM####'),
            'roll_no' => fake()->numerify('##'),
            'doj' => now()->format('Y-m-d'),
            'section_id' => 1,
            'student_category_id' => 1,
            'father_email_id' => fake()->safeEmail(),
            'father_mobile_no' => fake()->unique()->numerify('9#########'),
        ];
    }
}
