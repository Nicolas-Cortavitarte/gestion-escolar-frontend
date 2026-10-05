import type { NotaCualitativa } from "./boletas.types";

export type Bimestre = 1 | 2 | 3 | 4;

export interface ReporteConductaRequest {
  anioLectivo: number;
  bimestre: Bimestre;
  conductaPuntualidadRespeto: NotaCualitativa | null;
  conductaActitudAula: NotaCualitativa | null;
  conductaPresentacionAseo: NotaCualitativa | null;
  inasistenciasJustificadas: number;
  inasistenciasInjustificadas: number;
  tardanzasJustificadas: number;
  tardanzasInjustificadas: number;
  apreciacionTutor: string | null;
}

export interface ReporteConducta extends ReporteConductaRequest {
  id: string;
  estudianteId: string;
}

export interface EvaluacionPadreRequest {
  anioLectivo: number;
  bimestre: Bimestre;
  enviaPuntualmenteHijo: NotaCualitativa | null;
  apoyaTareasCasa: NotaCualitativa | null;
  enviaHijoUniformado: NotaCualitativa | null;
  asisteReunionesColegio: NotaCualitativa | null;
  cumplePagosInstitucion: NotaCualitativa | null;
}

export interface EvaluacionPadre extends EvaluacionPadreRequest {
  id: string;
  estudianteId: string;
}
