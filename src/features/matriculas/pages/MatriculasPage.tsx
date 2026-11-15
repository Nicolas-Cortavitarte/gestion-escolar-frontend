import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import {
  obtenerMatriculas,
  cambiarEstadoMatricula,
} from "../matriculas.service";
import type { EstadoMatricula, Matricula } from "../matriculas.types";
import { Boton } from "../../../shared/components/Boton";
import { CampoEntrada } from "../../../shared/components/CampoEntrada";
import { Paginacion } from "../../../shared/components/Paginacion";
import { BadgeEstado } from "../../../shared/components/BadgeEstado";
import { TablaSkeleton } from "../../../shared/components/TablaSkeleton";
import { moneda, normalizar } from "../../../shared/utils/formato";
import {
  METODOS_PAGO,
  etiquetaMetodoPago,
} from "../../../shared/constants/pagos";
import { imprimirRecibo } from "../../../shared/utils/recibo";
import "../../../styles/listados.css";
import "./MatriculasPage.css";

interface MatriculasPageProps {
  token: string;
}

const POR_PAGINA = 10;

const etiquetasEstadoMatricula: Record<EstadoMatricula, string> = {
  ACTIVA: "Activa",
  RETIRADA: "Retirada",
  TRASLADADA: "Trasladada",
};

