<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    protected $fillable = [
        'title', 
        'description', 
        'start_date', 
        'end_date', 
        'user_id', 
        'color'
    ];

    protected $dates = [
        'start_date', 
        'end_date'
    ];

    // Tambahkan ini untuk selalu menyertakan user dalam response
    protected $with = ['user'];

    // Tentukan field yang ingin ditampilkan dari relasi user
    public function user()
    {
        return $this->belongsTo(User::class)->select(['id', 'name', 'role']);
    }
}