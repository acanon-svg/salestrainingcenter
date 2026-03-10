
-- Add segment and category columns to courses table
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS segment text DEFAULT 'todos';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS category text DEFAULT NULL;

-- Add a comment for documentation
COMMENT ON COLUMN public.courses.segment IS 'Course segment: calle, mediano, grande, lider, todos';
COMMENT ON COLUMN public.courses.category IS 'Course category: tecnicas_venta, negociacion, producto, liderazgo, herramientas, otro';
