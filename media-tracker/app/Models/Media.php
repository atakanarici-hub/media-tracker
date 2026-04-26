<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Media extends Model
{
    protected $table = 'medias';
    protected $fillable = ['tmdb_id', 'type', 'title', 'poster_path', 'vote_average'];
}
