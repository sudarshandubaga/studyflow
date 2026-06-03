<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FeeBank extends Model
{
    protected $fillable = ['name', 'school_id', 'branch_id', 'is_active'];
}
