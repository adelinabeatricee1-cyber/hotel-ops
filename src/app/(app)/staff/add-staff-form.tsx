"use client";

import { useActionState, useEffect, useRef } from "react";
import { createStaff } from "./actions";

export function AddStaffForm() {
  const [state, formAction, pending] = useActionState(createStaff, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!pending && !state?.error) {
      formRef.current?.reset();
    }
  }, [pending, state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-3">
      <div>
        <label htmlFor="name" className="block text-xs font-medium text-slate-600">
          Nume
        </label>
        <input
          id="name"
          name="name"
          required
          placeholder="Maria Ionescu"
          className="mt-1 w-48 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>
      <div>
        <label htmlFor="role" className="block text-xs font-medium text-slate-600">
          Rol
        </label>
        <input
          id="role"
          name="role"
          placeholder="Camerista"
          className="mt-1 w-36 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>
      <div>
        <label htmlFor="phone" className="block text-xs font-medium text-slate-600">
          Telefon
        </label>
        <input
          id="phone"
          name="phone"
          placeholder="07xx xxx xxx"
          className="mt-1 w-36 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "Se adaugă..." : "Adaugă"}
      </button>
      {state?.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
