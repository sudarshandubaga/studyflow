<?php

namespace Database\Factories;

use App\Models\Employee;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class EmployeeFactory extends Factory
{
    protected $model = Employee::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory()->state(['role' => 'staff']),
            'doj' => fake()->date(),
            'employee_type' => fake()->randomElement(['Teaching Staff', 'Non-Teaching Staff', 'Management']),
            'attendance_code' => fake()->unique()->numerify('EMP###'),
            'country_id' => null,
            'state_id' => null,
            'city_id' => null,
        ];
    }
}
