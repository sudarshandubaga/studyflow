<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Title extends Model
{
    use HasFactory;

    protected $table = 'titles';

    protected $fillable = [
        'name',
        'short_name',
        'gender',
        'school_id',
        'is_active',
    ];

    public function school()
    {
        return $this->belongsTo(School::class);
    }
}
