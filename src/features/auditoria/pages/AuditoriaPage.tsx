import { useEffect, useState } from "react";
import { obtenerAuditoria } from "../auditoria.service";
import type { AuditoriaOperacion } from "../auditoria.types";
import { Boton } from "../../../shared/components/Boton";
import { BadgeEstado } from "../../../shared/components/BadgeEstado";
import { Paginacion } from "../../../shared/components/Paginacion";
import { TablaSkeleton } from "../../../shared/components/TablaSkeleton";
import "../../../styles/listados.css";
import "./AuditoriaPage.css";

interface AuditoriaPageProps {
  token: string;
}

const POR_PAGINA = 20;

const formatoFechaHora = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "short",
  timeStyle: "short",
});

const etiquetasAccion: Record<string, string> = {
  PAGO_PENSION: "Pago de pensión",
  AJUSTE_MORA: "Ajuste de mora",
  PAGO_MATRICULA: "Pago de matrícula",
  CAMBIO_ESTADO_MATRICULA: "Cambio de estado",
  ELIMINAR_MATRICULA: "Eliminación de matrícula",
  PAGO_DOCENTE: "Pago a docente",
};

export function AuditoriaPage({ token }: AuditoriaPageProps) {
  const [registros, setRegistros] = useState<AuditoriaOperacion[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let activo = true;

    obtenerAuditoria(token, pagina - 1, POR_PAGINA)
      .then((respuesta) => {
        if (!activo) return;
        setRegistros(respuesta.content);
        setTotal(respuesta.totalElements);
        setError("");
      })
      .catch((fallo: unknown) => {
        if (!activo) return;
        setError(
          fallo instanceof Error
            ? fallo.message
            : "No se pudo cargar la bitácora de auditoría.",
        );
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [token, pagina, intento]);

  return (
    <section className="auditoria">
      <header className="auditoria__encabezado">
        <h1>Auditoría de operaciones</h1>
        <p>
          Historial de cambios críticos realizados en pensiones, matrículas y
          pagos a docentes.
        </p>
      </header>

      {cargando && (
        <TablaSkeleton columnas={5} etiqueta="Cargando auditoría..." />
      )}

      {!cargando && error && (
        <div className="estado-listado">
          <p className="estado-listado__error" role="alert">
            {error}
          </p>
          <Boton
            onClick={() => {
              setError("");
              setCargando(true);
              setIntento((actual) => actual + 1);
            }}
          >
            Reintentar
          </Boton>
        </div>
      )}

      {!cargando && !error && registros.length === 0 && (
        <div className="estado-listado">
          <h2>Aún no hay operaciones registradas</h2>
          <p>
            Aquí aparecerán los pagos, ajustes de mora y cambios de estado
            realizados por los usuarios.
          </p>
        </div>
      )}

      {!cargando && !error && registros.length > 0 && (
        <>
          <div
            className="tabla-listado"
            role="region"
            aria-label="Bitácora de auditoría"
            tabIndex={0}
          >
            <table>
              <caption className="solo-lectores">
                Bitácora de operaciones críticas
              </caption>

              <thead>
                <tr>
                  <th scope="col">Fecha y hora</th>
                  <th scope="col">Usuario</th>
                  <th scope="col">Módulo</th>
                  <th scope="col">Acción</th>
                  <th scope="col">Detalle</th>
                </tr>
              </thead>

              <tbody>
                {registros.map((item) => (
                  <tr key={item.id}>
                    <td data-label="Fecha y hora">
                      {formatoFechaHora.format(new Date(item.creadoEn))}
                    </td>
                    <td data-label="Usuario">{item.usuarioEmail}</td>
                    <td data-label="Módulo">{item.entidad}</td>
                    <td data-label="Acción">
                      <BadgeEstado
                        variante={
                          item.accion === "ELIMINAR_MATRICULA"
                            ? "error"
                            : "pendiente"
                        }
                      >
                        {etiquetasAccion[item.accion] ?? item.accion}
                      </BadgeEstado>
                    </td>
                    <td data-label="Detalle">{item.detalle ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Paginacion
            pagina={pagina}
            total={total}
            porPagina={POR_PAGINA}
            onCambiar={(nuevaPagina) => {
              setCargando(true);
              setPagina(nuevaPagina);
            }}
          />
        </>
      )}
    </section>
  );
}
