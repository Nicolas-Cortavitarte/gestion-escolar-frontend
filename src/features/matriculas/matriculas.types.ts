import type { Estudiante } from "../estudiantes/estudiantes.types";
import type { MetodoPago } from "../../shared/constants/pagos";

export type { MetodoPago };

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
  metodoPago?: MetodoPago;
  codigoOperacion?: string;
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
    metodoPago?: MetodoPago;
    codigoOperacion?: string | null;
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
  mesInicioPension?: number;
  metodoPago?: MetodoPago;
  codigoOperacion?: string;
}

export type EstadoMatricula = "ACTIVA" | "RETIRADA" | "TRASLADADA";

export interface Matricula {
  id: string;
  estudianteId: string;
  anioLectivo: number;
  nombreEstudiante: string;
  dniEstudiante?: string;
  nivel: string;
  grado: string;
  montoMatricula: number;
  montoPensionMensual: number;
  fechaVencimiento: number;
  fechaRegistro: string;
  matriculaPagada: boolean;
  fechaPagoMatricula: string | null;
  metodoPago?: MetodoPago | null;
  codigoOperacion?: string | null;
  estado?: EstadoMatricula;
}
