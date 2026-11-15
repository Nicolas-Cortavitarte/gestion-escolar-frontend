export interface AuditoriaOperacion {
  id: string;
  entidad: string;
  entidadId: string;
  accion: string;
  usuarioEmail: string;
  detalle: string | null;
  creadoEn: string;
}

export interface PaginaAuditoria {
  content: AuditoriaOperacion[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
