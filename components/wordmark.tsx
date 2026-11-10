import Link from "next/link";

export function Wordmark({ href }: { href: string }) {
  return (
    <Link href={href} className="font-serif text-[1.7rem] italic leading-none tracking-tight text-ink">
      MarketingTribe
    </Link>
  );
}
