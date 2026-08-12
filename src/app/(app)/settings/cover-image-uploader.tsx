"use client";

import { useRef, useState, useTransition } from "react";
import { Check, ImageUp, Link2, Trash2 } from "lucide-react";
import { clearCoverImage, setCoverImageUrl, uploadCoverImage } from "./actions";

export function CoverImageUploader({ coverImageUrl }: { coverImageUrl: string | null }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [urlSaved, setUrlSaved] = useState(false);
  const [showUrlField, setShowUrlField] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const formData = new FormData();
    formData.append("photo", file);
    setError(null);
    startTransition(async () => {
      const result = await uploadCoverImage(formData);
      if (result?.error) setError(result.error);
    });
  }

  function handleClear() {
    if (!confirm("Ștergi poza de fundal?")) return;
    setError(null);
    startTransition(async () => {
      const result = await clearCoverImage();
      if (result?.error) setError(result.error);
    });
  }

  function handleUrlSave() {
    const url = urlInputRef.current?.value ?? "";
    setError(null);
    setUrlSaved(false);
    startTransition(async () => {
      const result = await setCoverImageUrl(url);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setUrlSaved(true);
      setTimeout(() => setUrlSaved(false), 2000);
    });
  }

  return (
    <div>
      <p className="block text-xs font-medium text-slate-600">Poză de fundal</p>
      <div className="mt-1.5 flex items-center gap-3">
        {coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverImageUrl}
            alt="Poză de fundal hotel"
            className="h-16 w-24 rounded-lg object-cover ring-1 ring-slate-200"
          />
        ) : (
          <div className="flex h-16 w-24 items-center justify-center rounded-lg bg-slate-100 text-slate-300">
            <ImageUp className="h-6 w-6" />
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:border-olive-300 hover:text-olive-800 disabled:opacity-60"
          >
            <ImageUp className="h-3.5 w-3.5" />
            {isPending ? "Se încarcă..." : coverImageUrl ? "Schimbă poza" : "Încarcă poză"}
          </button>
          {coverImageUrl && (
            <button
              type="button"
              onClick={handleClear}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-600 disabled:opacity-40"
            >
              <Trash2 className="h-3 w-3" />
              Șterge poza
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      <p className="mt-1.5 text-xs text-slate-400">
        Apare pe dashboard și pe pagina oaspetelui. Ideal: o poză de tip peisaj (ex. fațada
        hotelului sau o cameră).
      </p>

      {showUrlField ? (
        <div key={coverImageUrl ?? "none"} className="mt-2 flex items-center gap-2">
          <input
            ref={urlInputRef}
            type="url"
            defaultValue={coverImageUrl ?? ""}
            placeholder="https://..."
            className="w-full max-w-xs rounded-lg border border-slate-300 px-2 py-1.5 text-xs shadow-sm focus:border-olive-500 focus:outline-none focus:ring-2 focus:ring-olive-500/20"
          />
          <button
            type="button"
            onClick={handleUrlSave}
            disabled={isPending}
            className="inline-flex shrink-0 items-center gap-1 rounded-md bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
          >
            {urlSaved ? <Check className="h-3.5 w-3.5" /> : "Salvează"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowUrlField(true)}
          className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-600"
        >
          <Link2 className="h-3 w-3" />
          sau lipește un link
        </button>
      )}
    </div>
  );
}
