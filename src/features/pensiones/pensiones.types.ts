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
  estado: EstadoPension;
}
