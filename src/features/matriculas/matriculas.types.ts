import type { Estudiante } from "../estudiantes/estudiantes.types";

export interface ApoderadoNuevo {
  dni: string;
  nombre: string;
  apellidos: string;
  telefono?: string;
  email?: string;
  parentesco?: string;
}

interface DatosEstudiante {
  dni: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  direccion?: string;
}

export type EstudianteInscripcion = DatosEstudiante &
  (
    | { idApoderado: string; apoderadoNuevo?: never }
    | { idApoderado?: never; apoderadoNuevo: ApoderadoNuevo }
  );

export interface InscripcionRequest {
  estudiante: EstudianteInscripcion;
  anioLectivo: number;
  nivel: string;
  grado: string;
  montoMatricula: number;
  montoPensionMensual: number;
  fechaVencimiento: number;
}

export interface InscripcionResponse {
  estudiante: Estudiante;
  matricula: {
    estudianteId: string;
    anioLectivo: number;
    nivel: string;
    grado: string;
    montoMatricula: number;
    montoPensionMensual: number;
    fechaVencimiento: number;
    matriculaPagada: boolean;
  };
}

export interface ApoderadoExistente {
  id: string;
  dni: string;
  nombre: string;
  apellidos: string;
}

export interface CrearMatriculaRequest {
  estudianteId: string;
  anioLectivo: number;
  nivel: string;
  grado: string;
  montoMatricula: number;
  montoPensionMensual: number;
  fechaVencimiento: number;
}
