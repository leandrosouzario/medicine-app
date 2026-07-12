-- =============================================================================
-- Migration: Medicine App — fundação (tabelas med_*)
-- Execute no Supabase Studio → SQL Editor (uma vez)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. med_medications — medicamentos cadastrados pelo usuário
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.med_medications (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name         text        NOT NULL,
  dosage       text,
  form         text        CHECK (form IS NULL OR form IN ('pill', 'liquid', 'injection', 'other')),
  instructions text,
  notes        text,
  schedule     jsonb       NOT NULL,
  period       jsonb       NOT NULL,
  active       boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT med_medications_name_not_empty CHECK (char_length(trim(name)) > 0)
);

-- ---------------------------------------------------------------------------
-- 2. med_dose_events — doses agendadas e registradas
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.med_dose_events (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  medication_id  uuid        NOT NULL REFERENCES public.med_medications (id) ON DELETE CASCADE,
  scheduled_at   timestamptz NOT NULL,
  status         text        NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending', 'taken', 'skipped', 'missed')),
  taken_at       timestamptz,
  note           text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3. Índices
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS med_medications_user_id_idx
  ON public.med_medications (user_id, active);

CREATE INDEX IF NOT EXISTS med_dose_events_user_scheduled_idx
  ON public.med_dose_events (user_id, scheduled_at);

CREATE INDEX IF NOT EXISTS med_dose_events_medication_id_idx
  ON public.med_dose_events (medication_id, scheduled_at);

CREATE UNIQUE INDEX IF NOT EXISTS med_dose_events_medication_scheduled_unique
  ON public.med_dose_events (medication_id, scheduled_at);

-- ---------------------------------------------------------------------------
-- 4. Trigger: atualizar updated_at
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.med_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS med_medications_updated_at ON public.med_medications;
CREATE TRIGGER med_medications_updated_at
  BEFORE UPDATE ON public.med_medications
  FOR EACH ROW
  EXECUTE FUNCTION public.med_set_updated_at();

DROP TRIGGER IF EXISTS med_dose_events_updated_at ON public.med_dose_events;
CREATE TRIGGER med_dose_events_updated_at
  BEFORE UPDATE ON public.med_dose_events
  FOR EACH ROW
  EXECUTE FUNCTION public.med_set_updated_at();

-- ---------------------------------------------------------------------------
-- 5. Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE public.med_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.med_dose_events  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own medications" ON public.med_medications;
CREATE POLICY "Users can manage own medications"
  ON public.med_medications
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own dose events" ON public.med_dose_events;
CREATE POLICY "Users can manage own dose events"
  ON public.med_dose_events
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 6. Grants
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON public.med_medications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.med_dose_events  TO authenticated;
