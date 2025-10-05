CREATE TABLE form_data (
    user_id TEXT PRIMARY KEY,
    form_step INTEGER NOT NULL,
    email TEXT,
    therapy_for_whom TEXT,
    therapist_gender TEXT,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);