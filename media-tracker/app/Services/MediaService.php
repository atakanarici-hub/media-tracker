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

    /**
     * @param bool $persist  When true, upserts the media record into the local DB.
     *                       Must only be true for authenticated callers.
     */
    public function getDetails(string $type, int $tmdbId, bool $persist = false)
    {
        $tmdbData = $this->tmdbService->getDetails($type, $tmdbId);

        $media = null;
        if ($persist && isset($tmdbData['id'])) {
            $mediaData = [
                'type'         => $type,
                'title'        => $type === 'movie' ? ($tmdbData['title'] ?? '') : ($tmdbData['name'] ?? ''),
                'poster_path'  => $tmdbData['poster_path'] ?? null,
                'vote_average' => $tmdbData['vote_average'] ?? null,
            ];

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
