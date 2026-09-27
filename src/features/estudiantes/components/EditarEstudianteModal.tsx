import { useEffect, useRef } from "react";
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

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();

    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="estudiantes-page__modal"
      aria-label="Editar estudiante"
      onCancel={(event) => {
        event.preventDefault();
        onCerrar();
      }}
      onClick={(evento) => {
        if (evento.target === evento.currentTarget) {
          onCerrar();
        }
      }}
    >
      <EditarEstudianteForm
        token={token}
        estudiante={estudiante}
        onActualizado={onActualizado}
        onCancelar={onCerrar}
      />
    </dialog>
  );
}
