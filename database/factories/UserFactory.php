<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $fn = fake()->firstName();
        $ln = fake()->lastName();
        $name = trim("$fn $ln");
        $username = strtolower($fn . fake()->unique()->numerify('####'));
        
        return [
            'name' => $name,
            'first_name' => $fn,
            'last_name' => $ln,
            'username' => $username,
            'email' => fake()->unique()->safeEmail(),
            'phone' => fake()->unique()->numerify('9#########'),
            'mobile_number' => fake()->unique()->numerify('9#########'),
            'role' => 'staff',
            'gender' => fake()->randomElement(['Male', 'Female']),
            'dob' => fake()->date('Y-m-d', '2000-01-01'),
            'is_active' => true,
            'school_id' => 1,
            'school_branch_id' => 1,
            'password' => static::$password ??= Hash::make('password'),
        ];
    }
    
    public function student(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'staff', // Student is not allowed in enum
        ]);
    }

    public function owner(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'owner',
        ]);
    }
}
