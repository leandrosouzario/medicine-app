-- =============================================================================
-- Migration: Medicine App — controle de estoque (unidades genéricas)
-- Execute no Supabase Studio → SQL Editor (uma vez)
-- =============================================================================

ALTER TABLE public.med_medications
  ADD COLUMN IF NOT EXISTS stock_quantity     integer,
  ADD COLUMN IF NOT EXISTS quantity_per_dose  integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS refill_threshold   integer NOT NULL DEFAULT 7;

ALTER TABLE public.med_medications
  DROP CONSTRAINT IF EXISTS med_medications_stock_quantity_nonneg;

ALTER TABLE public.med_medications
  ADD CONSTRAINT med_medications_stock_quantity_nonneg
  CHECK (stock_quantity IS NULL OR stock_quantity >= 0);

ALTER TABLE public.med_medications
  DROP CONSTRAINT IF EXISTS med_medications_quantity_per_dose_positive;

ALTER TABLE public.med_medications
  ADD CONSTRAINT med_medications_quantity_per_dose_positive
  CHECK (quantity_per_dose >= 1);

ALTER TABLE public.med_medications
  DROP CONSTRAINT IF EXISTS med_medications_refill_threshold_nonneg;

ALTER TABLE public.med_medications
  ADD CONSTRAINT med_medications_refill_threshold_nonneg
  CHECK (refill_threshold >= 0);
