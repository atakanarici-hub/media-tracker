<?php

namespace App\Http\Controllers;

use App\Services\MediaService;
use Illuminate\Http\Request;

class MediaController extends Controller
{
    protected $mediaService;

    public function __construct(MediaService $mediaService)
    {
        $this->mediaService = $mediaService;
    }

    public function search(Request $request)
    {
        $query = $request->query('q');
        if (!$query) {
            return response()->json(['error' => 'Arama kelimesi gerekli'], 400);
        }

        $results = $this->mediaService->search($query);
        return response()->json($results);
    }

    public function details(Request $request, $type, $id)
    {
        if (!in_array($type, ['movie', 'tv'])) {
            return response()->json(['error' => 'Geçersiz medya türü'], 400);
        }

        $id = (int) $id;
        if ($id <= 0) {
            return response()->json(['error' => 'Geçersiz ID'], 422);
        }

        // Only persist to the local DB when the caller is authenticated.
        // Unauthenticated callers get a pure TMDB proxy — no DB writes.
        $details = $this->mediaService->getDetails($type, $id, auth('sanctum')->check());
        return response()->json($details);
    }

    public function getSeasonDetails($id, $seasonNumber)
    {
        $id           = (int) $id;
        $seasonNumber = (int) $seasonNumber;

        if ($id <= 0 || $seasonNumber < 0) {
            return response()->json(['error' => 'Geçersiz parametreler'], 422);
        }

        $data = $this->mediaService->getSeasonDetails($id, $seasonNumber);

        $media = \App\Models\Media::where('tmdb_id', $id)->where('type', 'tv')->first();
        if ($media && isset($data['episodes'])) {
            foreach ($data['episodes'] as &$ep) {
                $siteAvg = \App\Models\UserEpisode::where('media_id', $media->id)
                    ->where('season_number', $seasonNumber)
                    ->where('episode_number', $ep['episode_number'])
                    ->whereNotNull('rating')
                    ->avg('rating');
                $ep['site_rating'] = $siteAvg ? round($siteAvg, 1) : null;
            }
        }

        return response()->json($data);
    }
}
