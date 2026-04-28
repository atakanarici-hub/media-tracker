<?php

namespace App\Jobs;

use App\Models\UserEpisode;
use App\Services\TmdbService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class MarkEpisodesJob implements ShouldQueue
{
    use Queueable;

    /**
     * Maximum attempts before the job is marked as failed.
     */
    public int $tries = 3;

    /**
     * Maximum seconds the job may run.
     */
    public int $timeout = 120;

    /**
     * @param int  $userId      Owner of the progress record.
     * @param int  $mediaId     Local DB media ID.
     * @param int  $tmdbId      TMDB ID (used to fetch season/episode counts).
     * @param bool $markWatched TRUE  → mark every episode watched.
     *                          FALSE → unmark every episode.
     */
    public function __construct(
        public readonly int $userId,
        public readonly int $mediaId,
        public readonly int $tmdbId,
        public readonly bool $markWatched,
    ) {}

    public function handle(TmdbService $tmdbService): void
    {
        if ($this->markWatched) {
            try {
                $tmdbData = $tmdbService->getDetails('tv', $this->tmdbId);

                if (isset($tmdbData['seasons'])) {
                    foreach ($tmdbData['seasons'] as $season) {
                        if ($season['season_number'] <= 0) {
                            continue;
                        }

                        // Hard cap: prevent DB flooding from shows with bogus episode counts.
                        $episodeCount = min((int) $season['episode_count'], 500);

                        $records = [];
                        for ($i = 1; $i <= $episodeCount; $i++) {
                            $records[] = [
                                'user_id'        => $this->userId,
                                'media_id'       => $this->mediaId,
                                'season_number'  => $season['season_number'],
                                'episode_number' => $i,
                                'is_watched'     => true,
                                'stopped_at'     => null,
                                'rating'         => null,
                            ];
                        }

                        if (!empty($records)) {
                            // Bulk upsert — single query per season instead of N individual writes.
                            UserEpisode::upsert(
                                $records,
                                ['user_id', 'media_id', 'season_number', 'episode_number'],
                                ['is_watched', 'stopped_at'],
                            );
                        }
                    }
                }
            } catch (\Exception) {
                // TMDB fetch failure — swallow; user can manually mark episodes.
            }

            // Reset stopped_at on any pre-existing rows that were already in the DB.
            UserEpisode::where('user_id', $this->userId)
                ->where('media_id', $this->mediaId)
                ->update(['stopped_at' => null]);

        } else {
            UserEpisode::where('user_id', $this->userId)
                ->where('media_id', $this->mediaId)
                ->update(['is_watched' => false]);
        }
    }
}