export function MatriculasPage({ token }: MatriculasPageProps) {
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [intento, setIntento] = useState(0);
  const [busqueda, setBusqueda] = useState("");
  const [anio, setAnio] = useState(String(new Date().getFullYear()));
  const [estado, setEstado] = useState("");
  const [metodoFiltro, setMetodoFiltro] = useState("");
  const [pagina, setPagina] = useState(1);

  const [mensajePago, setMensajePago] = useState("");
  const [matriculaEstado, setMatriculaEstado] = useState<Matricula | null>(
    null,
  );
  const [guardandoEstado, setGuardandoEstado] = useState(false);
  const [errorEstado, setErrorEstado] = useState("");

  const guardandoEstadoRef = useRef(false);

  useEffect(() => {
    let activo = true;

    obtenerMatriculas(token)
      .then((datos) => {
        if (activo) {
          setMatriculas(datos);
          setError("");
        }
      })
      .catch((fallo: unknown) => {
        if (activo) {
          setError(
            fallo instanceof Error
              ? fallo.message
              : "No se pudieron cargar las matrículas.",
          );
        }
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [token, intento]);

  const anios = Array.from(
    new Set([
      new Date().getFullYear(),
      ...matriculas.map((matricula) => matricula.anioLectivo),
    ]),
  ).sort((a, b) => b - a);

  const termino = normalizar(busqueda);

  const filtradas = matriculas
    .filter(
      (matricula) =>
        matricula.anioLectivo === Number(anio) &&
        normalizar(matricula.nombreEstudiante).includes(termino) &&
        (estado === "" || (matricula.estado ?? "ACTIVA") === estado) &&
        (metodoFiltro === "" || (matricula.metodoPago ?? "EFECTIVO") === metodoFiltro),
    )
    .sort(
      (a, b) =>
        a.nombreEstudiante.localeCompare(b.nombreEstudiante, "es") ||
        a.id.localeCompare(b.id),
    );

  const paginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, paginas);
  const visibles = filtradas.slice(
    (paginaActual - 1) * POR_PAGINA,
    paginaActual * POR_PAGINA,
  );

  function abrirEstado(matricula: Matricula) {
    setMensajePago("");
    setErrorEstado("");
    setMatriculaEstado(matricula);
  }

  function cerrarEstado() {
    if (guardandoEstadoRef.current) return;
    setMatriculaEstado(null);
    setErrorEstado("");
  }

  async function guardarEstado(nuevoEstado: EstadoMatricula) {
    const seleccionada = matriculaEstado;

    if (!seleccionada || guardandoEstadoRef.current) return;

    guardandoEstadoRef.current = true;
    setGuardandoEstado(true);
    setErrorEstado("");

    try {
      const actualizada = await cambiarEstadoMatricula(
        token,
        seleccionada.id,
        nuevoEstado,
      );

      setMatriculas((actuales) =>
        actuales.map((item) =>
          item.id === actualizada.id ? actualizada : item,
        ),
      );

      setMatriculaEstado(null);
      const mensajeExito = `Estado de matrícula actualizado a ${etiquetasEstadoMatricula[nuevoEstado]} para ${seleccionada.nombreEstudiante}.`;
      setMensajePago(mensajeExito);
      toast.success(mensajeExito);
    } catch (fallo: unknown) {
      setErrorEstado(
        fallo instanceof Error
          ? fallo.message
          : "No se pudo actualizar el estado de la matrícula.",
      );
    } finally {
      guardandoEstadoRef.current = false;
      setGuardandoEstado(false);
    }
  }

  return (
    <section className="matriculas">
      <header className="matriculas__encabezado">
        <h1>Matrículas registradas</h1>
        <p>Consulta las matrículas y registra los pagos recibidos.</p>
      </header>

      <div className="matriculas__filtros">
        <div className="campo">
          <label className="campo__etiqueta" htmlFor="matriculas-anio">
            Año lectivo
          </label>

          <select
            id="matriculas-anio"
            className="campo__entrada"
            value={anio}
            onChange={(evento) => {
              setAnio(evento.target.value);
              setPagina(1);
            }}
            disabled={cargando}
          >
            {anios.map((valor) => (
              <option key={valor} value={valor}>
                {valor}
              </option>
            ))}
          </select>
        </div>

        <CampoEntrada
          id="matriculas-busqueda"
          etiqueta="Buscar estudiante"
          type="search"
          value={busqueda}
          onChange={(evento) => {
            setBusqueda(evento.target.value);
            setPagina(1);
          }}
          placeholder="Nombres o apellidos"
          disabled={cargando}
        />

        <div className="campo">
          <label className="campo__etiqueta" htmlFor="matriculas-estado">
            Estado de matrícula
          </label>

          <select
            id="matriculas-estado"
            className="campo__entrada"
            value={estado}
            onChange={(evento) => {
              setEstado(evento.target.value);
              setPagina(1);
            }}
            disabled={cargando}
          >
            <option value="">Todos</option>
            <option value="ACTIVA">Activa</option>
            <option value="RETIRADA">Retirada</option>
            <option value="TRASLADADA">Trasladada</option>
          </select>
        </div>

        <div className="campo">
          <label className="campo__etiqueta" htmlFor="matriculas-metodo">
            Método de pago
          </label>
          <select
            id="matriculas-metodo"
            className="campo__entrada"
            value={metodoFiltro}
            onChange={(evento) => {
              setMetodoFiltro(evento.target.value);
              setPagina(1);
            }}
            disabled={cargando}
          >
            <option value="">Todos</option>
            {METODOS_PAGO.map((opcion) => (
              <option key={opcion.valor} value={opcion.valor}>
                {opcion.etiqueta}
              </option>
            ))}
          </select>
        </div>
      </div>

      {mensajePago && (
        <p className="matriculas__exito" role="status">
          {mensajePago}
        </p>
      )}

      {cargando && (
        <TablaSkeleton columnas={6} etiqueta="Cargando matrículas..." />
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

      {!cargando && !error && matriculas.length === 0 && (
        <div className="estado-listado">
          <h2>Todavía no hay matrículas registradas</h2>
          <p>Inicia el proceso desde Nueva matrícula.</p>

          <Link to="/admin/matriculas/nueva" className="boton boton--principal">
            Nueva matrícula
          </Link>
        </div>
      )}

      {!cargando &&
        !error &&
        matriculas.length > 0 &&
        filtradas.length === 0 && (
          <div className="estado-listado">
            <h2>No hay resultados para estos filtros</h2>
            <p>Prueba otro año, nombre o estado de pago.</p>

            <Boton
              onClick={() => {
                setBusqueda("");
                setEstado("");
                setMetodoFiltro("");
                setPagina(1);
              }}
            >
              Limpiar búsqueda y estado
            </Boton>
          </div>
        )}

      {!cargando && !error && filtradas.length > 0 && (
        <>
          <div
            className="tabla-listado"
            role="region"
            aria-label="Listado de matrículas"
            tabIndex={0}
          >
            <table>
              <caption className="solo-lectores">
                Matrículas del año {anio}
              </caption>

              <thead>
                <tr>
                  <th scope="col">Estudiante</th>
                  <th scope="col">Nivel</th>
                  <th scope="col">Grado</th>
                  <th scope="col">Matrícula</th>
                  <th scope="col">Pensión mensual</th>
                  <th scope="col">Método de pago</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {visibles.map((matricula) => {
                  const estadoActual = matricula.estado ?? "ACTIVA";

                  return (
                    <tr key={matricula.id}>
                      <td data-label="Estudiante">
                        {matricula.nombreEstudiante}
                      </td>
                      <td data-label="Nivel">
                        {matricula.nivel === "INICIAL"
                          ? "Inicial"
                          : matricula.nivel === "PRIMARIA"
                            ? "Primaria"
                            : matricula.nivel}
                      </td>
                      <td data-label="Grado">{matricula.grado}</td>
                      <td data-label="Matrícula">
                        {moneda.format(matricula.montoMatricula)}
                      </td>
                      <td data-label="Pensión mensual">
                        {moneda.format(matricula.montoPensionMensual)}
                      </td>
                      <td data-label="Método de pago">
                        {etiquetaMetodoPago(matricula.metodoPago)}
                        {matricula.codigoOperacion
                          ? ` (${matricula.codigoOperacion})`
                          : ""}
                      </td>
                      <td data-label="Estado" className="matriculas__celda-estado">
                        <BadgeEstado
                          variante={
                            estadoActual === "ACTIVA"
                              ? "exito"
                              : estadoActual === "RETIRADA"
                                ? "error"
                                : "pendiente"
                          }
                        >
                          {etiquetasEstadoMatricula[estadoActual]}
                        </BadgeEstado>
                      </td>
                      <td data-label="Acciones" className="matriculas__celda-acciones">
                        <div className="matriculas__acciones-fila">
                          <Boton
                            onClick={() => abrirEstado(matricula)}
                            aria-label={`Cambiar estado de matrícula de ${matricula.nombreEstudiante}`}
                          >
                            Cambiar estado
                          </Boton>
                          <Boton
                            onClick={() => {
                              const ok = imprimirRecibo({
                                titulo: "Recibo de Matrícula",
                                referencia: matricula.id,
                                fechaPago:
                                  matricula.fechaPagoMatricula ??
                                  matricula.fechaRegistro,
                                titular: matricula.nombreEstudiante,
                                documento: matricula.dniEstudiante,
                                concepto: `Matrícula ${matricula.anioLectivo} — ${matricula.nivel === "INICIAL" ? "Inicial" : "Primaria"} ${matricula.grado}`,
                                detalle: [
                                  {
                                    etiqueta: "Derecho de matrícula",
                                    monto: matricula.montoMatricula,
                                  },
                                ],
                                total: matricula.montoMatricula,
                                metodoPago: matricula.metodoPago,
                                codigoOperacion: matricula.codigoOperacion,
                              });
                              if (!ok) {
                                toast.error(
                                  "Permite las ventanas emergentes para imprimir el recibo.",
                                );
                              }
                            }}
                            aria-label={`Imprimir recibo de matrícula de ${matricula.nombreEstudiante}`}
                          >
                            Recibo
                          </Boton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Paginacion
            pagina={paginaActual}
            total={filtradas.length}
            porPagina={POR_PAGINA}
            onCambiar={setPagina}
          />
        </>
      )}

      {matriculaEstado && (
        <CambiarEstadoMatriculaModal
          matricula={matriculaEstado}
          guardando={guardandoEstado}
          error={errorEstado}
          onCancelar={cerrarEstado}
          onGuardar={(nuevoEstado) => void guardarEstado(nuevoEstado)}
        />
      )}
    </section>
  );
}

interface CambiarEstadoMatriculaModalProps {
  matricula: Matricula;
  guardando: boolean;
  error: string;
  onCancelar: () => void;
  onGuardar: (estado: EstadoMatricula) => void;
}

function CambiarEstadoMatriculaModal({
  matricula,
  guardando,
  error,
  onCancelar,
  onGuardar,
}: CambiarEstadoMatriculaModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const tituloId = useId();
  const descripcionId = useId();
  const [estadoSeleccionado, setEstadoSeleccionado] = useState<EstadoMatricula>(
    matricula.estado ?? "ACTIVA",
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    const elementoAnterior = document.activeElement;

    if (dialog && !dialog.open) dialog.showModal();

    return () => {
      dialog?.close();

      if (
        elementoAnterior instanceof HTMLElement &&
        elementoAnterior.isConnected
      ) {
        elementoAnterior.focus();
      } else {
        document.getElementById("matriculas-busqueda")?.focus();
      }
    };
  }, []);

  function manejarEnvio(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    onGuardar(estadoSeleccionado);
  }

  return (
    <dialog
      ref={dialogRef}
      className="matriculas__modal"
      aria-labelledby={tituloId}
      aria-describedby={descripcionId}
      aria-busy={guardando}
      onCancel={(evento) => {
        evento.preventDefault();
        onCancelar();
      }}
    >
      <h2 id={tituloId}>Estado de matrícula</h2>

      <p id={descripcionId}>
        {matricula.nombreEstudiante} · Año {matricula.anioLectivo}
      </p>

      <form onSubmit={manejarEnvio}>
        <div className="campo matriculas__modal-campo">
          <label className="campo__etiqueta" htmlFor="matricula-estado-select">
            Estado actual
          </label>
          <select
            id="matricula-estado-select"
            className="campo__entrada"
            value={estadoSeleccionado}
            onChange={(evento) =>
              setEstadoSeleccionado(evento.target.value as EstadoMatricula)
            }
            disabled={guardando}
            autoFocus
          >
            <option value="ACTIVA">Activa</option>
            <option value="RETIRADA">Retirada</option>
            <option value="TRASLADADA">Trasladada</option>
          </select>
        </div>

        {error && (
          <p className="matriculas__error" role="alert">
            {error}
          </p>
        )}

        <div className="matriculas__modal-acciones">
          <Boton onClick={onCancelar} disabled={guardando}>
            Cancelar
          </Boton>

          <Boton
            type="submit"
            variante="principal"
            cargando={guardando}
            textoCargando="Guardando..."
          >
            Guardar estado
          </Boton>
        </div>
      </form>
    </dialog>
  );
}
