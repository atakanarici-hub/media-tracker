<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserEpisode extends Model
{
    protected $fillable = ['user_id', 'media_id', 'season_number', 'episode_number', 'is_watched', 'rating', 'stopped_at'];

    public function media()
    {
        return $this->belongsTo(Media::class);
    }
}
