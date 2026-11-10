import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <p className="font-serif text-4xl italic tracking-tight">Nothing here.</p>
      <p className="mt-3 text-sm text-mute">That page is not part of the room.</p>
      <Link href="/" className="btn-large mt-6 w-fit">
        Back to the door
      </Link>
    </main>
  );
}
