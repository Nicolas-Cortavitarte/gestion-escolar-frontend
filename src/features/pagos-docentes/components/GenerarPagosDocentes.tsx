import { useId, useRef, useState } from "react";
import { Boton } from "../../../shared/components/Boton";
import { generarPagosAnuales } from "../pagos-docentes.service";

interface GenerarPagosDocentesProps {
  token: string;
  disabled?: boolean;
  onGenerados: (anio: string) => void;
}

export function GenerarPagosDocentes({
  token,
  disabled = false,
  onGenerados,
}: GenerarPagosDocentesProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const guardandoRef = useRef(false);
  const tituloId = useId();
  const descripcionId = useId();

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const anio = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Lima",
    year: "numeric",
  }).format(new Date());

  function abrir() {
    if (disabled || guardandoRef.current) return;

    setError("");

    const dialog = dialogRef.current;

    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }

  function cerrar() {
    if (guardandoRef.current) return;

    dialogRef.current?.close();
    setError("");
  }

  async function confirmar() {
    if (guardandoRef.current) return;

    guardandoRef.current = true;
    setGuardando(true);
    setError("");

    try {
      await generarPagosAnuales(token);

      dialogRef.current?.close();
      onGenerados(anio);
    } catch (fallo: unknown) {
      setError(
        fallo instanceof Error
          ? fallo.message
          : "No se pudieron generar los pagos. Intenta nuevamente.",
      );
    } finally {
      guardandoRef.current = false;
      setGuardando(false);
    }
  }

  return (
    <>
      <Boton onClick={abrir} disabled={disabled || guardando}>
        Generar pagos de {anio}
      </Boton>

      <dialog
        ref={dialogRef}
        className="pagos-docentes__modal"
        aria-labelledby={tituloId}
        aria-describedby={descripcionId}
        aria-busy={guardando}
        onCancel={(evento) => {
          if (guardandoRef.current) {
            evento.preventDefault();
          }
        }}
      >
        <h2 id={tituloId}>Generar pagos del año {anio}</h2>

        <p id={descripcionId}>
          Se crearán los pagos pendientes de marzo a diciembre para los docentes
          activos, usando su sueldo mensual actual. Los pagos existentes
          conservarán sus montos y estados.
        </p>

        <p>Esta acción no registra la entrega de dinero.</p>

        {error && (
          <p className="generar-pagos__error" role="alert">
            {error}
          </p>
        )}

        <div className="pagos-docentes__acciones">
          <Boton onClick={cerrar} disabled={guardando} autoFocus>
            Cancelar
          </Boton>

          <Boton
            variante="principal"
            onClick={() => void confirmar()}
            cargando={guardando}
            textoCargando="Generando..."
          >
            Confirmar generación
          </Boton>
        </div>
      </dialog>
    </>
  );
}
