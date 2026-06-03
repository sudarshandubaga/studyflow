<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SchoolBranch extends Model
{
    protected $fillable = [
        'name',
        'school_id',
        'address',
        'phone',
        'email',
    ];

    public function school()
    {
        return $this->belongsTo(School::class);
    }
}
