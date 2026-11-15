import type { MovimientoFinanciero } from "../movimientos-financieros/movimientos-financieros.types";
import type { MetodoPago } from "../../shared/constants/pagos";

export interface MetodoPagoResumen {
  metodoPago: MetodoPago;
  ingresosMatriculas: number;
  ingresosPensiones: number;
  totalIngresos: number;
  egresosPagosDocentes: number;
}

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
  resumenPorMetodoPago?: MetodoPagoResumen[];
  detalleMovimientos: MovimientoFinanciero[];
}
