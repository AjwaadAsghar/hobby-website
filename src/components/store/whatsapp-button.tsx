import { whatsappLink } from "@/lib/format";

/** Floating "Need help? Chat with us" button using the number from settings. */
export function WhatsAppButton({ number, storeName }: { number: string; storeName: string }) {
  if (!number) return null;
  return (
    <a
      href={whatsappLink(number, `Hi ${storeName}, I need some help.`)}
      target="_blank"
      rel="noopener noreferrer"
      className="no-print fixed right-4 bottom-4 z-40 inline-flex items-center gap-2.5 rounded-full bg-[#0b7a3e] py-2.5 pr-4 pl-3 font-semibold sm:py-3 sm:pr-5 sm:pl-3.5 text-white shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-[#086432] sm:right-6 sm:bottom-6"
    >
      <svg viewBox="0 0 24 24" className="size-7" fill="currentColor" aria-hidden>
        <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.4-.5c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.7.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3ZM12 21.8a9.8 9.8 0 0 1-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A9.8 9.8 0 1 1 12 21.8Zm0-21.6A11.8 11.8 0 0 0 1.8 17.9L.1 24l6.3-1.6A11.8 11.8 0 1 0 12 .2Z" />
      </svg>
      <span className="leading-tight">
        <span className="hidden text-[0.8rem] font-medium sm:block">Need help?</span>
        <span className="block">Chat with us</span>
      </span>
    </a>
  );
}
