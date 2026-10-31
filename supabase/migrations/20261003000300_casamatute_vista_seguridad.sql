-- M2: vista de pagos con su abonado y cierre de acceso público

CREATE OR REPLACE VIEW v_pagos
WITH (security_invoker = true) AS
SELECT
  p.*,
  COALESCE(SUM(m.monto), 0)          AS abonado,
  p.monto - COALESCE(SUM(m.monto), 0) AS restante
FROM pagos p
LEFT JOIN movimientos m ON m.pago_pendiente_id = p.id
GROUP BY p.id;

ALTER TABLE miembros            ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias          ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos               ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos_presupuesto ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON miembros, categorias, pagos, movimientos, eventos_presupuesto FROM anon, authenticated;
REVOKE ALL ON v_pagos FROM anon, authenticated;
