import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { crearMovimiento } from "../movimientos-financieros.service";
import type {
  CategoriaMovimiento,
  MovimientoFinanciero,
  TipoMovimiento,
} from "../movimientos-financieros.types";

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
  const [tipo, setTipo] = useState<TipoMovimiento>("EGRESO");
  const [categoria, setCategoria] = useState<CategoriaMovimiento>("OTRO");
  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState(fechaActualLima);
  const [descripcion, setDescripcion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    dialog.showModal();

    return () => {
      dialog.close();
    };
  }, []);

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (guardando) return;

    setError("");

    const importe = Number(monto);

    if (!concepto.trim()) {
      setError("Ingresa el concepto del movimiento.");
      return;
    }

    if (!Number.isFinite(importe) || importe <= 0) {
      setError("El monto debe ser mayor a cero.");
      return;
    }

    if (!fecha) {
      setError("Selecciona la fecha del movimiento.");
      return;
    }

    setGuardando(true);

    try {
      const creado = await crearMovimiento(token, {
        tipo,
        categoria,
        concepto: concepto.trim(),
        monto: importe,
        fecha,
        descripcion: descripcion.trim() || null,
      });

      onCreado(creado);
    } catch (fallo: unknown) {
      setError(
        fallo instanceof Error
          ? fallo.message
          : "No se pudo registrar el movimiento.",
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="movimientos__modal"
      aria-labelledby="movimiento-modal-titulo"
      onCancel={(evento) => {
        evento.preventDefault();
        if (!guardando) onCerrar();
      }}
    >
      <form
        className="movimientos__formulario"
        onSubmit={guardar}
        aria-busy={guardando}
      >
        <h2 id="movimiento-modal-titulo">Registrar movimiento</h2>

        <p>
          Registra operaciones adicionales. Los pagos de matrículas, pensiones y
          docentes se registran en sus respectivos apartados.
        </p>

        <fieldset disabled={guardando}>
          <legend>Datos del movimiento</legend>

          <div className="movimientos__form-grid">
            <div className="movimientos__campo">
              <label htmlFor="movimiento-tipo">Tipo</label>
              <select
                id="movimiento-tipo"
                value={tipo}
                onChange={(evento) =>
                  setTipo(evento.target.value as TipoMovimiento)
                }
              >
                <option value="EGRESO">Egreso</option>
                <option value="INGRESO">Ingreso</option>
              </select>
            </div>

            <div className="movimientos__campo">
              <label htmlFor="movimiento-categoria">Categoría</label>
              <select
                id="movimiento-categoria"
                value={categoria}
                onChange={(evento) =>
                  setCategoria(evento.target.value as CategoriaMovimiento)
                }
              >
                {Object.entries(categorias).map(([valor, nombre]) => (
                  <option key={valor} value={valor}>
                    {nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="movimientos__campo movimientos__campo--completo">
              <label htmlFor="movimiento-concepto">Concepto</label>
              <input
                id="movimiento-concepto"
                value={concepto}
                onChange={(evento) => setConcepto(evento.target.value)}
                maxLength={255}
                placeholder="Ej.: Compra de materiales de limpieza"
                autoFocus
                required
              />
            </div>

            <div className="movimientos__campo">
              <label htmlFor="movimiento-monto">Monto (S/)</label>
              <input
                id="movimiento-monto"
                type="number"
                value={monto}
                onChange={(evento) => setMonto(evento.target.value)}
                min="0.01"
                step="0.01"
                required
              />
            </div>

            <div className="movimientos__campo">
              <label htmlFor="movimiento-fecha">Fecha</label>
              <input
                id="movimiento-fecha"
                type="date"
                value={fecha}
                onChange={(evento) => setFecha(evento.target.value)}
                required
              />
            </div>

            <div className="movimientos__campo movimientos__campo--completo">
              <label htmlFor="movimiento-descripcion">
                Descripción (opcional)
              </label>
              <textarea
                id="movimiento-descripcion"
                value={descripcion}
                onChange={(evento) => setDescripcion(evento.target.value)}
                maxLength={1000}
                rows={3}
              />
            </div>
          </div>
        </fieldset>

        {error && <p role="alert">{error}</p>}

        <div className="movimientos__acciones">
          <button
            type="button"
            className="movimientos__boton-secundario"
            onClick={onCerrar}
            disabled={guardando}
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="movimientos__boton"
            disabled={guardando}
          >
            {guardando ? "Guardando..." : "Registrar movimiento"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
