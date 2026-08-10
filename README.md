# Hotel Ops

Aplicație Next.js + Supabase pentru managementul operațional al unui hotel (30-100 camere): autentificare, camere și task-uri de housekeeping/mentenanță.

## Stack

- Next.js 16 (App Router, Server Actions, Turbopack)
- Supabase (Postgres + Auth + Row Level Security)
- Tailwind CSS 4
- TypeScript

## Cum funcționează izolarea datelor pe hotel

- `hotels` — un rând per hotel.
- `profiles` — leagă fiecare utilizator Supabase Auth (`auth.users`) de un `hotel_id`. Acesta e "tabelul `users`" din cerință; parola/emailul rămân gestionate de Supabase Auth.
- Toate celelalte tabele (`rooms`, `staff`, `tasks`, `bookings`) au o coloană `hotel_id` și sunt protejate prin RLS: fiecare policy verifică `hotel_id = auth_hotel_id()`, unde `auth_hotel_id()` citește hotelul utilizatorului curent din `profiles`. Practic, un utilizator nu poate vedea sau modifica niciodată datele altui hotel, indiferent de query-ul folosit din client.
- La signup, funcția `create_hotel_and_profile(hotel_name, owner_full_name)` creează atomic hotelul și profilul asociat contului nou.

## Setup

### 1. Creează proiectul Supabase

1. Creează un proiect nou pe [supabase.com](https://supabase.com).
2. În **SQL Editor**, rulează conținutul fișierului [`supabase/schema.sql`](./supabase/schema.sql). Acesta creează tabelele, indecșii, politicile RLS și funcțiile helper.
3. (Opțional) Dezactivează cerința de confirmare a emailului din **Authentication → Providers → Email** pentru testare rapidă în dev — altfel userul trebuie să confirme emailul înainte ca hotelul să fie creat la primul login.

### 2. Configurează variabilele de mediu

```bash
cp .env.local.example .env.local
```

Completează în `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-public-key>
```

Ambele valori se găsesc în **Project Settings → API** din dashboard-ul Supabase.

### 3. Instalează dependențele și pornește dev server-ul

```bash
npm install
npm run dev
```

Aplicația pornește pe [http://localhost:3000](http://localhost:3000).

### 4. Primul utilizator

Accesează `/signup`, completează numele hotelului, numele tău, email și parolă. La signup se creează automat hotelul și profilul de administrator legat de el. Următorii membri ai personalului cu acces la aplicație pot fi adăugați manual în tabelul `profiles` din Supabase (asociați cu același `hotel_id`) — funcționalitatea de invitare in-app nu este inclusă în acest MVP.

## Module implementate

- **Autentificare** (`/login`, `/signup`) — email/parolă via Supabase Auth, sesiune gestionată prin cookie-uri (`@supabase/ssr`), rute protejate prin `src/proxy.ts`.
- **Dashboard** (`/`) — sumar rapid: camere pe status, task-uri active.
- **Camere** (`/rooms`) — listă tip grid, adăugare cameră (număr, etaj, tip), schimbare rapidă a statusului (`clean` / `dirty` / `inprogress` / `blocked`), ștergere, filtrare după status.
- **Housekeeping** (`/tasks`) — board pe 3 coloane (`todo` / `inprogress` / `done`), creare task legat de o cameră + tip (`housekeeping` / `maintenance`) + persoană asignată + note. Schimbarea statusului unui task de housekeeping actualizează automat statusul camerei (task pornit → cameră `inprogress`, task finalizat → cameră `clean`).
- **Personal** (`/staff`) — listă simplă de angajați (nume, rol, telefon), folosită pentru asignarea task-urilor.

`bookings` există deja în schema de bază de date (cu RLS activă) pentru a susține un viitor modul de rezervări, dar nu are încă interfață.

## Structură

```
supabase/schema.sql          schema DB + RLS + funcții
src/lib/supabase/            client-uri Supabase (browser, server, middleware)
src/lib/current-user.ts      helper server-side: profil + hotel curent
src/app/(auth)/actions.ts    server actions: login / signup / logout
src/app/login, /signup       pagini de autentificare
src/app/(app)/               shell aplicație (sidebar) + module protejate
src/app/(app)/rooms          modul camere
src/app/(app)/tasks          modul housekeeping/mentenanță
src/app/(app)/staff          modul personal
```

## Build

```bash
npm run lint
npm run build
```
