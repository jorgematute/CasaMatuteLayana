-- M1: tablas del Gestor de Presupuesto del Hogar (Casa Matute)

CREATE TABLE IF NOT EXISTS miembros (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      VARCHAR(80)   NOT NULL,
  activo      BOOLEAN       NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT miembros_nombre_minimo CHECK (char_length(btrim(nombre)) >= 2)
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_miembros_nombre ON miembros (lower(btrim(nombre)));

CREATE TABLE IF NOT EXISTS categorias (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre          VARCHAR(80)   NOT NULL,
  limite_mensual  INTEGER,                              -- nulo: categoría sin límite
  activo          BOOLEAN       NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT categorias_nombre_minimo  CHECK (char_length(btrim(nombre)) >= 2),
  CONSTRAINT categorias_limite_valido  CHECK (limite_mensual IS NULL OR limite_mensual > 0)
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_categorias_nombre ON categorias (lower(btrim(nombre)));

CREATE TABLE IF NOT EXISTS pagos (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre        VARCHAR(120)  NOT NULL,
  monto         INTEGER       NOT NULL,
  fecha_limite  DATE          NOT NULL,
  recurrente    BOOLEAN       NOT NULL DEFAULT false,
  abonable      BOOLEAN       NOT NULL DEFAULT false,
  estado        VARCHAR(10)   NOT NULL DEFAULT 'pendiente',
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT pagos_nombre_minimo  CHECK (char_length(btrim(nombre)) >= 2),
  CONSTRAINT pagos_monto_positivo CHECK (monto > 0),                       -- RN-07
  CONSTRAINT pagos_estado_valido  CHECK (estado IN ('pendiente', 'pagado'))
);
CREATE INDEX IF NOT EXISTS idx_pagos_estado ON pagos (estado, fecha_limite);

CREATE TABLE IF NOT EXISTS movimientos (
  id                 BIGSERIAL     PRIMARY KEY,
  miembro_id         UUID          NOT NULL REFERENCES miembros(id) ON DELETE RESTRICT,   -- RN-05
  categoria_id       UUID          NOT NULL REFERENCES categorias(id) ON DELETE RESTRICT, -- RN-04
  tipo               VARCHAR(8)    NOT NULL,
  monto              INTEGER       NOT NULL,
  fecha              DATE          NOT NULL,
  es_hormiga         BOOLEAN       NOT NULL DEFAULT false,
  pago_pendiente_id  UUID          REFERENCES pagos(id) ON DELETE RESTRICT,               -- RN-20
  created_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT movimientos_tipo_valido      CHECK (tipo IN ('ingreso', 'gasto')),           -- RN-02
  CONSTRAINT movimientos_monto_positivo   CHECK (monto > 0),                              -- RN-01
  CONSTRAINT movimientos_hormiga_solo_gasto CHECK (es_hormiga = false OR tipo = 'gasto'), -- RN-03
  CONSTRAINT movimientos_pago_solo_gasto    CHECK (pago_pendiente_id IS NULL OR tipo = 'gasto')
);
CREATE INDEX IF NOT EXISTS idx_mov_fecha      ON movimientos (fecha);
CREATE INDEX IF NOT EXISTS idx_mov_miembro    ON movimientos (miembro_id, fecha);
CREATE INDEX IF NOT EXISTS idx_mov_categoria  ON movimientos (categoria_id, fecha);
CREATE INDEX IF NOT EXISTS idx_mov_pago       ON movimientos (pago_pendiente_id);
CREATE INDEX IF NOT EXISTS idx_mov_hormiga    ON movimientos (fecha) WHERE es_hormiga = true;

CREATE TABLE IF NOT EXISTS eventos_presupuesto (
  id           BIGSERIAL     PRIMARY KEY,
  tipo         VARCHAR(30)   NOT NULL,
  detalle      JSONB         NOT NULL DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION presupuesto_actualizar_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_miembros_updated_at ON miembros;
CREATE TRIGGER trg_miembros_updated_at BEFORE UPDATE ON miembros
  FOR EACH ROW EXECUTE FUNCTION presupuesto_actualizar_updated_at();
DROP TRIGGER IF EXISTS trg_categorias_updated_at ON categorias;
CREATE TRIGGER trg_categorias_updated_at BEFORE UPDATE ON categorias
  FOR EACH ROW EXECUTE FUNCTION presupuesto_actualizar_updated_at();
DROP TRIGGER IF EXISTS trg_pagos_updated_at ON pagos;
CREATE TRIGGER trg_pagos_updated_at BEFORE UPDATE ON pagos
  FOR EACH ROW EXECUTE FUNCTION presupuesto_actualizar_updated_at();
