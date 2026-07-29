/*
# Create study_recordings table (single-tenant, no auth)

1. New Tables
- `study_recordings`
  - `id` (uuid, primary key)
  - `day_number` (int, which study day this recording belongs to)
  - `block_name` (text, name of the study block being recorded)
  - `topic` (text, the topic studied during the recording)
  - `duration_seconds` (int, how long the recording lasted)
  - `note` (text, optional user note about the session)
  - `file_name` (text, the downloaded file name for reference)
  - `created_at` (timestamp, when the recording was saved)

2. Security
- Enable RLS on `study_recordings`.
- Allow anon + authenticated CRUD because the app has no sign-in (single-tenant, shared data).
*/

CREATE TABLE IF NOT EXISTS study_recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_number int NOT NULL,
  block_name text NOT NULL,
  topic text NOT NULL,
  duration_seconds int NOT NULL DEFAULT 0,
  note text DEFAULT '',
  file_name text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE study_recordings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_study_recordings" ON study_recordings;
CREATE POLICY "anon_select_study_recordings" ON study_recordings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_study_recordings" ON study_recordings;
CREATE POLICY "anon_insert_study_recordings" ON study_recordings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_study_recordings" ON study_recordings;
CREATE POLICY "anon_update_study_recordings" ON study_recordings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_study_recordings" ON study_recordings;
CREATE POLICY "anon_delete_study_recordings" ON study_recordings FOR DELETE
  TO anon, authenticated USING (true);
