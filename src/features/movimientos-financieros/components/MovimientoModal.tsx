import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { crearMovimiento } from "../movimientos-financieros.service";
import type {
  CategoriaMovimiento,
  MovimientoFinanciero,
  TipoMovimiento,
} from "../movimientos-financieros.types";
import { Boton } from "../../../shared/components/Boton";
import { CampoEntrada } from "../../../shared/components/CampoEntrada";
import { useValidacion } from "../../../shared/hooks/useValidacion";

interface MovimientoModalProps {
  token: string;
  onCreado: (movimiento: MovimientoFinanciero) => void;
  onCerrar: () => void;
}

const categorias: Record<CategoriaMovimiento, string> = {
  MATERIALES: "Materiales",
  SERVICIOS: "Servicios",
  ACTIVIDADES: "Actividades",
  MANTENIMIENTO: "Mantenimiento",
  DONACION: "Donación",
  OTRO: "Otro",
};

function fechaActualLima() {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const valor = (tipo: string) =>
    partes.find((parte) => parte.type === tipo)!.value;

  return `${valor("year")}-${valor("month")}-${valor("day")}`;
}

export function MovimientoModal({
  token,
  onCreado,
  onCerrar,
}: MovimientoModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const guardandoRef = useRef(false);
  const id = useId();

  const [tipo, setTipo] = useState<TipoMovimiento>("EGRESO");
  const [categoria, setCategoria] = useState<CategoriaMovimiento>("OTRO");
  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState(fechaActualLima);
  const [descripcion, setDescripcion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const { errores, eventos, validar } = useValidacion();

  const conceptoId = `${id}-concepto`;
  const montoId = `${id}-monto`;
  const fechaId = `${id}-fecha`;
  const descripcionId = `${id}-descripcion`;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const elementoAnterior =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    if (!dialog.open) dialog.showModal();

    return () => {
      dialog.close();

      if (elementoAnterior?.isConnected) {
        elementoAnterior.focus();
      }
    };
  }, []);

  function cerrar() {
    if (!guardandoRef.current) onCerrar();
  }

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (guardandoRef.current) return;

    setError("");

    const formulario = evento.currentTarget;

    if (!validar(formulario)) return;
    if (!formulario.reportValidity()) return;

    const importe = Number(monto);
    const conceptoLimpio = concepto.trim();

    if (!conceptoLimpio || conceptoLimpio.length > 255) {
      setError("El concepto debe tener entre 1 y 255 caracteres.");
      return;
    }

    if (!Number.isFinite(importe) || importe <= 0) {
      setError("Ingresa un monto mayor a cero.");
      return;
    }

    if (descripcion.trim().length > 1000) {
      setError("La descripción no puede superar los 1000 caracteres.");
      return;
    }

    guardandoRef.current = true;
    setGuardando(true);

    try {
      const creado = await crearMovimiento(token, {
        tipo,
        categoria,
        concepto: conceptoLimpio,
        monto: importe,
        fecha,
        descripcion: descripcion.trim() || null,
      });

      onCreado(creado);
    } catch (fallo: unknown) {
      setError(
        fallo instanceof Error
          ? fallo.message
          : "No se pudo registrar el movimiento. Inténtalo nuevamente.",
      );
    } finally {
      guardandoRef.current = false;
      setGuardando(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="movimientos__modal"
      aria-labelledby={`${id}-titulo`}
      aria-describedby={`${id}-descripcion-modal`}
      onCancel={(evento) => {
        evento.preventDefault();
        cerrar();
      }}
    >
      <form
        className="movimientos__formulario"
        onSubmit={guardar}
        onChange={() => setError("")}
        aria-busy={guardando}
        noValidate
        {...eventos}
      >
        <h2 id={`${id}-titulo`}>Registrar movimiento</h2>

        <p id={`${id}-descripcion-modal`}>
          Registra operaciones adicionales. Los pagos de matrículas, pensiones y
          docentes se registran en sus respectivos apartados.
        </p>

        <fieldset disabled={guardando}>
          <legend>Datos del movimiento</legend>

          <div className="movimientos__form-grid">
            <div className="campo">
              <label htmlFor={`${id}-tipo`}>Tipo de movimiento</label>

              <select
                id={`${id}-tipo`}
                className="campo__entrada"
                value={tipo}
                onChange={(evento) =>
                  setTipo(evento.target.value as TipoMovimiento)
                }
                aria-describedby={`${id}-tipo-ayuda`}
                required
              >
                <option value="EGRESO">Egreso</option>
                <option value="INGRESO">Ingreso</option>
              </select>

              <p id={`${id}-tipo-ayuda`} className="campo__ayuda">
                Ingreso: dinero recibido. Egreso: dinero gastado.
              </p>
            </div>

            <div className="campo">
              <label htmlFor={`${id}-categoria`}>Categoría</label>

              <select
                id={`${id}-categoria`}
                className="campo__entrada"
                value={categoria}
                onChange={(evento) =>
                  setCategoria(evento.target.value as CategoriaMovimiento)
                }
                required
              >
                {Object.entries(categorias).map(([valor, nombre]) => (
                  <option key={valor} value={valor}>
                    {nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="movimientos__campo--completo">
              <CampoEntrada
                id={conceptoId}
                etiqueta="Concepto"
                value={concepto}
                onChange={(evento) => setConcepto(evento.target.value)}
                maxLength={255}
                placeholder="Ej.: Compra de materiales de limpieza"
                error={errores[conceptoId]}
                autoFocus
                required
              />
            </div>

            <CampoEntrada
              id={montoId}
              etiqueta="Monto (S/)"
              type="number"
              inputMode="decimal"
              value={monto}
              onChange={(evento) => setMonto(evento.target.value)}
              min={0.01}
              step={0.01}
              error={errores[montoId]}
              required
            />

            <CampoEntrada
              id={fechaId}
              etiqueta="Fecha del movimiento"
              type="date"
              value={fecha}
              onChange={(evento) => setFecha(evento.target.value)}
              error={errores[fechaId]}
              required
            />

            <div className="movimientos__campo movimientos__campo--completo">
              <label htmlFor={descripcionId}>Descripción (opcional)</label>

              <textarea
                id={descripcionId}
                value={descripcion}
                onChange={(evento) => setDescripcion(evento.target.value)}
                maxLength={1000}
                rows={3}
                aria-describedby={`${descripcionId}-ayuda`}
              />

              <p id={`${descripcionId}-ayuda`} className="campo__ayuda">
                Agrega detalles si son necesarios. Máximo 1000 caracteres.
              </p>
            </div>
          </div>
        </fieldset>

        {error && <p role="alert">{error}</p>}

        <div className="movimientos__acciones">
          <Boton onClick={cerrar} disabled={guardando}>
            Cancelar
          </Boton>

          <Boton
            type="submit"
            variante="principal"
            cargando={guardando}
            textoCargando="Guardando..."
          >
            Registrar movimiento
          </Boton>
        </div>
      </form>
    </dialog>
  );
}
