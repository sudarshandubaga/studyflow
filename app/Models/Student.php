<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Student extends Model
{
    use HasFactory, SoftDeletes;

    protected $appends = ['name'];

    public function getNameAttribute()
    {
        return preg_replace('/\s+/', ' ', trim("{$this->first_name} {$this->middle_name} {$this->last_name}"));
    }

    protected $fillable = [
        'school_id',
        'branch_id',
        'session_id',
        'title_id',
        'first_name',
        'middle_name',
        'last_name',
        'gender',
        'dob',
        'email',
        'mobile_no',
        'photo',
        'password',
        'section_id',
        'student_category_id',
        'enrollment_no',
        'roll_no',
        'doj',
        'father_email_id',
        'father_mobile_no',
        'apaar_id',
        'scholar_id',
        'country_id',
        'state_id',
        'city_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     */
    protected $hidden = [
        'password',
    ];

    public function section()
    {
        return $this->belongsTo(Section::class);
    }

    public function category()
    {
        return $this->belongsTo(StudentCategory::class, 'student_category_id');
    }

    public function customFieldValues()
    {
        return $this->morphMany(CustomFieldValue::class, 'customable');
    }

    public function uploadedFiles()
    {
        return $this->hasMany(StudentUploadedFile::class);
    }
}
