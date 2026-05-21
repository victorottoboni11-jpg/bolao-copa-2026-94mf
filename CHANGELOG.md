# Changelog

## 2026-05-21 — Official FIFA 2026 schedule integration

- Integrate official FIFA 2026 schedule and teams
- Imported 104 matches (72 group stage + 32 knockout placeholders)
- Implement Brasília → UTC conversion for canonical wall-clock times
- Standardize on `kickoff_at` as single source-of-truth for match datetimes
- Add kickoff/phase system refactor and knockout phase support
- Improve prediction locking logic and mobile prediction UX
- Fix Supabase upsert flows (teams onConflict by `name`, matches by `match_number`)

Notes:
- Seeds live in `app/lib/seedCopa2026Data.ts` as the canonical source.
- Removed legacy duplicate seed files to avoid confusion.
