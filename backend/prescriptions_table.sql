-- SQL DDL for prescriptions table in Supabase (PostgreSQL)
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS public.prescriptions (
    id BIGSERIAL PRIMARY KEY,
    patient_name VARCHAR(255) NOT NULL,
    patient_age INTEGER NOT NULL CHECK (patient_age > 0 AND patient_age <= 120),
    patient_phone VARCHAR(20) NOT NULL,
    patient_gender VARCHAR(10) NOT NULL CHECK (patient_gender IN ('Male', 'Female', 'Other')),
    patient_email VARCHAR(255) NOT NULL,
    disease TEXT NOT NULL,
    prescription_date DATE NOT NULL,
    prescription_time TIME NOT NULL,
    doctor_name VARCHAR(255) NOT NULL,
    doctor_code VARCHAR(10),
    doctor_department VARCHAR(255),
    medicines JSONB NOT NULL,  -- Array of medicine objects with medication, dosage, frequency
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_email ON public.prescriptions (patient_email);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor_code ON public.prescriptions (doctor_code);
CREATE INDEX IF NOT EXISTS idx_prescriptions_prescription_date ON public.prescriptions (prescription_date);
CREATE INDEX IF NOT EXISTS idx_prescriptions_created_at ON public.prescriptions (created_at);

-- Add RLS (Row Level Security) if needed
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

-- Optional: Add policy for authenticated users
-- CREATE POLICY "Allow authenticated users to manage prescriptions" ON public.prescriptions
--     FOR ALL USING (auth.role() = 'authenticated');

-- Add trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_prescriptions_updated_at ON public.prescriptions;
CREATE TRIGGER update_prescriptions_updated_at
    BEFORE UPDATE ON public.prescriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.prescriptions IS 'Stores prescription data issued by doctors to patients';
COMMENT ON COLUMN public.prescriptions.medicines IS 'JSON array of medicine objects with medication, dosage, and frequency fields';
COMMENT ON COLUMN public.prescriptions.doctor_code IS 'References user_code from users table for the prescribing doctor';
COMMENT ON COLUMN public.prescriptions.patient_email IS 'Used to link with appointment records and patient communication';