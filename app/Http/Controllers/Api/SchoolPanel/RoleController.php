<?php

namespace App\Http\Controllers\Api\SchoolPanel;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleController extends Controller
{
    public function index(Request $request)
    {
        $query = Role::with('permissions');
        
        if ($branchId = $request->header('branch-id') ?? $request->branch_id) {
            $query->where('branch_id', $branchId);
        }

        $roles = $query->orderBy('name')->get();
        return response()->json($roles);
    }

    public function getPermissions()
    {
        $permissions = Permission::orderBy('name')->get();
        return response()->json($permissions);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'parent_id' => 'nullable|exists:roles,id',
            'branch_id' => 'nullable|exists:school_branches,id',
            'permissions' => 'array',
            'permissions.*' => 'string|exists:permissions,name'
        ]);

        $role = Role::create([
            'name' => $validated['name'], 
            'guard_name' => 'web',
            'parent_id' => $validated['parent_id'] ?? null,
            'branch_id' => $validated['branch_id'] ?? null
        ]);
        
        if (isset($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        }

        return response()->json($role->load('permissions'), 201);
    }

    public function update(Request $request, Role $role)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'parent_id' => 'nullable|exists:roles,id',
            'branch_id' => 'nullable|exists:school_branches,id',
            'permissions' => 'array',
            'permissions.*' => 'string|exists:permissions,name'
        ]);

        $role->update([
            'name' => $validated['name'],
            'parent_id' => $validated['parent_id'] ?? null,
            'branch_id' => $validated['branch_id'] ?? null
        ]);
        
        if (isset($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        }

        return response()->json($role->load('permissions'));
    }

    public function destroy(Role $role)
    {
        if (in_array($role->name, ['owner', 'admin'])) {
            return response()->json(['message' => 'Cannot delete core system roles'], 403);
        }
        $role->delete();
        return response()->json(null, 204);
    }
}
