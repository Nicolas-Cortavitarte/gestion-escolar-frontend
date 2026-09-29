import { useEffect, useState, useRef } from "react";
import { obtenerMatriculas, pagarMatricula } from "../matriculas.service";
import type { Matricula } from "../matriculas.types";
import "./MatriculasPage.css";

interface MatriculasPageProps {
  token: string;
}

export function MatriculasPage({ token }: MatriculasPageProps) {
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [anio, setAnio] = useState(String(new Date().getFullYear()));
  const [pagandoId, setPagandoId] = useState<string | null>(null);
  const [mensajePago, setMensajePago] = useState("");
  const [errorPago, setErrorPago] = useState("");
  const [matriculaPendiente, setMatriculaPendiente] =
    useState<Matricula | null>(null);

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
  }, [token]);

  const anios = Array.from(
    new Set([
      new Date().getFullYear(),
      ...matriculas.map((matricula) => matricula.anioLectivo),
    ]),
  ).sort((a, b) => b - a);

  const termino = busqueda.trim().toLowerCase();

  const filtradas = matriculas.filter(
    (matricula) =>
      matricula.anioLectivo === Number(anio) &&
      matricula.nombreEstudiante.toLowerCase().includes(termino),
  );

  const moneda = new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  });

  async function registrarPago(matricula: Matricula) {
    if (pagandoId !== null || matricula.matriculaPagada) return;

    setPagandoId(matricula.id);
    setMensajePago("");
    setErrorPago("");

    try {
      const actualizada = await pagarMatricula(token, matricula.id);

      setMatriculas((actuales) =>
        actuales.map((item) =>
          item.id === actualizada.id ? actualizada : item,
        ),
      );

      setMensajePago(
        `Pago de matrícula registrado para ${matricula.nombreEstudiante}.`,
      );
    } catch (fallo: unknown) {
      setErrorPago(
        fallo instanceof Error
          ? fallo.message
          : "No se pudo registrar el pago.",
      );
    } finally {
      setPagandoId(null);
    }
  }

  return (
    <section className="matriculas">
      <header className="matriculas__encabezado">
        <h1>Matrículas registradas</h1>
        <p>Consulta las matrículas del año lectivo y su estado de pago.</p>
      </header>

      <div className="matriculas__filtros">
        <div className="matriculas__campo">
          <label htmlFor="matriculas-anio">Año lectivo</label>
          <select
            id="matriculas-anio"
            value={anio}
            onChange={(evento) => setAnio(evento.target.value)}
          >
            {anios.map((valor) => (
              <option key={valor} value={valor}>
                {valor}
              </option>
            ))}
          </select>
        </div>

        <div className="matriculas__campo">
          <label htmlFor="matriculas-busqueda">Buscar estudiante</label>
          <input
            id="matriculas-busqueda"
            type="search"
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="Nombres o apellidos"
          />
        </div>
      </div>

      {cargando && <p role="status">Cargando matrículas...</p>}
      {error && <p role="alert">{error}</p>}

      {!cargando && !error && filtradas.length === 0 && (
        <p>No hay matrículas que coincidan con los filtros.</p>
      )}

      {mensajePago && <p role="status">{mensajePago}</p>}
      {errorPago && <p role="alert">{errorPago}</p>}

      {!cargando && !error && filtradas.length > 0 && (
        <div
          className="matriculas__tabla-contenedor"
          role="region"
          aria-label="Listado de matrículas"
          tabIndex={0}
        >
          <table>
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
              {filtradas.map((matricula) => (
                <tr key={matricula.id}>
                  <td>{matricula.nombreEstudiante}</td>
                  <td>{matricula.nivel}</td>
                  <td>{matricula.grado}</td>
                  <td>{moneda.format(matricula.montoMatricula)}</td>
                  <td>{moneda.format(matricula.montoPensionMensual)}</td>
                  <td>
                    <span
                      className={`matriculas__estado ${
                        matricula.matriculaPagada
                          ? "matriculas__estado--pagada"
                          : "matriculas__estado--pendiente"
                      }`}
                    >
                      {matricula.matriculaPagada ? "Pagada" : "Pendiente"}
                    </span>
                  </td>
                  <td>
                    {matricula.matriculaPagada ? (
                      <span className="matriculas__pago-registrado">
                        Pago registrado
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="matriculas__boton-pago"
                        disabled={pagandoId !== null}
                        onClick={() => setMatriculaPendiente(matricula)}
                        aria-label={`Registrar pago de matrícula de ${matricula.nombreEstudiante}`}
                      >
                        {pagandoId === matricula.id
                          ? "Registrando..."
                          : "Registrar pago"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {matriculaPendiente && (
        <ConfirmarPagoModal
          matricula={matriculaPendiente}
          onCancelar={() => setMatriculaPendiente(null)}
          onConfirmar={() => {
            const seleccionada = matriculaPendiente;
            setMatriculaPendiente(null);
            void registrarPago(seleccionada);
          }}
        />
      )}
    </section>
  );
}

interface ConfirmarPagoModalProps {
  matricula: Matricula;
  onCancelar: () => void;
  onConfirmar: () => void;
}

function ConfirmarPagoModal({
  matricula,
  onCancelar,
  onConfirmar,
}: ConfirmarPagoModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) return;

    dialog.showModal();

    return () => {
      dialog.close();
    };
  }, []);

  const monto = new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(matricula.montoMatricula);

  return (
    <dialog
      ref={dialogRef}
      className="matriculas__modal"
      aria-labelledby="confirmar-pago-titulo"
      aria-describedby="confirmar-pago-descripcion"
      onCancel={(evento) => {
        evento.preventDefault();
        onCancelar();
      }}
    >
      <h2 id="confirmar-pago-titulo">Confirmar pago de matrícula</h2>

      <p id="confirmar-pago-descripcion">Confirmar el registro del pago.</p>

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
          <dd>{monto}</dd>
        </div>
      </dl>

      <div className="matriculas__modal-acciones">
        <button
          type="button"
          className="matriculas__boton-cancelar"
          onClick={onCancelar}
          autoFocus
        >
          Cancelar
        </button>

        <button
          type="button"
          className="matriculas__boton-pago"
          onClick={onConfirmar}
        >
          Confirmar pago
        </button>
      </div>
    </dialog>
  );
}
