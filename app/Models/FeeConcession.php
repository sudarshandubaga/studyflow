<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FeeConcession extends Model
{
    protected $fillable = ['name', 'session_id', 'branch_id', 'is_active'];

    public function details() { return $this->hasMany(FeeConcessionDetail::class); }
    public function students() { return $this->hasMany(FeeConcessionStudent::class); }
}

class FeeConcessionDetail extends Model
{
    protected $fillable = ['fee_concession_id', 'fee_head_id', 'amount_type', 'amount_value'];
    public function head() { return $this->belongsTo(FeeHead::class, 'fee_head_id'); }
}

class FeeConcessionStudent extends Model
{
    protected $fillable = ['fee_concession_id', 'student_id'];
    public function student() { return $this->belongsTo(Student::class); }
}
