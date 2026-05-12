function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
  );
  return match?.[1] ?? null;
}

interface YouTubeEmbedProps {
  url: string;
  title?: string;
}

const YouTubeEmbed = ({ url, title = "Video" }: YouTubeEmbedProps) => {
  const videoId = extractYouTubeId(url);
  if (!videoId) return null;

  return (
    <div className="relative aspect-video rounded-xl overflow-hidden shadow-[var(--shadow-lg)]">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 w-full h-full"
      />
    </div>
  );
};

export default YouTubeEmbed;
