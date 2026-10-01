export type TipoMovimiento = "INGRESO" | "EGRESO";

export type CategoriaMovimiento =
  | "MATERIALES"
  | "SERVICIOS"
  | "ACTIVIDADES"
  | "MANTENIMIENTO"
  | "DONACION"
  | "OTRO";

export interface MovimientoFinanciero {
  id: string;
  tipo: TipoMovimiento;
  categoria: CategoriaMovimiento;
  concepto: string;
  monto: number;
  fecha: string;
  descripcion: string | null;
  registradoPorId: string;
  registradoPorEmail: string;
  creadoEn: string;
}

export interface MovimientoFinancieroRequest {
  tipo: TipoMovimiento;
  categoria: CategoriaMovimiento;
  concepto: string;
  monto: number;
  fecha: string;
  descripcion: string | null;
}
