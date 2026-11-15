import type { MetodoPago } from "../../shared/constants/pagos";

export type { MetodoPago };

export type EstadoPagoDocente = "PROGRAMADO" | "PAGADO" | "RETRASO";

export interface PagoDocente {
  id: string;
  docenteId: string;
  nombresDocente: string;
  mes: number;
  anio: number;
  monto: number;
  fechaProgramada: string;
  fechaPago: string | null;
  metodoPago?: MetodoPago | null;
  codigoOperacion?: string | null;
  estado: EstadoPagoDocente;
}
