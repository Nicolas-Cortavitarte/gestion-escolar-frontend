import type {
  MovimientoFinanciero,
  ResumenFinancieroMes,
} from "./dashboard.types";

const API_URL = import.meta.env.VITE_API_URL;

export async function obtenerCantidadEstudiantes(
  token: string,
): Promise<number> {
  const respuesta = await fetch(`${API_URL}/api/v1/estudiantes`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (respuesta.status === 401) {
    throw new Error("Tu sesión ya no es válida. Inicia sesión nuevamente.");
  }

  if (!respuesta.ok) {
    throw new Error("No se pudo cargar la cantidad de estudiantes");
  }

  const estudiantes: unknown = await respuesta.json();

  if (!Array.isArray(estudiantes)) {
    throw new Error(
      "La respuesta de estudiantes no tiene el formato esperado.",
    );
  }

  return estudiantes.length;
}

export async function obtenerCantidadDocentes(token: string): Promise<number> {
  const respuesta = await fetch(`${API_URL}/api/v1/docentes`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (respuesta.status === 401) {
    throw new Error("Tu sesión ya no es válida. Inicia sesión nuevamente.");
  }

  if (!respuesta.ok) {
    throw new Error("No se pudo cargar la cantidad de docentes");
  }

  const docentes: unknown = await respuesta.json();

  if (!Array.isArray(docentes)) {
    throw new Error("La respuesta de docentes no tiene el formato esperado.");
  }

  return docentes.length;
}

export async function obtenerResumenFinancieroMes(
  token: string,
): Promise<ResumenFinancieroMes> {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const ultimoDia = new Date(anio, hoy.getMonth() + 1, 0).getDate();

  const desde = `${anio}-${mes}-01`;
  const hasta = `${anio}-${mes}-${String(ultimoDia).padStart(2, "0")}`;

  const parametros = new URLSearchParams({ desde, hasta });
  const respuesta = await fetch(
    `${API_URL}/api/v1/movimientos-financieros?${parametros}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!respuesta.ok) {
    throw new Error("No se pudieron cargar los ingresos del mes.");
  }

  const movimientos = (await respuesta.json()) as MovimientoFinanciero[];

  return movimientos.reduce<ResumenFinancieroMes>(
    (totales, movimiento) => {
      if (movimiento.tipo === "INGRESO") {
        totales.ingresos += movimiento.monto;
      } else if (movimiento.tipo === "EGRESO") {
        totales.egresos += movimiento.monto;
      }

      return totales;
    },
    { ingresos: 0, egresos: 0 },
  );
}
