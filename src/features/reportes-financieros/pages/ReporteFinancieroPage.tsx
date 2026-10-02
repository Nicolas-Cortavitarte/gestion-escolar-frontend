import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { obtenerReporteFinanciero } from "../reportes-financieros.service";
import type { ReporteFinanciero } from "../reportes-financieros.types";
import "./ReporteFinancieroPage.css";

interface ReporteFinancieroPageProps {
  token: string;
}

const moneda = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

function rangoMesActual() {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());

  const anio = partes.find((parte) => parte.type === "year")!.value;
  const mes = partes.find((parte) => parte.type === "month")!.value;
  const ultimoDia = new Date(Number(anio), Number(mes), 0).getDate();

  return {
    desde: `${anio}-${mes}-01`,
    hasta: `${anio}-${mes}-${String(ultimoDia).padStart(2, "0")}`,
  };
}

function mostrarFecha(fecha: string) {
  return fecha.split("-").reverse().join("/");
}

export function ReporteFinancieroPage({ token }: ReporteFinancieroPageProps) {
  const [rango, setRango] = useState(rangoMesActual);
  const [desde, setDesde] = useState(rango.desde);
  const [hasta, setHasta] = useState(rango.hasta);
  const [reporte, setReporte] = useState<ReporteFinanciero | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [errorFechas, setErrorFechas] = useState("");

  useEffect(() => {
    let activo = true;

    obtenerReporteFinanciero(token, rango.desde, rango.hasta)
      .then((datos) => {
        if (!activo) return;

        setReporte(datos);
        setError("");
      })
      .catch((fallo: unknown) => {
        if (!activo) return;

        setError(
          fallo instanceof Error
            ? fallo.message
            : "No se pudo cargar el reporte financiero.",
        );
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [token, rango]);

  function consultar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (!desde || !hasta || desde > hasta) {
      setErrorFechas("La fecha inicial debe ser anterior o igual a la final.");
      return;
    }

    setErrorFechas("");
    setError("");
    setReporte(null);
    setCargando(true);
    setRango({ desde, hasta });
  }

  return (
    <section className="reporte-financiero">
      <header className="reporte-financiero__encabezado">
        <h1>Reporte financiero</h1>
        <p>Consulta los ingresos, egresos y balance general del colegio.</p>
      </header>

      <form className="reporte-financiero__fechas" onSubmit={consultar}>
        <div className="reporte-financiero__campo">
          <label htmlFor="reporte-desde">Desde</label>
          <input
            id="reporte-desde"
            type="date"
            value={desde}
            onChange={(evento) => setDesde(evento.target.value)}
            required
          />
        </div>

        <div className="reporte-financiero__campo">
          <label htmlFor="reporte-hasta">Hasta</label>
          <input
            id="reporte-hasta"
            type="date"
            value={hasta}
            onChange={(evento) => setHasta(evento.target.value)}
            min={desde || undefined}
            required
          />
        </div>

        <button
          type="submit"
          className="reporte-financiero__boton"
          disabled={cargando}
        >
          {cargando ? "Consultando..." : "Consultar"}
        </button>
      </form>

      {errorFechas && <p role="alert">{errorFechas}</p>}
      {cargando && <p role="status">Cargando reporte financiero...</p>}
      {error && <p role="alert">{error}</p>}

      {!cargando && !error && reporte && (
        <>
          <p>
            Periodo consultado:{" "}
            <strong>
              {mostrarFecha(reporte.fechaInicio)} al{" "}
              {mostrarFecha(reporte.fechaFin)}
            </strong>
          </p>

          <div className="reporte-financiero__resumen">
            <div>
              <span>Total de ingresos</span>
              <strong>{moneda.format(reporte.totalIngresos)}</strong>
            </div>

            <div>
              <span>Total de egresos</span>
              <strong>{moneda.format(reporte.totalEgresos)}</strong>
            </div>

            <div>
              <span>Balance del periodo</span>
              <strong
                className={
                  reporte.balance < 0
                    ? "reporte-financiero__balance--negativo"
                    : "reporte-financiero__balance--positivo"
                }
              >
                {moneda.format(reporte.balance)}
              </strong>
            </div>
          </div>

          <div className="reporte-financiero__desglose">
            <section className="reporte-financiero__tarjeta">
              <h2>Ingresos</h2>
              <dl>
                <div>
                  <dt>Pensiones pagadas</dt>
                  <dd>{moneda.format(reporte.totalIngresosPensiones)}</dd>
                </div>
                <div>
                  <dt>Matrículas pagadas</dt>
                  <dd>{moneda.format(reporte.totalIngresosMatriculas)}</dd>
                </div>
                <div>
                  <dt>Movimientos adicionales</dt>
                  <dd>{moneda.format(reporte.totalIngresosMovimientos)}</dd>
                </div>
              </dl>
            </section>

            <section className="reporte-financiero__tarjeta">
              <h2>Egresos</h2>
              <dl>
                <div>
                  <dt>Pagos a docentes</dt>
                  <dd>{moneda.format(reporte.totalEgresosPagosDocentes)}</dd>
                </div>
                <div>
                  <dt>Movimientos adicionales</dt>
                  <dd>{moneda.format(reporte.totalEgresosMovimientos)}</dd>
                </div>
              </dl>
            </section>
          </div>

          <p>
            Los pagos se incluyen por su fecha de pago y los movimientos
            adicionales por su fecha registrada. El balance corresponde
            únicamente al periodo consultado.
          </p>
        </>
      )}
    </section>
  );
}
