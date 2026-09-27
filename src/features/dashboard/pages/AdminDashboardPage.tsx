import { useEffect, useState } from "react";
import {
  obtenerCantidadEstudiantes,
  obtenerCantidadDocentes,
  obtenerResumenFinancieroMes,
} from "../dashboard.service";
import "./AdminDashboardPage.css";
import type { ResumenFinancieroMes } from "../dashboard.types";
import { ComparacionFinanciera } from "../components/ComparacionFinanciera";

interface AdminDashboardPageProps {
  token: string;
}

export function AdminDashboardPage({ token }: AdminDashboardPageProps) {
  const [cantidadEstudiantes, setCantidadEstudiantes] = useState<number | null>(
    null,
  );
  const [cantidadDocentes, setCantidadDocentes] = useState<number | null>(null);
  const [resumenFinanciero, setResumenFinanciero] =
    useState<ResumenFinancieroMes | null>(null);
  const [errorEstudiantes, setErrorEstudiantes] = useState("");
  const [errorDocentes, setErrorDocentes] = useState("");
  const [errorResumenFinanciero, setErrorResumenFinanciero] = useState("");

  useEffect(() => {
    let activo = true;

    obtenerCantidadEstudiantes(token)
      .then((cantidad) => {
        if (activo) setCantidadEstudiantes(cantidad);
      })
      .catch((fallo: unknown) => {
        if (activo) {
          setErrorEstudiantes(
            fallo instanceof Error
              ? fallo.message
              : "Ocurrió un error inesperado",
          );
        }
      });

    return () => {
      activo = false;
    };
  }, [token]);

  useEffect(() => {
    let activo = true;

    obtenerCantidadDocentes(token)
      .then((cantidad) => {
        if (activo) setCantidadDocentes(cantidad);
      })
      .catch((fallo: unknown) => {
        if (activo) {
          setErrorDocentes(
            fallo instanceof Error
              ? fallo.message
              : "Ocurrió un error inesperado",
          );
        }
      });

    return () => {
      activo = false;
    };
  }, [token]);

  useEffect(() => {
    let activo = true;

    obtenerResumenFinancieroMes(token)
      .then((resumenFinanciero) => {
        if (activo) setResumenFinanciero(resumenFinanciero);
      })
      .catch((fallo: unknown) => {
        if (activo) {
          setErrorResumenFinanciero(
            fallo instanceof Error
              ? fallo.message
              : "Ocurrió un error inesperado",
          );
        }
      });

    return () => {
      activo = false;
    };
  }, [token]);

  return (
    <section className="admin-dashboard">
      <h1>Inicio</h1>
      <p className="admin-dashboard__descripcion">
        Resumen de la gestión escolar.
      </p>

      <div className="admin-dashboard__cards">
        <article className="admin-dashboard__card">
          <h2>Estudiantes registrados</h2>
          {errorEstudiantes ? (
            <p role="alert">{errorEstudiantes}</p>
          ) : (
            <p className="admin-dashboard__valor">
              {cantidadEstudiantes === null
                ? "Cargando..."
                : cantidadEstudiantes}
            </p>
          )}
        </article>

        <article className="admin-dashboard__card">
          <h2>Docentes registrados</h2>
          {errorDocentes ? (
            <p role="alert">{errorDocentes}</p>
          ) : (
            <p className="admin-dashboard__valor">
              {cantidadDocentes === null ? "Cargando..." : cantidadDocentes}
            </p>
          )}
        </article>

        <article className="admin-dashboard__card">
          <h2>Ingresos del mes</h2>
          {errorResumenFinanciero ? (
            <p role="alert">{errorResumenFinanciero}</p>
          ) : (
            <p className="admin-dashboard__valor">
              {resumenFinanciero === null
                ? "Cargando..."
                : new Intl.NumberFormat("es-PE", {
                    style: "currency",
                    currency: "PEN",
                  }).format(resumenFinanciero.ingresos)}
            </p>
          )}
        </article>
      </div>

      {resumenFinanciero && (
        <ComparacionFinanciera resumen={resumenFinanciero} />
      )}
    </section>
  );
}
