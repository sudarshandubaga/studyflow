<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class School extends Model
{
    protected $fillable = [
        'domain',
        'name',
        'email',
        'phone',
        'address',
        'logo',
        'favicon',
        'google_map_embed',
        'footer_scripts',
        'header_scripts',
        'timezone',
        'is_active',
        'valid_until',
    ];

    public function branches()
    {
        return $this->hasMany(SchoolBranch::class);
    }
}
