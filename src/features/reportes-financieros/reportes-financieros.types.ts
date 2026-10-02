import type { MovimientoFinanciero } from "../movimientos-financieros/movimientos-financieros.types";

export interface ReporteFinanciero {
  fechaInicio: string;
  fechaFin: string;
  totalIngresosPensiones: number;
  totalIngresosMatriculas: number;
  totalIngresosMovimientos: number;
  totalIngresos: number;
  totalEgresosPagosDocentes: number;
  totalEgresosMovimientos: number;
  totalEgresos: number;
  balance: number;
  detalleMovimientos: MovimientoFinanciero[];
}
