<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FeeFine extends Model
{
    protected $fillable = [
        'session_id', 'grace_period', 'fine_type', 'time_period', 'amount', 'branch_id', 'is_active'
    ];
}
