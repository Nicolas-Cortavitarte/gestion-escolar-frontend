import { useEffect, useState } from "react";
import { Link } from "react-router";
import { obtenerResumenDashboard } from "../dashboard.service";
import type {
  DashboardResumen,
  ResumenFinancieroMes,
} from "../dashboard.types";
import { ComparacionFinanciera } from "../components/ComparacionFinanciera";
import { TarjetaResumen } from "../../../shared/components/TarjetaResumen";
import { moneda } from "../../../shared/utils/formato";
import "./AdminDashboardPage.css";

interface AdminDashboardPageProps {
  token: string;
}

function mensajeError(fallo: unknown): string {
  return fallo instanceof Error
    ? fallo.message
    : "No se pudieron cargar los datos. Inténtalo nuevamente.";
}

export function AdminDashboardPage({ token }: AdminDashboardPageProps) {
  const [resumen, setResumen] = useState<DashboardResumen | null>(null);
  const [errorResumen, setErrorResumen] = useState("");
  const [intento, setIntento] = useState(0);
  const [fechaResumen, setFechaResumen] = useState(() => new Date());

  useEffect(() => {
    let activo = true;

    obtenerResumenDashboard(token)
      .then((datos) => {
        if (!activo) return;
        setResumen(datos);
        setErrorResumen("");
      })
      .catch((fallo: unknown) => {
        if (activo) setErrorResumen(mensajeError(fallo));
      });

    return () => {
      activo = false;
    };
  }, [token, intento]);

  const reintentarCarga = () => {
    setErrorResumen("");
    setResumen(null);
    setFechaResumen(new Date());
    setIntento((actual) => actual + 1);
  };

  const resumenFinanciero: ResumenFinancieroMes | null = resumen
    ? {
        ingresos: resumen.ingresosMes,
        egresos: resumen.egresosMes,
      }
    : null;

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
            valor={resumen?.estudiantesRegistrados ?? null}
            error={errorResumen}
            onReintentar={reintentarCarga}
          />

          <TarjetaResumen
            titulo="Docentes activos"
            valor={resumen?.docentesActivos ?? null}
            error={errorResumen}
            onReintentar={reintentarCarga}
          />
        </div>
      </section>

      <section
        className="admin-dashboard__seccion"
        aria-labelledby="dashboard-finanzas"
      >
        <h2 id="dashboard-finanzas">Resumen financiero del mes</h2>
        <p className="admin-dashboard__periodo">{mesResumen}</p>

        {errorResumen ? (
          <TarjetaResumen
            titulo="Información financiera"
            valor={null}
            error={errorResumen}
            onReintentar={reintentarCarga}
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

        {resumenFinanciero && !errorResumen && (
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
