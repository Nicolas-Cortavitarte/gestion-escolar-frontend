export interface Competencia {
  id: string;
  cursoId: string;
  nombreCompetencia: string;
}

export interface CompetenciaRequest {
  cursoId: string;
  nombreCompetencia: string;
}
