import type { SVGProps } from "react";

export function WhatsAppIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      {...props}
    >
      <path d="M20.5 11.7a8.5 8.5 0 0 1-12.6 7.5L3 20.5l1.3-4.8A8.5 8.5 0 1 1 20.5 11.7Z" />
      <path d="M8.5 7.5c-.4 0-1 1-1 1.8 0 2.8 3.8 6.2 6.5 6.2.8 0 2-.7 2-1.2l-2.4-1.4-.8 1c-1.3-.5-2.6-1.7-3.2-3l1-.8-1.3-2.6Z" />
    </svg>
  );
}
