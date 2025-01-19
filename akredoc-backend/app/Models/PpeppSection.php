<?php
// PpeppSection.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PpeppSection extends Model
{
    protected $fillable = [
        'section_code',
        'section_name',
        'content',
        'user_id',
        'status'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function documents()
{
    return $this->hasMany(Document::class, 'ppepp_section_id', 'id');
}
}