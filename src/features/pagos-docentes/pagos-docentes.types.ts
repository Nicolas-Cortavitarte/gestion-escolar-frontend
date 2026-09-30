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
  estado: EstadoPagoDocente;
}
