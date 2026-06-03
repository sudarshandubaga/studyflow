<?php

namespace Database\Seeders;

use App\Models\School;
use App\Models\SchoolBranch;
use App\Models\User;
use Carbon\Carbon;
use DB;
use Hash;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class SchoolSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::beginTransaction();

        try {
            // 1. Create School
            $school = School::updateOrCreate(
                ['domain' => 'xpert.localhost'],
                [
                    'name' => 'Xpert School',
                    'email' => 'info@xpert.localhost',
                    'phone' => '9999999999',
                    'address' => 'Main Campus Address',
                    'timezone' => 'Asia/Kolkata',
                    'is_active' => true,
                    'valid_until' => Carbon::now()->addYear(),
                ]
            );

            // 2. Create Branch
            $branch = SchoolBranch::updateOrCreate(
                ['name' => 'Main Branch', 'school_id' => $school->id],
                [
                    'address' => 'Branch Address',
                    'phone' => '9999999999',
                    'email' => 'branch@xpert.localhost',
                ]
            );

            // 3. Create Owner User
            User::updateOrCreate(
                ['email' => 'owner@xpert.localhost'],
                [
                    'name' => 'Owner User',
                    'phone' => '9999999999',
                    'password' => Hash::make('admin@123'),
                    'role' => 'owner',
                    'school_id' => $school->id,
                    'school_branch_id' => $branch->id,
                    'is_active' => true,
                ]
            );

            DB::commit();

        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }
}
