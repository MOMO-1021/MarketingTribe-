import Link from "next/link";

export function FeedBar({
  title,
  description,
  sort,
  basePath,
  query,
}: {
  title: string;
  description?: string;
  sort: "new" | "top";
  basePath: string;
  query?: string;
}) {
  const href = (next: "new" | "top") => {
    const params = new URLSearchParams();
    if (next === "top") params.set("sort", "top");
    if (query) params.set("q", query);
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <div className="mb-4">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="font-serif text-[1.7rem] tracking-tight">{title}</h1>
        <p className="shrink-0 text-sm text-mute">
          <Link href={href("new")} className={sort === "new" ? "text-ink" : "hover:text-ink"}>
            Latest
          </Link>
          <span> · </span>
          <Link href={href("top")} className={sort === "top" ? "text-ink" : "hover:text-ink"}>
            Top
          </Link>
        </p>
      </div>
      {description ? <p className="mt-2 max-w-xl text-sm leading-relaxed text-mute">{description}</p> : null}
    </div>
  );
}
