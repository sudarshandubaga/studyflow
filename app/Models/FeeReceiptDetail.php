<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FeeReceiptDetail extends Model
{
    protected $guarded = ['id'];

    public function feeReceipt()
    {
        return $this->belongsTo(FeeReceipt::class);
    }

    public function feeHead()
    {
        return $this->belongsTo(FeeHead::class);
    }

    public function feeChargeDetail()
    {
        return $this->belongsTo(FeeChargeDetail::class);
    }
}
