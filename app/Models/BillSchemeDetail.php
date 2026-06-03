<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BillSchemeDetail extends Model
{
    protected $guarded = ['id'];

    public function billScheme()
    {
        return $this->belongsTo(BillScheme::class);
    }

    public function feeHead()
    {
        return $this->belongsTo(FeeHead::class);
    }
}
