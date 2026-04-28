<?php

namespace App\Http\Controllers;

use App\Models\Media;
use App\Models\UserProgress;
use App\Models\UserEpisode;
use App\Jobs\MarkEpisodesJob;
use Illuminate\Http\Request;

class ProgressController extends Controller
{
    public function updateProgress(Request $request, Media $media)
    {
        $request->validate([
            'status'     => 'required|in:watching,completed,plan_to_watch,dropped',
            'rating'     => 'nullable|integer|min:1|max:10',
            'stopped_at' => 'nullable|integer|min:0',
            'watch_url'  => [
                'nullable',
                'string',
                'max:2048',
                'url',
                function ($attribute, $value, $fail) {
                    if ($value === null) return;
                    $allowed = [
                        'netflix.com', 'primevideo.com', 'disneyplus.com',
                        'hbo.com', 'hbomax.com', 'apple.com', 'youtube.com',
                        'blutv.com', 'gain.tv', 'exxen.com', 'mubi.com',
                    ];
                    $host = strtolower(parse_url($value, PHP_URL_HOST) ?? '');
                    $host = preg_replace('/^www\./', '', $host);
                    if (!in_array($host, $allowed)) {
                        $fail('Geçersiz platform URL\'si.');
                    }
                },
            ],
            'platform' => 'nullable|string|max:100',
        ]);

        $data = ['status' => $request->status, 'rating' => $request->rating];
        if ($request->has('stopped_at')) {
            $data['stopped_at'] = $request->stopped_at;
        }
        if ($request->has('watch_url')) {
            $data['watch_url'] = $request->watch_url;
        }
        if ($request->has('platform')) {
            $data['platform'] = $request->platform;
        }

        $existingProgress = UserProgress::where('user_id', $request->user()->id)
            ->where('media_id', $media->id)
            ->first();
        $oldStatus = $existingProgress ? $existingProgress->status : null;

        $progress = UserProgress::updateOrCreate(
            ['user_id' => $request->user()->id, 'media_id' => $media->id],
            $data
        );

        // İçerik tamamlandıysa tüm dakika bilgilerini sıfırla
        if ($progress->status === 'completed') {
            $progress->stopped_at = null;
            $progress->save();
        }

        // Dispatch a queued job to mark/unmark episodes — keeps the request fast
        // and prevents locking the server with up to 10,000 synchronous DB writes.
        if ($media->type === 'tv') {
            $newStatus      = $progress->status;
            $wasCompleted   = $newStatus === 'completed' && $oldStatus !== 'completed';
            $wasUncompleted = $newStatus !== 'completed' && $oldStatus === 'completed';

            if ($wasCompleted || $wasUncompleted) {
                MarkEpisodesJob::dispatch(
                    $request->user()->id,
                    $media->id,
                    $media->tmdb_id,
                    $wasCompleted,
                );
            }
        }

        return response()->json($progress);
    }

    public function updateEpisodeProgress(Request $request, Media $media)
    {
        $request->validate([
            'season_number'  => 'required|integer',
            'episode_number' => 'required|integer',
            'is_watched'     => 'required|boolean',
            'rating'         => 'nullable|integer|min:1|max:10',
            'stopped_at'     => 'nullable|integer|min:0',
        ]);

        $data = [
            'is_watched' => $request->is_watched,
            'rating'     => $request->rating,
        ];
        if ($request->has('stopped_at')) {
            $data['stopped_at'] = $request->stopped_at;
        }

        $episode = UserEpisode::updateOrCreate(
            [
                'user_id'        => $request->user()->id,
                'media_id'       => $media->id,
                'season_number'  => $request->season_number,
                'episode_number' => $request->episode_number,
            ],
            $data
        );

        return response()->json($episode);
    }

    public function getProgress(Request $request)
    {
        $progress = UserProgress::with('media')->where('user_id', $request->user()->id)->get();

        foreach ($progress as $p) {
            // En son izlenen bölüm (diziler için)
            if ($p->media && $p->media->type === 'tv') {
                $lastEp = UserEpisode::where('user_id', $request->user()->id)
                    ->where('media_id', $p->media_id)
                    ->where('is_watched', true)
                    ->orderByDesc('season_number')
                    ->orderByDesc('episode_number')
                    ->first();

                if ($lastEp) {
                    $p->last_episode = 'S' . str_pad($lastEp->season_number, 2, '0', STR_PAD_LEFT)
                        . 'E' . str_pad($lastEp->episode_number, 2, '0', STR_PAD_LEFT);
                }
            }

            // Site geneli ortalama kullanıcı puanı
            $siteAvg = UserProgress::where('media_id', $p->media_id)
                ->whereNotNull('rating')
                ->avg('rating');
            $p->site_avg_rating = $siteAvg ? round($siteAvg, 1) : null;
        }

        return response()->json($progress);
    }

    public function getEpisodes(Request $request, Media $media)
    {
        $episodes = UserEpisode::where('user_id', $request->user()->id)
            ->where('media_id', $media->id)
            ->get();

        return response()->json($episodes);
    }

    public function getMediaProgress(Request $request, Media $media)
    {
        $progress = UserProgress::where('user_id', $request->user()->id)
            ->where('media_id', $media->id)
            ->first();

        return response()->json($progress);
    }

    public function deleteProgress(Request $request, Media $media)
    {
        $userId = $request->user()->id;

        UserProgress::where('user_id', $userId)
            ->where('media_id', $media->id)
            ->delete();

        // Delete associated episodes if it's a TV show
        if ($media->type === 'tv') {
            UserEpisode::where('user_id', $userId)
                ->where('media_id', $media->id)
                ->delete();
        }

        return response()->json(['message' => 'Progress deleted successfully']);
    }
}
