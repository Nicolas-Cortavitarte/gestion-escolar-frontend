import type { ActualizarEstudianteRequest, Estudiante } from './estudiantes.types'

const API_URL = import.meta.env.VITE_API_URL

export async function obtenerEstudiantes(
  token: string
): Promise<Estudiante[]> {
  const respuesta = await fetch(`${API_URL}/api/v1/estudiantes`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (respuesta.status === 401) {
    throw new Error('Tu sesión ya no es válida. Inicia sesión nuevamente.')
  }

  if (respuesta.status === 403) {
    throw new Error('No tienes permiso para consultar estudiantes.')
  }

  if (!respuesta.ok) {
    throw new Error('No se pudo cargar la lista de estudiantes.')
  }

  return (await respuesta.json()) as Estudiante[]
}

export async function actualizarEstudiante(
  token: string,
  id: string,
  datos: ActualizarEstudianteRequest
): Promise<Estudiante> {
  const respuesta = await fetch(
    `${API_URL}/api/v1/estudiantes/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(datos),
    }
  )

  if (respuesta.status === 401) {
    throw new Error('Tu sesión ya no es válida. Inicia sesión nuevamente.')
  }

  if (respuesta.status === 403) {
    throw new Error('No tienes permiso para editar estudiantes.')
  }

  if (respuesta.status === 404) {
    throw new Error('El estudiante ya no existe.')
  }

  if (!respuesta.ok) {
    throw new Error('No se pudo actualizar el estudiante. Revisa los datos.')
  }

  return (await respuesta.json()) as Estudiante
}