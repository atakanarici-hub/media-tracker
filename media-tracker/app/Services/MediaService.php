<?php

namespace App\Services;

use App\Models\Media;

class MediaService
{
    protected $tmdbService;

    public function __construct(TmdbService $tmdbService)
    {
        $this->tmdbService = $tmdbService;
    }

    public function search(string $query)
    {
        $results = $this->tmdbService->search($query);
        
        $filtered = array_filter($results['results'] ?? [], function ($item) {
            return in_array($item['media_type'] ?? '', ['movie', 'tv']);
        });

        return array_values($filtered);
    }

    public function getDetails(string $type, int $tmdbId)
    {
        $tmdbData = $this->tmdbService->getDetails($type, $tmdbId);

        $mediaData = [
            'type'         => $type,
            'title'        => $type === 'movie' ? ($tmdbData['title'] ?? '') : ($tmdbData['name'] ?? ''),
            'poster_path'  => $tmdbData['poster_path'] ?? null,
            'vote_average' => $tmdbData['vote_average'] ?? null,
        ];

        $media = null;
        if (isset($tmdbData['id'])) {
            $media = Media::updateOrCreate(
                ['tmdb_id' => $tmdbData['id']],
                $mediaData
            );
        }

        return [
            'db_record' => $media,
            'tmdb_data' => $tmdbData
        ];
    }

    public function getSeasonDetails(int $tmdbId, int $seasonNumber)
    {
        return $this->tmdbService->getSeasonDetails($tmdbId, $seasonNumber);
    }
}
