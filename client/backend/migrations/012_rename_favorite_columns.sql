-- -- Migration: Rename favorite table columns to be generic
-- -- This allows the favorite table to work with any entity type in the framework

-- -- Create the new favorite table with generic column names
-- CREATE TABLE IF NOT EXISTS public.favorite (
--   favorite_id SERIAL PRIMARY KEY,
--   id1 BIGINT NOT NULL DEFAULT 0,  -- tenant_id
--   id2 BIGINT NOT NULL DEFAULT 0,  -- user_id
--   id3 BIGINT NOT NULL DEFAULT 0,  -- entity_id (e.g., meter_id)
--   id4 BIGINT NOT NULL DEFAULT 0   -- sub_entity_id (e.g., meter_element_id)
-- );

-- -- Create indexes for common queries
-- CREATE INDEX IF NOT EXISTS idx_favorite_id1_id2 ON public.favorite(id1, id2);
-- CREATE INDEX IF NOT EXISTS idx_favorite_id1_id2_id3 ON public.favorite(id1, id2, id3);
-- CREATE INDEX IF NOT EXISTS idx_favorite_id1_id2_id3_id4 ON public.favorite(id1, id2, id3, id4);

-- -- Add comments for clarity
-- COMMENT ON TABLE public.favorite IS 'Generic favorites table for any entity type';
-- COMMENT ON COLUMN public.favorite.favorite_id IS 'Unique favorite record identifier';
-- COMMENT ON COLUMN public.favorite.id1 IS 'Tenant ID - identifies the organization/tenant';
-- COMMENT ON COLUMN public.favorite.id2 IS 'User ID - identifies the user who favorited the item';
-- COMMENT ON COLUMN public.favorite.id3 IS 'Entity ID - primary entity identifier (e.g., meter_id)';
-- COMMENT ON COLUMN public.favorite.id4 IS 'Sub-entity ID - secondary entity identifier (e.g., meter_element_id, 0 if not applicable)';
