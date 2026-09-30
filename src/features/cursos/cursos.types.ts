export interface Curso {
  id: string;
  nombre: string;
  nivel: string;
  grado: string;
  anioLectivo: number;
  docenteId: string | null;
  nombresDocente: string | null;
}

export interface CursoRequest {
  nombre: string;
  nivel: string;
  grado: string;
  anioLectivo: number;
  docenteId: string | null;
}
