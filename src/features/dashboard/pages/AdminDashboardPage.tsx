import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  obtenerCantidadEstudiantes,
  obtenerCantidadDocentes,
  obtenerResumenFinancieroMes,
} from "../dashboard.service";
import type { ResumenFinancieroMes } from "../dashboard.types";
import { ComparacionFinanciera } from "../components/ComparacionFinanciera";
import { TarjetaResumen } from "../../../shared/components/TarjetaResumen";
import "./AdminDashboardPage.css";

interface AdminDashboardPageProps {
  token: string;
}

const moneda = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

function mensajeError(fallo: unknown): string {
  return fallo instanceof Error
    ? fallo.message
    : "No se pudieron cargar los datos. Inténtalo nuevamente.";
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
  const [errorFinanzas, setErrorFinanzas] = useState("");

  const [intentoEstudiantes, setIntentoEstudiantes] = useState(0);
  const [intentoDocentes, setIntentoDocentes] = useState(0);
  const [intentoFinanzas, setIntentoFinanzas] = useState(0);

  const [fechaResumen, setFechaResumen] = useState(() => new Date());

  useEffect(() => {
    let activo = true;

    obtenerCantidadEstudiantes(token)
      .then((cantidad) => {
        if (activo) setCantidadEstudiantes(cantidad);
      })
      .catch((fallo: unknown) => {
        if (activo) setErrorEstudiantes(mensajeError(fallo));
      });

    return () => {
      activo = false;
    };
  }, [token, intentoEstudiantes]);

  useEffect(() => {
    let activo = true;

    obtenerCantidadDocentes(token)
      .then((cantidad) => {
        if (activo) setCantidadDocentes(cantidad);
      })
      .catch((fallo: unknown) => {
        if (activo) setErrorDocentes(mensajeError(fallo));
      });

    return () => {
      activo = false;
    };
  }, [token, intentoDocentes]);

  useEffect(() => {
    let activo = true;

    obtenerResumenFinancieroMes(token)
      .then((resumen) => {
        if (activo) setResumenFinanciero(resumen);
      })
      .catch((fallo: unknown) => {
        if (activo) setErrorFinanzas(mensajeError(fallo));
      });

    return () => {
      activo = false;
    };
  }, [token, intentoFinanzas]);

  const mesResumen = new Intl.DateTimeFormat("es-PE", {
    month: "long",
    year: "numeric",
  }).format(fechaResumen);

  return (
    <section className="admin-dashboard">
      <header className="admin-dashboard__encabezado">
        <div>
          <h1>Inicio</h1>
          <p>
            Consulta el resumen del colegio y accede a las tareas frecuentes.
          </p>
        </div>

        <Link className="boton boton--principal" to="/admin/matriculas/nueva">
          Nueva matrícula
        </Link>
      </header>

      <section
        className="admin-dashboard__seccion"
        aria-labelledby="dashboard-gestion"
      >
        <h2 id="dashboard-gestion">Gestión escolar</h2>

        <div className="admin-dashboard__cards admin-dashboard__cards--gestion">
          <TarjetaResumen
            titulo="Estudiantes registrados"
            valor={cantidadEstudiantes}
            error={errorEstudiantes}
            onReintentar={() => {
              setErrorEstudiantes("");
              setCantidadEstudiantes(null);
              setIntentoEstudiantes((actual) => actual + 1);
            }}
          />

          <TarjetaResumen
            titulo="Docentes registrados"
            valor={cantidadDocentes}
            error={errorDocentes}
            onReintentar={() => {
              setErrorDocentes("");
              setCantidadDocentes(null);
              setIntentoDocentes((actual) => actual + 1);
            }}
          />
        </div>
      </section>

      <section
        className="admin-dashboard__seccion"
        aria-labelledby="dashboard-finanzas"
      >
        <h2 id="dashboard-finanzas">Resumen financiero del mes</h2>
        <p className="admin-dashboard__periodo">{mesResumen}</p>

        {errorFinanzas ? (
          <TarjetaResumen
            titulo="Información financiera"
            valor={null}
            error={errorFinanzas}
            onReintentar={() => {
              setErrorFinanzas("");
              setResumenFinanciero(null);
              setFechaResumen(new Date());
              setIntentoFinanzas((actual) => actual + 1);
            }}
          />
        ) : (
          <div className="admin-dashboard__cards admin-dashboard__cards--finanzas">
            <TarjetaResumen
              titulo="Ingresos"
              valor={
                resumenFinanciero
                  ? moneda.format(resumenFinanciero.ingresos)
                  : null
              }
            />

            <TarjetaResumen
              titulo="Egresos"
              valor={
                resumenFinanciero
                  ? moneda.format(resumenFinanciero.egresos)
                  : null
              }
            />

            <TarjetaResumen
              titulo="Balance"
              valor={
                resumenFinanciero
                  ? moneda.format(
                      resumenFinanciero.ingresos - resumenFinanciero.egresos,
                    )
                  : null
              }
            />
          </div>
        )}

        {resumenFinanciero && !errorFinanzas && (
          <ComparacionFinanciera resumen={resumenFinanciero} />
        )}

        <Link
          className="admin-dashboard__enlace"
          to="/admin/reportes-financieros"
        >
          Consultar el reporte financiero completo
        </Link>
      </section>

      <nav className="admin-dashboard__accesos" aria-label="Tareas frecuentes">
        <Link to="/admin/estudiantes">
          <strong>Consultar estudiantes</strong>
          <span>Busca estudiantes y revisa sus datos.</span>
        </Link>

        <Link to="/admin/pensiones">
          <strong>Gestionar pensiones</strong>
          <span>Consulta los pagos y registra los pendientes.</span>
        </Link>

        <Link to="/admin/boletas">
          <strong>Consultar boletas</strong>
          <span>Revisa evaluaciones e imprime la boleta de notas.</span>
        </Link>
      </nav>
    </section>
  );
}
