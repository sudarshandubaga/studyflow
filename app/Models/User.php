<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, HasApiTokens, HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'title_id',
        'first_name',
        'middle_name',
        'last_name',
        'name',
        'email',
        'username',
        'phone',
        'mobile_number',
        'password',
        'gender',
        'dob',
        'role',
        'avatar',
        'is_active',
        'school_id',
        'school_branch_id',
    ];

    public function title()
    {
        return $this->belongsTo(Title::class);
    }

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function schoolBranch()
    {
        return $this->belongsTo(SchoolBranch::class);
    }

    public function employee()
    {
        return $this->hasOne(Employee::class);
    }

    public function customFieldValues()
    {
        return $this->morphMany(CustomFieldValue::class, 'customable');
    }

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
}
