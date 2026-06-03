<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SectionGroup extends Model
{
    protected $fillable = [
        'name',
        'section_id',
    ];

    public function section()
    {
        return $this->belongsTo(Section::class);
    }
}
