<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EventCalendar extends Model
{
    protected $fillable = [
        'school_id',
        'event_type',
        'name',
        'start_date',
        'end_date',
        'description',
        'mark_attendance',
        'event_for',
        'is_active',
    ];

    protected $casts = [
        'mark_attendance' => 'boolean',
        'is_active' => 'boolean',
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function school()
    {
        return $this->belongsTo(School::class);
    }
}
