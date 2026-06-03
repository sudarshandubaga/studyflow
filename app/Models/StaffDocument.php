<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class StaffDocument extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'school_id',
        'branch_id',
        'user_id',
        'staff_document_type_id',
        'file_name',
        'file_path',
        'file_type',
        'file_size',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function documentType()
    {
        return $this->belongsTo(StaffDocumentType::class, 'staff_document_type_id');
    }
}
