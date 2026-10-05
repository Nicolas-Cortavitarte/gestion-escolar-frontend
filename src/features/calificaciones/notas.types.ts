import type { NotaCualitativa } from "../boletas/boletas.types";

export type Bimestre = 1 | 2 | 3 | 4;

export interface NotaCompetencia {
  id: string;
  estudianteId: string;
  competenciaId: string;
  nombreCompetencia: string;
  bimestre: number;
  calificativo: NotaCualitativa;
}

export interface NotaCompetenciaRequest {
  competenciaId: string;
  bimestre: Bimestre;
  calificativo: NotaCualitativa;
}
