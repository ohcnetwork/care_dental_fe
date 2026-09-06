/** A molar, for the studio's type picker and the chart's own header. Same
 *  contract as a lucide icon: 24-unit box, `currentColor` stroke. */
export function ToothIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 5.5c-1.2-1-2.6-1.6-4-1.5C5.3 4.2 3.5 6.3 3.5 9c0 2 .8 3.2 1.4 4.4.7 1.4 1 3.4 1.2 5.6.1 1.2 1.7 1.5 2.3.4L10 15.5c.5-.9 1.5-1.4 2-1.4s1.5.5 2 1.4l1.6 3.9c.6 1.1 2.2.8 2.3-.4.2-2.2.5-4.2 1.2-5.6.6-1.2 1.4-2.4 1.4-4.4 0-2.7-1.8-4.8-4.5-5-1.4-.1-2.8.5-4 1.5Z" />
    </svg>
  );
}
