<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentCategory extends Model
{
    protected $fillable = [
        'name',
        'description',
        'session_id',
    ];
}
