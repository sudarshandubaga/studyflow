<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FeeChargeDetail extends Model
{
    protected $guarded = ['id'];

    public function feeCharge()
    {
        return $this->belongsTo(FeeCharge::class);
    }

    public function feeHead()
    {
        return $this->belongsTo(FeeHead::class);
    }
}
