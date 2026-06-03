<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Country extends Model
{
    protected $guarded = [];

    public function branch()
    {
        return $this->belongsTo(SchoolBranch::class);
    }

    public function states()
    {
        return $this->hasMany(State::class);
    }
}
