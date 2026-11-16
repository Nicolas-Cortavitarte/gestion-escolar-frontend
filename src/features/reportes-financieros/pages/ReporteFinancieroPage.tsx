import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { obtenerReporteFinanciero } from "../reportes-financieros.service";
import type { ReporteFinanciero } from "../reportes-financieros.types";
import { Boton } from "../../../shared/components/Boton";
import { CampoEntrada } from "../../../shared/components/CampoEntrada";
import { TarjetaResumen } from "../../../shared/components/TarjetaResumen";
import { ComparacionFinanciera } from "../../dashboard/components/ComparacionFinanciera";
import {
  moneda,
  rangoMesActual,
  mostrarFecha,
} from "../../../shared/utils/formato";
import { etiquetaMetodoPago } from "../../../shared/constants/pagos";
import "../../../styles/listados.css";
import "./ReporteFinancieroPage.css";

interface ReporteFinancieroPageProps {
  token: string;
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

      {cargando && (
        <div
          className="reporte-financiero__resumen"
          role="status"
          aria-label="Cargando reporte financiero"
        >
          <TarjetaResumen titulo="Total de ingresos" valor={null} />
          <TarjetaResumen titulo="Total de egresos" valor={null} />
          <TarjetaResumen titulo="Balance del periodo" valor={null} />
        </div>
      )}

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

          {reporte.resumenPorMetodoPago &&
            reporte.resumenPorMetodoPago.length > 0 && (
              <section
                className="reporte-financiero__tarjeta reporte-financiero__tarjeta--metodos"
                aria-labelledby="reporte-metodos-titulo"
              >
                <h2 id="reporte-metodos-titulo">
                  Cuadre por método de pago
                </h2>

                <div
                  className="tabla-listado"
                  role="region"
                  aria-label="Resumen por método de pago"
                  tabIndex={0}
                >
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">Método</th>
                        <th scope="col" className="reporte-financiero__monto">
                          Matrículas
                        </th>
                        <th scope="col" className="reporte-financiero__monto">
                          Pensiones
                        </th>
                        <th scope="col" className="reporte-financiero__monto">
                          Total ingresos
                        </th>
                        <th scope="col" className="reporte-financiero__monto">
                          Pagos a docentes
                        </th>
                        <th scope="col" className="reporte-financiero__monto">
                          Neto del canal
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {reporte.resumenPorMetodoPago.map((fila) => {
                        const neto =
                          fila.totalIngresos - fila.egresosPagosDocentes;
                        const sinMovimiento =
                          fila.totalIngresos === 0 &&
                          fila.egresosPagosDocentes === 0;
                        const claseNeto =
                          neto > 0
                            ? "reporte-financiero__neto--positivo"
                            : neto < 0
                              ? "reporte-financiero__neto--negativo"
                              : "reporte-financiero__neto--cero";

                        return (
                          <tr
                            key={fila.metodoPago}
                            className={
                              sinMovimiento
                                ? "reporte-financiero__fila--inactiva"
                                : undefined
                            }
                          >
                            <td data-label="Método">
                              <strong>
                                {etiquetaMetodoPago(fila.metodoPago)}
                              </strong>
                            </td>
                            <td
                              data-label="Matrículas"
                              className="reporte-financiero__monto"
                            >
                              {moneda.format(fila.ingresosMatriculas)}
                            </td>
                            <td
                              data-label="Pensiones"
                              className="reporte-financiero__monto"
                            >
                              {moneda.format(fila.ingresosPensiones)}
                            </td>
                            <td
                              data-label="Total ingresos"
                              className="reporte-financiero__monto"
                            >
                              <strong>
                                {moneda.format(fila.totalIngresos)}
                              </strong>
                            </td>
                            <td
                              data-label="Pagos a docentes"
                              className="reporte-financiero__monto"
                            >
                              {moneda.format(fila.egresosPagosDocentes)}
                            </td>
                            <td
                              data-label="Neto del canal"
                              className={`reporte-financiero__monto ${claseNeto}`}
                            >
                              {moneda.format(neto)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

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
