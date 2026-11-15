import type { MetodoPago } from "../../shared/constants/pagos";

export type { MetodoPago };

export type EstadoPension = "PENDIENTE" | "PAGADO" | "EN_MORA";

export interface Pension {
  id: string;
  matriculaId: string;
  mes: number;
  montoBase: number;
  moraAcumulada: number;
  montoTotal: number;
  fechaVencimiento: string;
  fechaPago: string | null;
  metodoPago?: MetodoPago | null;
  codigoOperacion?: string | null;
  estado: EstadoPension;
}
