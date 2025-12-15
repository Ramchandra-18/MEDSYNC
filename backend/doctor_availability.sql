CREATE TABLE doctor_availability (
    id SERIAL PRIMARY KEY,
    doctor_id UUID NOT NULL REFERENCES users(id),
    slot_datetime TIMESTAMPTZ NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (doctor_id, slot_datetime)
);
