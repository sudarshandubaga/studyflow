<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FeeBillBook extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function branch()
    {
        return $this->belongsTo(SchoolBranch::class, 'branch_id');
    }

    public function session()
    {
        return $this->belongsTo(Session::class);
    }
}
