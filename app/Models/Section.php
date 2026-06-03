<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Section extends Model
{
    protected $fillable = [
        'name',
        'class_id',
    ];
    
    public function eduClass()
    {
        return $this->belongsTo(EduClass::class, 'class_id');
    }

    public function groups()
    {
        return $this->hasMany(SectionGroup::class);
    }
}
