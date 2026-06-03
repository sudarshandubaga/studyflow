<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomFieldValue extends Model
{
    protected $fillable = [
        'custom_field_id',
        'customable_id',
        'customable_type',
        'field_value',
    ];

    public function customable()
    {
        return $this->morphTo();
    }

    public function customField()
    {
        return $this->belongsTo(CustomField::class);
    }
}
