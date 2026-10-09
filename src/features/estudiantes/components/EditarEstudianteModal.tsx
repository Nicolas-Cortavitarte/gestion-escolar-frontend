import { useEffect, useId, useRef } from "react";
import type { Estudiante } from "../estudiantes.types";
import { EditarEstudianteForm } from "./EditarEstudianteForm";

interface EditarEstudianteModalProps {
  token: string;
  estudiante: Estudiante;
  onActualizado: (estudiante: Estudiante) => void;
  onCerrar: () => void;
}

export function EditarEstudianteModal({
  token,
  estudiante,
  onActualizado,
  onCerrar,
}: EditarEstudianteModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const guardandoRef = useRef(false);
  const tituloId = useId();

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
      }
    };
  }, []);

  function cerrar() {
    if (!guardandoRef.current) onCerrar();
  }

  return (
    <dialog
      ref={dialogRef}
      className="estudiantes-page__modal"
      aria-labelledby={tituloId}
      onCancel={(evento) => {
        evento.preventDefault();
        cerrar();
      }}
    >
      <EditarEstudianteForm
        token={token}
        estudiante={estudiante}
        tituloId={tituloId}
        onActualizado={onActualizado}
        onCancelar={cerrar}
        onGuardando={(valor) => {
          guardandoRef.current = valor;
        }}
      />
    </dialog>
  );
}
