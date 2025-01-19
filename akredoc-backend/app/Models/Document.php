<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    protected $fillable = [
        'name',
        'type',
        'size',
        'user_id',
        'ppepp_section_id',
        'status',
        'detail'
    ];
    

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function ppeppSection()
{
    return $this->belongsTo(PpeppSection::class, 'ppepp_section_id');
}

public function scopeByDetail($query, $detail)
{
    return $query->where('detail', $detail);
}

}