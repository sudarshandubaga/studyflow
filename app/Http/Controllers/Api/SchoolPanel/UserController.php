<?php

namespace App\Http\Controllers\Api\SchoolPanel;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::with(['roles', 'title', 'employee.country', 'employee.state', 'employee.city', 'employee.customFieldValues']);
        
        if ($branchId = $request->header('branch-id')) {
            $query->where('school_branch_id', $branchId);
        } else {
            $query->where('school_id', $request->user()->school_id);
        }

        $users = $query->orderBy('created_at', 'desc')->get();
        return response()->json($users);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            // User table fields (personal identity)
            'title_id' => 'nullable|exists:titles,id',
            'first_name' => 'required|string|max:100',
            'middle_name' => 'nullable|string|max:100',
            'last_name' => 'required|string|max:100',
            'gender' => 'required|in:Male,Female,Other',
            'dob' => 'required|date',
            'name' => 'nullable|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'username' => 'required|string|max:50|unique:users,username',
            'mobile_number' => 'required|string|max:20',
            'password' => 'required|string|min:8',
            'role' => 'required|in:owner,admin,teacher,parent,staff',
            'is_active' => 'boolean',
            'photo' => 'nullable|image|max:2048',

            // Employee table fields
            'doj' => 'required|date',
            'employee_type' => 'required|in:Teaching Staff,Non-Teaching Staff,Management',
            'attendance_code' => 'nullable|string|max:50',
            'custom_roles' => 'nullable|array',
            'custom_roles.*' => 'string|exists:roles,name',
            'country_id' => 'nullable|exists:countries,id',
            'state_id' => 'nullable|exists:states,id',
            'city_id' => 'nullable|exists:cities,id',
            'custom_fields' => 'nullable|array',
        ]);

        if (empty($validated['name'])) {
            $validated['name'] = trim($validated['first_name'] . ' ' . ($validated['middle_name'] ?? '') . ' ' . $validated['last_name']);
        }

        \DB::beginTransaction();
        try {
            // User table data (personal identity + auth)
            $userData = [
                'title_id' => $validated['title_id'] ?? null,
                'first_name' => $validated['first_name'],
                'middle_name' => $validated['middle_name'] ?? null,
                'last_name' => $validated['last_name'],
                'gender' => $validated['gender'],
                'dob' => $validated['dob'],
                'name' => $validated['name'],
                'email' => $validated['email'],
                'username' => $validated['username'],
                'mobile_number' => $validated['mobile_number'],
                'phone' => $validated['mobile_number'],
                'password' => Hash::make($validated['password']),
                'role' => $validated['role'],
                'is_active' => $validated['is_active'] ?? true,
                'school_id' => $request->user()->school_id,
                'school_branch_id' => $request->header('branch-id') ?? $request->user()->school_branch_id,
            ];

            if ($request->hasFile('photo')) {
                $userData['avatar'] = $request->file('photo')->store('avatars', 'public');
            }

            $user = User::create($userData);

            // Employee table data (employment-specific)
            $employeeData = [
                'doj' => $validated['doj'],
                'employee_type' => $validated['employee_type'],
                'attendance_code' => $validated['attendance_code'] ?? null,
                'country_id' => $validated['country_id'] ?? null,
                'state_id' => $validated['state_id'] ?? null,
                'city_id' => $validated['city_id'] ?? null,
            ];
            $user->employee()->create($employeeData);

            // Roles
            $rolesToSync = [$validated['role']];
            if (!empty($validated['custom_roles'])) {
                $rolesToSync = array_merge($rolesToSync, $validated['custom_roles']);
            }
            $user->syncRoles($rolesToSync);

            // Custom Fields
            if (!empty($validated['custom_fields'])) {
                foreach ($validated['custom_fields'] as $fieldId => $value) {
                    $user->employee->customFieldValues()->create([
                        'custom_field_id' => $fieldId,
                        'field_value' => is_array($value) ? json_encode($value) : $value
                    ]);
                }
            }

            \DB::commit();
            return response()->json($user->load(['roles', 'title', 'employee.customFieldValues', 'employee.country', 'employee.state', 'employee.city']), 201);

        } catch (\Exception $e) {
            \DB::rollBack();
            return response()->json(['message' => 'Failed to create user', 'error' => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        $user = User::with(['roles', 'title', 'employee.customFieldValues.customField', 'employee.country', 'employee.state', 'employee.city'])->findOrFail($id);
        return response()->json($user);
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            // User table fields (personal identity)
            'title_id' => 'nullable|exists:titles,id',
            'first_name' => 'sometimes|required|string|max:100',
            'middle_name' => 'nullable|string|max:100',
            'last_name' => 'sometimes|required|string|max:100',
            'gender' => 'sometimes|required|in:Male,Female,Other',
            'dob' => 'sometimes|required|date',
            'name' => 'nullable|string|max:255',
            'email' => [
                'sometimes', 'required', 'email', 'max:255',
                Rule::unique('users')->ignore($user->id)
            ],
            'username' => [
                'sometimes', 'required', 'string', 'max:50',
                Rule::unique('users')->ignore($user->id)
            ],
            'mobile_number' => 'sometimes|required|string|max:20',
            'password' => 'nullable|string|min:8',
            'role' => 'sometimes|required|in:owner,admin,teacher,parent,staff',
            'is_active' => 'boolean',
            'photo' => 'nullable|image|max:2048',

            // Employee table fields
            'doj' => 'sometimes|required|date',
            'employee_type' => 'sometimes|required|in:Teaching Staff,Non-Teaching Staff,Management',
            'attendance_code' => 'nullable|string|max:50',
            'custom_roles' => 'nullable|array',
            'custom_roles.*' => 'string|exists:roles,name',
            'country_id' => 'nullable|exists:countries,id',
            'state_id' => 'nullable|exists:states,id',
            'city_id' => 'nullable|exists:cities,id',
            'custom_fields' => 'nullable|array',
        ]);

        \DB::beginTransaction();
        try {
            // Build name from parts
            if (empty($validated['name']) && isset($validated['first_name'])) {
                $validated['name'] = trim(
                    $validated['first_name'] . ' ' . 
                    ($validated['middle_name'] ?? $user->middle_name ?? '') . ' ' . 
                    ($validated['last_name'] ?? $user->last_name ?? '')
                );
            }

            // User table update (personal identity + auth)
            $userData = $request->only([
                'title_id', 'first_name', 'middle_name', 'last_name',
                'gender', 'dob', 'name', 'email', 'username', 'role', 'is_active'
            ]);
            
            if (isset($validated['mobile_number'])) {
                $userData['mobile_number'] = $validated['mobile_number'];
                $userData['phone'] = $validated['mobile_number'];
            }

            if (!empty($validated['password'])) {
                $userData['password'] = Hash::make($validated['password']);
            }

            if ($request->hasFile('photo')) {
                $userData['avatar'] = $request->file('photo')->store('avatars', 'public');
            }

            $user->update($userData);

            // Employee table update (employment-specific)
            $employeeData = $request->only([
                'doj', 'employee_type', 'attendance_code',
                'country_id', 'state_id', 'city_id'
            ]);
            
            $employee = $user->employee()->updateOrCreate(['user_id' => $user->id], $employeeData);

            if (isset($validated['role'])) {
                $rolesToSync = [$validated['role']];
                if (!empty($validated['custom_roles'])) {
                    $rolesToSync = array_merge($rolesToSync, $validated['custom_roles']);
                }
                $user->syncRoles($rolesToSync);
            }

            // Custom Fields
            if (isset($validated['custom_fields'])) {
                foreach ($validated['custom_fields'] as $fieldId => $value) {
                    $employee->customFieldValues()->updateOrCreate(
                        ['custom_field_id' => $fieldId],
                        ['field_value' => is_array($value) ? json_encode($value) : $value]
                    );
                }
            }

            \DB::commit();
            return response()->json($user->load(['roles', 'title', 'employee.customFieldValues', 'employee.country', 'employee.state', 'employee.city']));

        } catch (\Exception $e) {
            \DB::rollBack();
            return response()->json(['message' => 'Failed to update user', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy(User $user)
    {
        $user->delete();
        return response()->json(['message' => 'User deleted successfully']);
    }

    public function bulkAssignRole(Request $request)
    {
        $validated = $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
            'role_id' => 'required|exists:roles,id'
        ]);

        $role = \Spatie\Permission\Models\Role::findById($validated['role_id']);
        $users = User::whereIn('id', $validated['user_ids'])->get();

        foreach ($users as $user) {
            $user->assignRole($role);
        }

        return response()->json(['message' => 'Roles assigned successfully']);
    }

    public function bulkUpdate(Request $request)
    {
        $validated = $request->validate([
            'updates' => 'required|array',
            'updates.*.id' => 'required|exists:users,id',
            'updates.*.first_name' => 'nullable|string|max:100',
            'updates.*.middle_name' => 'nullable|string|max:100',
            'updates.*.last_name' => 'nullable|string|max:100',
            'updates.*.email' => 'nullable|email|max:255',
            'updates.*.mobile_number' => 'nullable|string|max:20',
            'updates.*.gender' => 'nullable|in:Male,Female,Other',
            'updates.*.dob' => 'nullable|date',
            'updates.*.doj' => 'nullable|date',
            'updates.*.employee_type' => 'nullable|string',
            'updates.*.attendance_code' => 'nullable|string',
            'updates.*.custom_fields' => 'nullable|array',
        ]);

        \DB::beginTransaction();
        try {
            foreach ($validated['updates'] as $data) {
                $user = User::find($data['id']);
                if (!$user) continue;
                
                $userUpdate = [];
                $userFields = ['first_name', 'middle_name', 'last_name', 'email', 'mobile_number', 'gender', 'dob'];
                foreach ($userFields as $f) {
                    if (array_key_exists($f, $data)) {
                        $userUpdate[$f] = $data[$f];
                        if ($f === 'mobile_number') $userUpdate['phone'] = $data[$f];
                    }
                }
                
                // Keep 'name' combined field synced
                if (array_key_exists('first_name', $data) || array_key_exists('middle_name', $data) || array_key_exists('last_name', $data)) {
                    $fn = $userUpdate['first_name'] ?? $user->first_name;
                    $mn = $userUpdate['middle_name'] ?? $user->middle_name;
                    $ln = $userUpdate['last_name'] ?? $user->last_name;
                    $userUpdate['name'] = trim($fn . ' ' . $mn . ' ' . $ln);
                    $userUpdate['name'] = str_replace('  ', ' ', $userUpdate['name']);
                }
                
                if (!empty($userUpdate)) {
                    $user->update($userUpdate);
                }

                $employeeUpdate = [];
                $empFields = ['doj', 'employee_type', 'attendance_code'];
                foreach ($empFields as $f) {
                    if (array_key_exists($f, $data)) {
                        $employeeUpdate[$f] = $data[$f];
                    }
                }

                if (!empty($employeeUpdate) && $user->employee) {
                    $user->employee()->update($employeeUpdate);
                }

                // Custom Fields
                if (isset($data['custom_fields']) && $user->employee) {
                    foreach ($data['custom_fields'] as $fieldId => $value) {
                        $user->employee->customFieldValues()->updateOrCreate(
                            ['custom_field_id' => $fieldId],
                            ['field_value' => is_array($value) ? json_encode($value) : $value]
                        );
                    }
                }
            }
            \DB::commit();
            return response()->json(['message' => 'Employees updated successfully']);
        } catch (\Exception $e) {
            \DB::rollBack();
            return response()->json(['message' => 'Failed to perform bulk update', 'error' => $e->getMessage()], 500);
        }
    }
}
