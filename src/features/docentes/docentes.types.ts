export interface Docente {
  id: string;
  usuarioId: string;
  dni: string;
  nombres: string;
  apellidos: string;
  sueldoMensual: number;
  activo: boolean;
  esTutor?: boolean;
  nivelTutor?: string | null;
  gradoTutor?: string | null;
}

export interface DocenteRequest {
  dni: string;
  nombres: string;
  apellidos: string;
  sueldoMensual: number;
  correo: string;
  contrasena: string;
  esTutor?: boolean;
  nivelTutor?: string | null;
  gradoTutor?: string | null;
}

export interface DocenteUpdate {
  nombres: string;
  apellidos: string;
  sueldoMensual: number;
  esTutor?: boolean;
  nivelTutor?: string | null;
  gradoTutor?: string | null;
}
