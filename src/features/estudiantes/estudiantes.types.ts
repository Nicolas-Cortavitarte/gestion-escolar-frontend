export interface Estudiante {
  id: string
  dni: string
  nombres: string
  apellidos: string
  fechaNacimiento: string
  direccion: string | null
  apoderadoId: string | null
  nombreApoderado: string | null
  creadoEn: string
}

export interface ActualizarEstudianteRequest {
  dni: string
  nombres: string
  apellidos: string
  fechaNacimiento: string
  direccion?: string
  idApoderado: string
}