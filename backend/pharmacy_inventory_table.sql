-- SQL DDL for pharmacy_inventory table in Supabase (PostgreSQL)
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS public.pharmacy_inventory (
    id BIGSERIAL PRIMARY KEY,
    medicine_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    expiry_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_pharmacy_inventory_medicine_name ON public.pharmacy_inventory (medicine_name);
CREATE INDEX IF NOT EXISTS idx_pharmacy_inventory_expiry_date ON public.pharmacy_inventory (expiry_date);
CREATE INDEX IF NOT EXISTS idx_pharmacy_inventory_quantity ON public.pharmacy_inventory (quantity);
CREATE INDEX IF NOT EXISTS idx_pharmacy_inventory_created_at ON public.pharmacy_inventory (created_at);

-- Add unique constraint for medicine name (prevents duplicate medicines)
-- If you want to allow multiple entries for same medicine with different expiry dates, comment out this line
CREATE UNIQUE INDEX IF NOT EXISTS idx_pharmacy_inventory_unique_medicine ON public.pharmacy_inventory (LOWER(medicine_name));

-- Add RLS (Row Level Security) if needed
ALTER TABLE public.pharmacy_inventory ENABLE ROW LEVEL SECURITY;

-- Optional: Add policy for authenticated users
-- CREATE POLICY "Allow authenticated users to manage inventory" ON public.pharmacy_inventory
--     FOR ALL USING (auth.role() = 'authenticated');

-- Add trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_pharmacy_inventory_updated_at ON public.pharmacy_inventory;
CREATE TRIGGER update_pharmacy_inventory_updated_at
    BEFORE UPDATE ON public.pharmacy_inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.pharmacy_inventory IS 'Stores pharmacy inventory with medicine names, quantities, and expiry dates';
COMMENT ON COLUMN public.pharmacy_inventory.medicine_name IS 'Name of the medicine (case-insensitive unique)';
COMMENT ON COLUMN public.pharmacy_inventory.quantity IS 'Current stock quantity (cannot be negative)';
COMMENT ON COLUMN public.pharmacy_inventory.expiry_date IS 'Expiry date of the medicine batch';

-- Sample data insertion (optional)
-- INSERT INTO public.pharmacy_inventory (medicine_name, quantity, expiry_date) VALUES
-- ('Paracetamol 500mg', 100, '2026-12-31'),
-- ('Amoxicillin 250mg', 50, '2026-06-30'),
-- ('Lisinopril 10mg', 75, '2027-03-15'),
-- ('Ibuprofen 400mg', 200, '2026-09-20');