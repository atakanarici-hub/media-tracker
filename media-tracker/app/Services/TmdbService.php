<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class TmdbService
{
    protected $baseUrl = 'https://api.themoviedb.org/3';
    protected $apiKey;

    public function __construct()
    {
        $this->apiKey = config('services.tmdb.key');

        if (!$this->apiKey) {
            throw new \RuntimeException('TMDB API anahtarı tanımlı değil. Lütfen TMDB_API_KEY ortam değişkenini ayarlayın.');
        }
    }

    public function search(string $query)
    {
        $response = Http::get("{$this->baseUrl}/search/multi", [
            'api_key' => $this->apiKey,
            'query' => $query,
            'language' => 'tr-TR',
            'include_adult' => false
        ]);

        return $response->json();
    }

    public function getDetails(string $type, int $tmdbId)
    {
        // Type should be 'movie' or 'tv'
        $response = Http::get("{$this->baseUrl}/{$type}/{$tmdbId}", [
            'api_key' => $this->apiKey,
            'language' => 'tr-TR',
            'append_to_response' => 'videos,watch/providers',
            'include_video_language' => 'tr,en,en-US'
        ]);

        return $response->json();
    }

    public function getSeasonDetails(int $tmdbId, int $seasonNumber)
    {
        $response = Http::get("{$this->baseUrl}/tv/{$tmdbId}/season/{$seasonNumber}", [
            'api_key' => $this->apiKey,
            'language' => 'tr-TR'
        ]);

        return $response->json();
    }
}
