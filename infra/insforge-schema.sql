CREATE TABLE IF NOT EXISTS public.free_sf_documents (
  id text PRIMARY KEY,
  document jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.free_sf_documents ENABLE ROW LEVEL SECURITY;
