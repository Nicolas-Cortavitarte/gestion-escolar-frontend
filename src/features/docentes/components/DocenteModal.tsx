import { useEffect, useRef } from "react";
import { DocenteForm } from "./DocenteForm";
import type { Docente } from "../docentes.types";

interface DocenteModalProps {
  token: string;
  docente?: Docente;
  onGuardado: (docente: Docente) => void;
  onCerrar: () => void;
}

export function DocenteModal({
  token,
  docente,
  onGuardado,
  onCerrar,
}: DocenteModalProps) {
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
      className="docentes__modal"
      aria-labelledby="docente-form-titulo"
      onCancel={(evento) => {
        evento.preventDefault();

        if (dialogRef.current?.querySelector('[aria-busy="true"]')) {
          return;
        }

        onCerrar();
      }}
    >
      <DocenteForm
        token={token}
        docente={docente}
        onGuardado={onGuardado}
        onCancelar={onCerrar}
      />
    </dialog>
  );
}
