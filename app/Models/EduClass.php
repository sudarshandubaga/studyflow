<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EduClass extends Model
{
    protected $table = "classes";

    protected $fillable = [
        'name',
        'session_id',
    ];

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function session()
    {
        return $this->belongsTo(Session::class);
    }

    public function sections()
    {
        return $this->hasMany(Section::class, 'class_id');
    }
}