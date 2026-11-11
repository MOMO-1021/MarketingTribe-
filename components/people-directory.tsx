"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useCircleFeedStore, type MemberCard } from "./circle-feed-provider";
import { LoadingState } from "./loading-state";
import { formatDate } from "@/lib/format";

export function PeopleDirectory({
  initialPeople,
}: {
  initialPeople?: MemberCard[];
}) {
  const store = useCircleFeedStore();
  const cachedPeople = store.getPeople();
  const hadCachedPeople = useRef(cachedPeople !== undefined);
  if (initialPeople) store.seedPeople(initialPeople);

  const [, setPeople] = useState<MemberCard[] | undefined>(
    () => cachedPeople ?? initialPeople,
  );
  const firstView = useRef(true);
  const [error, setError] = useState(false);
  const [refreshError, setRefreshError] = useState(false);
  const people = store.getPeople() ?? initialPeople;

  useEffect(() => {
    document.title = "People · MarketingTribe";
  }, []);

  useEffect(() => {
    let active = true;
    const firstViewHasServerData = firstView.current && initialPeople !== undefined;
    firstView.current = false;
    if (firstViewHasServerData && !hadCachedPeople.current) return;

    const cached = store.getPeople();
    setError(false);
    setRefreshError(false);
    if (cached) {
      setPeople(cached);
      void store.loadPeople().then(
        (fresh) => {
          if (active) setPeople(fresh);
        },
        () => {
          if (active) setRefreshError(true);
        },
      );
    } else {
      setPeople(undefined);
      void store.loadPeople().then(
        (fresh) => {
          if (active) setPeople(fresh);
        },
        () => {
          if (active) setError(true);
        },
      );
    }

    return () => {
      active = false;
    };
  }, [initialPeople, store]);

  if (!people && !error) return <LoadingState message="Loading people…" feed />;
  if (!people && error) {
    return (
      <div role="alert" className="border-t border-line py-8 text-sm text-mute">
        <p>Couldn’t load the people list.</p>
        <button
          type="button"
          onClick={() => {
            setError(false);
            void store.loadPeople().then(
              setPeople,
              () => setError(true),
            );
          }}
          className="mt-2 text-ink underline underline-offset-4"
        >
          Try again
        </button>
      </div>
    );
  }
  if (!people) return null;

  return (
    <div>
      <h1 className="font-serif text-[1.7rem] tracking-tight">People</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-mute">
        Everyone in the room. Open a profile to see what they have been talking about.
      </p>
      {refreshError ? (
        <p role="status" className="mt-2 text-xs text-mute">
          Couldn’t refresh the list; showing saved members.
        </p>
      ) : null}
      {people.length === 0 ? (
        <p className="mt-8 border-t border-line py-8 text-sm text-mute">No members yet.</p>
      ) : (
        <ul className="mt-6 border-t border-line">
          {people.map((member) => (
            <li key={member.id} className="border-b border-line py-4">
              <Link href={`/u/${member.id}`} className="font-serif text-xl tracking-tight hover:underline">
                {member.name}
              </Link>
              <p className="mt-1 text-sm text-mute">
                {member.practice} · {member.city}
              </p>
              <p className="mt-1 text-xs text-mute">Joined {formatDate(member.created_at)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
