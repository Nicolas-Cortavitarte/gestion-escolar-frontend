export type NotaCualitativa = "AD" | "A" | "B" | "C";

export type SituacionFinal = "APROBADO" | "RECUPERACION" | "DESAPROBADO";

export type NotasPorBimestre = Partial<Record<1 | 2 | 3 | 4, NotaCualitativa>>;

export interface CompetenciaBoleta {
  nombreCompetencia: string;
  notasPorBimestre: NotasPorBimestre;
  promedioFinal: NotaCualitativa | null;
}

export interface AreaBoleta {
  nombreArea: string;
  competencias: CompetenciaBoleta[];
  calificativoAreaPorBimestre: NotasPorBimestre;
  promedioFinalArea: NotaCualitativa | null;
}

export interface ConductaBimestre {
  bimestre: number;
  puntualidadRespeto: NotaCualitativa | null;
  actitudAula: NotaCualitativa | null;
  presentacionAseo: NotaCualitativa | null;
  inasistenciasJustificadas: number | null;
  inasistenciasInjustificadas: number | null;
  tardanzasJustificadas: number | null;
  tardanzasInjustificadas: number | null;
  apreciacionTutor: string | null;
  calificacionBimestre: NotaCualitativa | null;
}

export interface EvaluacionPadreBimestre {
  bimestre: number;
  enviaPuntualmenteHijo: NotaCualitativa | null;
  apoyaTareasCasa: NotaCualitativa | null;
  enviaHijoUniformado: NotaCualitativa | null;
  asisteReunionesColegio: NotaCualitativa | null;
  cumplePagosInstitucion: NotaCualitativa | null;
}

export interface ResumenFinal {
  id: string;
  estudianteId: string;
  nombreEstudiante: string;
  anioLectivo: number;
  situacionFinal: SituacionFinal;
  areaARecuperar: string | null;
  creadoEn: string;
}

export interface Boleta {
  estudianteId: string;
  nombreEstudiante: string;
  anioLectivo: number;
  areas: AreaBoleta[];
  conducta: ConductaBimestre[];
  evaluacionPadre: EvaluacionPadreBimestre[];
  resumenFinal: ResumenFinal | null;
}
