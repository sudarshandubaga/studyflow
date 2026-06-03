<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomField extends Model
{
    protected $fillable = [
        'custom_field_category_id',
        'name',
        'field_type',
        'data_type',
        'options',
        'is_mandatory',
        'show_on_table',
        'default_value',
        'placeholder',
        'validation_message',
        'max_length',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'is_mandatory' => 'boolean',
        'show_on_table' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function category()
    {
        return $this->belongsTo(CustomFieldCategory::class, 'custom_field_category_id');
    }
}
