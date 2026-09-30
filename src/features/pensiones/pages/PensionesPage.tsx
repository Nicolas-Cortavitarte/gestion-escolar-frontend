import { useEffect, useState, useRef } from "react";
import { obtenerPensiones, pagarPension } from "../pensiones.service";
import { obtenerMatriculas } from "../../matriculas/matriculas.service";
import type { Pension } from "../pensiones.types";
import type { Matricula } from "../../matriculas/matriculas.types";
import "./PensionesPage.css";

interface PensionesPageProps {
  token: string;
}

const meses = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const estados = {
  PENDIENTE: "Pendiente",
  PAGADO: "Pagada",
  EN_MORA: "En mora",
};

const moneda = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

export function PensionesPage({ token }: PensionesPageProps) {
  const [pensiones, setPensiones] = useState<Pension[]>([]);
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [anio, setAnio] = useState(String(new Date().getFullYear()));
  const [estado, setEstado] = useState("");
  const [mes, setMes] = useState(String(new Date().getMonth() + 1));
  const [pensionSeleccionada, setPensionSeleccionada] =
    useState<Pension | null>(null);
  const [pagandoId, setPagandoId] = useState<string | null>(null);
  const [mensajePago, setMensajePago] = useState("");
  const [errorPago, setErrorPago] = useState("");

  useEffect(() => {
    let activo = true;

    Promise.all([obtenerPensiones(token), obtenerMatriculas(token)])
      .then(([datosPensiones, datosMatriculas]) => {
        if (!activo) return;

        setPensiones(datosPensiones);
        setMatriculas(datosMatriculas);
        setError("");
      })
      .catch((fallo: unknown) => {
        if (!activo) return;

        setError(
          fallo instanceof Error
            ? fallo.message
            : "No se pudieron cargar las pensiones.",
        );
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [token]);

  const matriculasPorId = new Map(
    matriculas.map((matricula) => [matricula.id, matricula]),
  );

  const anios = Array.from(
    new Set([
      new Date().getFullYear(),
      ...matriculas.map((matricula) => matricula.anioLectivo),
    ]),
  ).sort((a, b) => b - a);

  const termino = busqueda.trim().toLocaleLowerCase("es");

  const filtradas = pensiones
    .filter((pension) => {
      const matricula = matriculasPorId.get(pension.matriculaId);

      return (
        matricula !== undefined &&
        matricula.anioLectivo === Number(anio) &&
        matricula.nombreEstudiante.toLocaleLowerCase("es").includes(termino) &&
        (mes === "" || pension.mes === Number(mes)) &&
        (estado === "" || pension.estado === estado)
      );
    })
    .sort((a, b) => {
      const nombreA =
        matriculasPorId.get(a.matriculaId)?.nombreEstudiante ?? "";
      const nombreB =
        matriculasPorId.get(b.matriculaId)?.nombreEstudiante ?? "";

      return nombreA.localeCompare(nombreB, "es") || a.mes - b.mes;
    });

  async function registrarPago(pension: Pension) {
    if (pagandoId !== null || pension.estado === "PAGADO") return;

    setPagandoId(pension.id);
    setMensajePago("");
    setErrorPago("");

    try {
      const actualizada = await pagarPension(token, pension.id);

      setPensiones((actuales) =>
        actuales.map((item) =>
          item.id === actualizada.id ? actualizada : item,
        ),
      );

      const nombre = matriculasPorId.get(pension.matriculaId)?.nombreEstudiante;

      setMensajePago(
        `Pago de ${meses[pension.mes - 1]} registrado para ${
          nombre ?? "el estudiante"
        }.`,
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
    <section className="pensiones">
      <header className="pensiones__encabezado">
        <h1>Pensiones</h1>
        <p>Consulta las pensiones y el estado de pago de cada estudiante.</p>
      </header>

      <div className="pensiones__filtros">
        <div className="pensiones__campo">
          <label htmlFor="pensiones-anio">Año lectivo</label>
          <select
            id="pensiones-anio"
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

        <div className="pensiones__campo">
          <label htmlFor="pensiones-mes">Mes</label>
          <select
            id="pensiones-mes"
            value={mes}
            onChange={(evento) => setMes(evento.target.value)}
          >
            <option value="">Todos los meses</option>
            {meses.map((nombre, indice) => (
              <option key={nombre} value={indice + 1}>
                {nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="pensiones__campo">
          <label htmlFor="pensiones-busqueda">Buscar estudiante</label>
          <input
            id="pensiones-busqueda"
            type="search"
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="Nombres o apellidos"
          />
        </div>

        <div className="pensiones__campo">
          <label htmlFor="pensiones-estado">Estado</label>
          <select
            id="pensiones-estado"
            value={estado}
            onChange={(evento) => setEstado(evento.target.value)}
          >
            <option value="">Todos</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="PAGADO">Pagada</option>
            <option value="EN_MORA">En mora</option>
          </select>
        </div>
      </div>

      {cargando && <p role="status">Cargando pensiones...</p>}
      {error && <p role="alert">{error}</p>}

      {mensajePago && <p role="status">{mensajePago}</p>}
      {errorPago && <p role="alert">{errorPago}</p>}

      {!cargando && !error && filtradas.length === 0 && (
        <p>No hay pensiones que coincidan con los filtros.</p>
      )}

      {!cargando && !error && filtradas.length > 0 && (
        <div
          className="pensiones__tabla-contenedor"
          role="region"
          aria-label="Listado de pensiones"
          tabIndex={0}
        >
          <table>
            <thead>
              <tr>
                <th scope="col">Estudiante</th>
                <th scope="col">Mes</th>
                <th scope="col">Monto base</th>
                <th scope="col">Mora</th>
                <th scope="col">Total</th>
                <th scope="col">Vencimiento</th>
                <th scope="col">Estado</th>
                <th scope="col">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {filtradas.map((pension) => (
                <tr key={pension.id}>
                  <td>
                    {matriculasPorId.get(pension.matriculaId)?.nombreEstudiante}
                  </td>
                  <td>{meses[pension.mes - 1]}</td>
                  <td>{moneda.format(pension.montoBase)}</td>
                  <td>{moneda.format(pension.moraAcumulada)}</td>
                  <td>
                    {pension.montoTotal == null
                      ? "No disponible"
                      : moneda.format(pension.montoTotal)}
                  </td>
                  <td>
                    {pension.fechaVencimiento.split("-").reverse().join("/")}
                  </td>
                  <td>
                    <span
                      className={`pensiones__estado pensiones__estado--${pension.estado.toLowerCase()}`}
                    >
                      {estados[pension.estado]}
                    </span>
                  </td>
                  <td>
                    {pension.estado === "PAGADO" ? (
                      <span className="pensiones__pago-registrado">
                        Pago registrado
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="pensiones__boton-pago"
                        disabled={
                          pagandoId !== null || pension.montoTotal == null
                        }
                        onClick={() => setPensionSeleccionada(pension)}
                        aria-label={`Registrar pago de ${
                          meses[pension.mes - 1]
                        } de ${
                          matriculasPorId.get(pension.matriculaId)
                            ?.nombreEstudiante ?? "estudiante"
                        }`}
                      >
                        {pagandoId === pension.id
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

      {pensionSeleccionada && (
        <ConfirmarPagoPensionModal
          pension={pensionSeleccionada}
          nombreEstudiante={
            matriculasPorId.get(pensionSeleccionada.matriculaId)
              ?.nombreEstudiante ?? "Estudiante"
          }
          onCancelar={() => setPensionSeleccionada(null)}
          onConfirmar={() => {
            const seleccionada = pensionSeleccionada;
            setPensionSeleccionada(null);
            void registrarPago(seleccionada);
          }}
        />
      )}
    </section>
  );
}

interface ConfirmarPagoPensionModalProps {
  pension: Pension;
  nombreEstudiante: string;
  onCancelar: () => void;
  onConfirmar: () => void;
}

function ConfirmarPagoPensionModal({
  pension,
  nombreEstudiante,
  onCancelar,
  onConfirmar,
}: ConfirmarPagoPensionModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) return;

    dialog.showModal();

    return () => {
      dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="pensiones__modal"
      aria-labelledby="pension-pago-titulo"
      aria-describedby="pension-pago-descripcion"
      onCancel={(evento) => {
        evento.preventDefault();
        onCancelar();
      }}
    >
      <h2 id="pension-pago-titulo">Confirmar pago de pensión</h2>

      <p id="pension-pago-descripcion">
        Confirma cuando el colegio haya recibido el importe total.
      </p>

      <dl className="pensiones__modal-detalle">
        <div>
          <dt>Estudiante</dt>
          <dd>{nombreEstudiante}</dd>
        </div>

        <div>
          <dt>Periodo</dt>
          <dd>
            {meses[pension.mes - 1]} de {pension.fechaVencimiento.slice(0, 4)}
          </dd>
        </div>

        <div>
          <dt>Monto base</dt>
          <dd>{moneda.format(pension.montoBase)}</dd>
        </div>

        <div>
          <dt>Mora acumulada</dt>
          <dd>{moneda.format(pension.moraAcumulada)}</dd>
        </div>

        <div>
          <dt>Total recibido</dt>
          <dd>{moneda.format(pension.montoTotal)}</dd>
        </div>
      </dl>

      <div className="pensiones__modal-acciones">
        <button
          type="button"
          className="pensiones__boton-cancelar"
          onClick={onCancelar}
          autoFocus
        >
          Cancelar
        </button>

        <button
          type="button"
          className="pensiones__boton-pago"
          onClick={onConfirmar}
        >
          Confirmar pago
        </button>
      </div>
    </dialog>
  );
}
