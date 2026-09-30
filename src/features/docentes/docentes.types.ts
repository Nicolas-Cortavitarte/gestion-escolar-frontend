export interface Docente {
  id: string;
  usuarioId: string;
  dni: string;
  nombres: string;
  apellidos: string;
  sueldoMensual: number;
  activo: boolean;
}

export interface DocenteRequest {
  dni: string;
  nombres: string;
  apellidos: string;
  sueldoMensual: number;
  correo: string;
  contrasena: string;
}

export interface DocenteUpdate {
  nombres: string;
  apellidos: string;
  sueldoMensual: number;
}
