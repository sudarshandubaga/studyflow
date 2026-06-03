<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BillScheme extends Model
{
    protected $fillable = ['name', 'date', 'slab', 'session_id', 'branch_id', 'is_active'];

    public function details()
    {
        return $this->hasMany(BillSchemeDetail::class);
    }

    public function sections()
    {
        return $this->hasMany(BillSchemeSection::class);
    }

    public function students()
    {
        return $this->hasMany(BillSchemeStudent::class);
    }
}
