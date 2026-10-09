import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { obtenerReporteFinanciero } from "../reportes-financieros.service";
import type { ReporteFinanciero } from "../reportes-financieros.types";
import { Boton } from "../../../shared/components/Boton";
import { CampoEntrada } from "../../../shared/components/CampoEntrada";
import { TarjetaResumen } from "../../../shared/components/TarjetaResumen";
import { ComparacionFinanciera } from "../../dashboard/components/ComparacionFinanciera";
import "../../../styles/listados.css";
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
  const [intentoCarga, setIntentoCarga] = useState(0);
  const [error, setError] = useState("");
  const [errorFechas, setErrorFechas] = useState("");
  const [seleccion, setSeleccion] = useState<"ingresos" | "egresos">(
    "ingresos",
  );

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
  }, [token, rango, intentoCarga]);

  function consultar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (cargando) return;

    if (!desde || !hasta || desde > hasta) {
      setErrorFechas(
        "Selecciona ambas fechas. Desde debe ser anterior o igual a Hasta.",
      );
      return;
    }

    if (!evento.currentTarget.reportValidity()) return;

    setErrorFechas("");
    setError("");
    setReporte(null);
    setCargando(true);
    setSeleccion("ingresos");
    setRango({ desde, hasta });
  }

  function reintentar() {
    setError("");
    setReporte(null);
    setCargando(true);
    setIntentoCarga((actual) => actual + 1);
  }

  const desglose = reporte
    ? seleccion === "ingresos"
      ? [
          {
            etiqueta: "Pensiones pagadas",
            monto: reporte.totalIngresosPensiones,
          },
          {
            etiqueta: "Matrículas pagadas",
            monto: reporte.totalIngresosMatriculas,
          },
          {
            etiqueta: "Otros ingresos",
            monto: reporte.totalIngresosMovimientos,
          },
        ]
      : [
          {
            etiqueta: "Pagos a docentes",
            monto: reporte.totalEgresosPagosDocentes,
          },
          {
            etiqueta: "Otros egresos",
            monto: reporte.totalEgresosMovimientos,
          },
        ]
    : [];

  return (
    <section className="reporte-financiero">
      <header className="reporte-financiero__encabezado">
        <h1>Reporte financiero</h1>
        <p>
          Consulta los ingresos, egresos y balance del periodo seleccionado.
        </p>
      </header>

      <form
        className="reporte-financiero__fechas"
        onSubmit={consultar}
        noValidate
      >
        <CampoEntrada
          id="reporte-desde"
          etiqueta="Desde"
          type="date"
          value={desde}
          onChange={(evento) => {
            setDesde(evento.target.value);
            setErrorFechas("");
          }}
          disabled={cargando}
          required
        />

        <CampoEntrada
          id="reporte-hasta"
          etiqueta="Hasta"
          type="date"
          value={hasta}
          onChange={(evento) => {
            setHasta(evento.target.value);
            setErrorFechas("");
          }}
          min={desde || undefined}
          error={errorFechas}
          disabled={cargando}
          required
        />

        <Boton type="submit" variante="principal" disabled={cargando}>
          {cargando ? "Consultando..." : "Consultar reporte"}
        </Boton>
      </form>

      {cargando && <p role="status">Cargando reporte financiero...</p>}

      {!cargando && error && (
        <div className="estado-listado">
          <p role="alert">{error}</p>
          <Boton onClick={reintentar}>Reintentar</Boton>
        </div>
      )}

      {!cargando && !error && reporte && (
        <>
          <p className="reporte-financiero__periodo">
            Periodo consultado:{" "}
            <strong>
              {mostrarFecha(reporte.fechaInicio)} al{" "}
              {mostrarFecha(reporte.fechaFin)}
            </strong>
          </p>

          <div className="reporte-financiero__resumen">
            <TarjetaResumen
              titulo="Total de ingresos"
              valor={moneda.format(reporte.totalIngresos)}
            />

            <TarjetaResumen
              titulo="Total de egresos"
              valor={moneda.format(reporte.totalEgresos)}
            />

            <TarjetaResumen
              titulo="Balance del periodo"
              valor={moneda.format(reporte.balance)}
            />
          </div>

          <p className="reporte-financiero__explicacion">
            {reporte.balance > 0
              ? "Los ingresos superaron a los egresos en este periodo."
              : reporte.balance < 0
                ? "Los egresos superaron a los ingresos en este periodo."
                : "Los ingresos y los egresos son iguales en este periodo."}
          </p>

          <ComparacionFinanciera
            resumen={{
              ingresos: reporte.totalIngresos,
              egresos: reporte.totalEgresos,
            }}
            descripcion="Comparación del periodo consultado"
            seleccion={seleccion}
            onSeleccionar={setSeleccion}
          />

          <section
            className="reporte-financiero__tarjeta"
            aria-labelledby="reporte-desglose-titulo"
          >
            <h2 id="reporte-desglose-titulo">Desglose de {seleccion}</h2>

            <dl>
              {desglose.map((fila) => (
                <div key={fila.etiqueta}>
                  <dt>{fila.etiqueta}</dt>
                  <dd>{moneda.format(fila.monto)}</dd>
                </div>
              ))}

              <div className="reporte-financiero__total">
                <dt>Total de {seleccion}</dt>
                <dd>
                  {moneda.format(
                    seleccion === "ingresos"
                      ? reporte.totalIngresos
                      : reporte.totalEgresos,
                  )}
                </dd>
              </div>
            </dl>
          </section>

          <p className="reporte-financiero__nota">
            Los pagos se incluyen por su fecha de pago y los movimientos
            adicionales por su fecha del movimiento. El balance corresponde
            únicamente al periodo consultado.
          </p>
        </>
      )}
    </section>
  );
}
