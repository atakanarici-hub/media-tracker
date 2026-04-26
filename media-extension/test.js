const path = "/dizi/the-hunting-party-2025-hdfc/sezon-2/bolum-11/";

function extractFromUrl(path) {
    let season = null;
    let episode = null;

    const sxE = path.match(/(?:^|\/|[-_])(?:s)?(\d+)[xe](\d+)(?:[-_]|$|\/)/i);
    if (sxE) {
      season = parseInt(sxE[1], 10);
      episode = parseInt(sxE[2], 10);
    }
    if (!season) {
      const sMatch = path.match(/(?:sezon|season)[-_](\d+)|(\d+)[-_](?:sezon|season)/i);
      if (sMatch) season = parseInt(sMatch[1] || sMatch[2], 10);
    }
    if (!episode) {
      const eMatch = path.match(/(?:bolum|episode|ep)[-_](\d+)|(\d+)[-_](?:bolum|episode|ep)/i);
      if (eMatch) episode = parseInt(eMatch[1] || eMatch[2], 10);
    }

    const segments = path.split('/').filter(s => s.length > 2);
    const ignoredKeywords = ['dizi', 'film', 'movie', 'series', 'watch', 'izle', 'player', 'embed', 'season', 'sezon', 'bolum', 'episode', 'ep'];

    let bestTitle = null;

    for (const seg of segments) {
      const lower = seg.toLowerCase();
      if (ignoredKeywords.includes(lower)) continue;
      if (/^(sezon|season|bolum|episode|ep)[-_]\d+$/.test(lower)) continue;
      if (/^\d+[-_](sezon|season|bolum|episode|ep)$/.test(lower)) continue;
      if (/^\d+$/.test(lower)) continue;

      let cleaned = seg
        .replace(/[-_]?(?:s)?\d+[xe]\d+.*$/i, '')
        .replace(/[-_]\d+[-_]?(sezon|bolum|episode|season).*$/i, '')
        .replace(/(sezon|bolum|episode|season)[-_]\d+.*$/i, '')
        .replace(/[-_](hdfc|izle|altyazili|dublaj|full|hd|1080p|720p|4k).*$/i, '')
        .replace(/[-_]/g, ' ')
        .trim();

      if (cleaned.length > 2) {
        let finalTitle = cleaned.replace(/\b\w/g, c => c.toUpperCase());
        if (!bestTitle) bestTitle = finalTitle;
      }
    }

    return { title: bestTitle, season, episode };
}

console.log(extractFromUrl(path));
console.log(extractFromUrl("/bolum/gibi-6x2-c03"));
console.log(extractFromUrl("/watch/80014749"));

