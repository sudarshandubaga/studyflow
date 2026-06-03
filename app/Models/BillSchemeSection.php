<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BillSchemeSection extends Model
{
    protected $fillable = ['bill_scheme_id', 'section_id'];

    protected $table = 'bill_scheme_sections';

    public function billScheme()
    {
        return $this->belongsTo(BillScheme::class);
    }

    public function section()
    {
        return $this->belongsTo(Section::class);
    }
}
