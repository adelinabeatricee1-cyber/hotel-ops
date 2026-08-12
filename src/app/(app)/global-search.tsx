"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { BedDouble, CalendarDays, Heart, Search, Users, X } from "lucide-react";
import { globalSearch, type SearchResult } from "./search-actions";

const TYPE_ICON = {
  booking: CalendarDays,
  room: BedDouble,
  guest: Heart,
  staff: Users,
};

const TYPE_LABEL = {
  booking: "Rezervare",
  room: "Cameră",
  guest: "Client fidel",
  staff: "Personal",
};

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      return;
    }
    const handle = setTimeout(() => {
      startTransition(async () => {
        const found = await globalSearch(query);
        setResults(found);
      });
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  function handleSelect() {
    setOpen(false);
    setQuery("");
    setResults([]);
  }

  return (
    <div ref={containerRef} className="relative px-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Caută oaspete, cameră..."
          className="w-full rounded-lg border border-white/10 bg-white/10 py-1.5 pl-8 pr-7 text-xs text-white placeholder:text-stone-400 focus:border-white/30 focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setResults([]);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && query.trim().length >= 2 && (
        <div className="absolute left-2 right-2 top-full z-20 mt-1 max-h-96 overflow-y-auto rounded-xl bg-white shadow-xl ring-1 ring-black/5">
          {isPending && results.length === 0 ? (
            <p className="px-3 py-3 text-xs text-slate-400">Se caută...</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-3 text-xs text-slate-400">Niciun rezultat pentru &quot;{query}&quot;.</p>
          ) : (
            <ul className="divide-y divide-slate-100 py-1">
              {results.map((result) => {
                const Icon = TYPE_ICON[result.type];
                return (
                  <li key={`${result.type}-${result.id}`}>
                    <Link
                      href={result.href}
                      onClick={handleSelect}
                      className="flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-olive-100 text-olive-700">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-slate-800">{result.title}</p>
                        <p className="truncate text-[11px] text-slate-500">
                          {TYPE_LABEL[result.type]}
                          {result.subtitle ? ` · ${result.subtitle}` : ""}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
