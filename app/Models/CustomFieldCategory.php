<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomFieldCategory extends Model
{
    protected $fillable = [
        'school_id',
        'name',
        'short_name',
        'type',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function customFields()
    {
        return $this->hasMany(CustomField::class);
    }
}
