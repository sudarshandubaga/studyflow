<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BillSchemeStudent extends Model
{
    protected $fillable = ['bill_scheme_id', 'student_id'];

    protected $table = 'bill_scheme_students';

    public function billScheme()
    {
        return $this->belongsTo(BillScheme::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}
