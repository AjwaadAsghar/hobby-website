import type { SocialLinks } from "@/config/store";

const paths: Record<keyof SocialLinks, { label: string; d: string }> = {
  facebook: {
    label: "Facebook",
    d: "M14 8h3V4h-3c-2.8 0-4.5 1.9-4.5 4.6V11H7v4h2.5v9h4v-9H17l.5-4h-4V8.9c0-.6.4-.9.9-.9H14z",
  },
  instagram: {
    label: "Instagram",
    d: "M12 7.4A4.6 4.6 0 1 0 12 16.6 4.6 4.6 0 0 0 12 7.4Zm0 7.6a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm5.9-7.8a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0ZM12 3.6c2.7 0 3 0 4.1.1 2.7.1 4 1.4 4.1 4.1.1 1.1.1 1.4.1 4.1s0 3-.1 4.1c-.1 2.7-1.4 4-4.1 4.1-1.1.1-1.4.1-4.1.1s-3 0-4.1-.1c-2.7-.1-4-1.4-4.1-4.1C3.7 15 3.6 14.7 3.6 12s0-3 .1-4.1c.1-2.7 1.4-4 4.1-4.1 1.1-.1 1.4-.1 4.2-.1ZM12 2c-2.7 0-3.1 0-4.2.1C4.2 2.3 2.3 4.2 2.1 7.8 2 8.9 2 9.3 2 12s0 3.1.1 4.2c.2 3.6 2.1 5.5 5.7 5.7 1.1.1 1.5.1 4.2.1s3.1 0 4.2-.1c3.6-.2 5.5-2.1 5.7-5.7.1-1.1.1-1.5.1-4.2s0-3.1-.1-4.2c-.2-3.6-2.1-5.5-5.7-5.7C15.1 2 14.7 2 12 2Z",
  },
  youtube: {
    label: "YouTube",
    d: "M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2C2 8.8 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8ZM10 15V9l5.2 3L10 15Z",
  },
  tiktok: {
    label: "TikTok",
    d: "M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.1v12.4a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V9.7a5.7 5.7 0 1 0 4.9 5.7V9.1a7.3 7.3 0 0 0 4.3 1.4V7.4a4.3 4.3 0 0 1-3.2-1.6Z",
  },
  x: {
    label: "X (Twitter)",
    d: "M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.2-8.3L1.8 3h6.4l4.4 5.8L17.8 3Zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5Z",
  },
};

export function SocialIcons({ links, className }: { links: SocialLinks; className?: string }) {
  const entries = (Object.keys(paths) as (keyof SocialLinks)[]).filter((k) => links[k]);
  if (!entries.length) return null;
  return (
    <ul className={className ?? "flex gap-2"}>
      {entries.map((k) => (
        <li key={k}>
          <a
            href={links[k]}
            target="_blank"
            rel="noopener noreferrer"
            className="flex size-11 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
            aria-label={paths[k].label}
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
              <path d={paths[k].d} />
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}
