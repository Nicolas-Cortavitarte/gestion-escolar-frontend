import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router";
import { obtenerMatriculas, pagarMatricula } from "../matriculas.service";
import type { Matricula } from "../matriculas.types";
import { Boton } from "../../../shared/components/Boton";
import { CampoEntrada } from "../../../shared/components/CampoEntrada";
import { Paginacion } from "../../../shared/components/Paginacion";
import { BadgeEstado } from "../../../shared/components/BadgeEstado";
import "../../../styles/listados.css";
import "./MatriculasPage.css";

interface MatriculasPageProps {
  token: string;
}

const POR_PAGINA = 10;

const moneda = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .trim();
}

export function MatriculasPage({ token }: MatriculasPageProps) {
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [intento, setIntento] = useState(0);
  const [busqueda, setBusqueda] = useState("");
  const [anio, setAnio] = useState(String(new Date().getFullYear()));
  const [estado, setEstado] = useState("");
  const [pagina, setPagina] = useState(1);

  const [pagando, setPagando] = useState(false);
  const [mensajePago, setMensajePago] = useState("");
  const [errorPago, setErrorPago] = useState("");
  const [matriculaPendiente, setMatriculaPendiente] =
    useState<Matricula | null>(null);

  const pagandoRef = useRef(false);

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
        (estado === "" ||
          (estado === "pagada" && matricula.matriculaPagada) ||
          (estado === "pendiente" && !matricula.matriculaPagada)),
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

  function abrirPago(matricula: Matricula) {
    setMensajePago("");
    setErrorPago("");
    setMatriculaPendiente(matricula);
  }

  function cerrarPago() {
    if (pagandoRef.current) return;

    setMatriculaPendiente(null);
    setErrorPago("");
  }

  async function registrarPago() {
    const seleccionada = matriculaPendiente;

    if (!seleccionada || seleccionada.matriculaPagada || pagandoRef.current) {
      return;
    }

    pagandoRef.current = true;
    setPagando(true);
    setErrorPago("");

    try {
      const actualizada = await pagarMatricula(token, seleccionada.id);

      setMatriculas((actuales) =>
        actuales.map((item) =>
          item.id === actualizada.id ? actualizada : item,
        ),
      );

      setMatriculaPendiente(null);
      setMensajePago(
        `Pago de matrícula registrado para ${seleccionada.nombreEstudiante}.`,
      );
    } catch (fallo: unknown) {
      setErrorPago(
        fallo instanceof Error
          ? fallo.message
          : "No se pudo registrar el pago. Inténtalo nuevamente.",
      );
    } finally {
      pagandoRef.current = false;
      setPagando(false);
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
            Pago de matrícula
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
            <option value="pendiente">Pendiente</option>
            <option value="pagada">Pagada</option>
          </select>
        </div>
      </div>

      {mensajePago && (
        <p className="matriculas__exito" role="status">
          {mensajePago}
        </p>
      )}

      {cargando && (
        <p className="estado-listado" role="status">
          Cargando matrículas...
        </p>
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
                  <th scope="col">Pago de matrícula</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {visibles.map((matricula) => (
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
                    <td data-label="Pago de matrícula">
                      <BadgeEstado
                        variante={
                          matricula.matriculaPagada ? "exito" : "pendiente"
                        }
                      >
                        {matricula.matriculaPagada ? "Pagada" : "Pendiente"}
                      </BadgeEstado>
                    </td>
                    <td data-label="Acciones">
                      {matricula.matriculaPagada ? (
                        <span>Pago registrado</span>
                      ) : (
                        <Boton
                          onClick={() => abrirPago(matricula)}
                          aria-label={`Registrar pago de matrícula de ${matricula.nombreEstudiante}`}
                        >
                          Registrar pago
                        </Boton>
                      )}
                    </td>
                  </tr>
                ))}
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

      {matriculaPendiente && (
        <ConfirmarPagoModal
          matricula={matriculaPendiente}
          pagando={pagando}
          error={errorPago}
          onCancelar={cerrarPago}
          onConfirmar={() => void registrarPago()}
        />
      )}
    </section>
  );
}

interface ConfirmarPagoModalProps {
  matricula: Matricula;
  pagando: boolean;
  error: string;
  onCancelar: () => void;
  onConfirmar: () => void;
}

function ConfirmarPagoModal({
  matricula,
  pagando,
  error,
  onCancelar,
  onConfirmar,
}: ConfirmarPagoModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const tituloId = useId();
  const descripcionId = useId();

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

  return (
    <dialog
      ref={dialogRef}
      className="matriculas__modal"
      aria-labelledby={tituloId}
      aria-describedby={descripcionId}
      aria-busy={pagando}
      onCancel={(evento) => {
        evento.preventDefault();
        onCancelar();
      }}
    >
      <h2 id={tituloId}>Confirmar pago de matrícula</h2>
      <p id={descripcionId}>
        Registra este pago únicamente si ya recibiste el importe.
      </p>

      <dl className="matriculas__modal-detalle">
        <div>
          <dt>Estudiante</dt>
          <dd>{matricula.nombreEstudiante}</dd>
        </div>
        <div>
          <dt>Año lectivo</dt>
          <dd>{matricula.anioLectivo}</dd>
        </div>
        <div>
          <dt>Monto recibido</dt>
          <dd>{moneda.format(matricula.montoMatricula)}</dd>
        </div>
      </dl>

      {error && (
        <p className="matriculas__error" role="alert">
          {error}
        </p>
      )}

      <div className="matriculas__modal-acciones">
        <Boton onClick={onCancelar} disabled={pagando} autoFocus>
          Cancelar
        </Boton>

        <Boton
          variante="principal"
          onClick={onConfirmar}
          cargando={pagando}
          textoCargando="Registrando..."
        >
          {error ? "Reintentar pago" : "Confirmar pago"}
        </Boton>
      </div>
    </dialog>
  );
}
