-- Tabla de visitas penitenciarias
CREATE TABLE IF NOT EXISTS visits (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_name  TEXT NOT NULL,
  inmate_name   TEXT NOT NULL,
  visit_date    DATE NOT NULL,
  visit_hour    TIME NOT NULL,
  status        TEXT NOT NULL DEFAULT 'PENDING', -- PENDING | APPROVED | REJECTED
  notes         TEXT,
  created_at    TIMESTAMP NOT NULL DEFAULT now()
);

-- Índices útiles
CREATE INDEX IF NOT EXISTS idx_visits_visit_date ON visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_visits_status ON visits(status);
