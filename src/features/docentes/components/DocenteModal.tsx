import { useEffect, useId, useRef } from "react";
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
      } else {
        document.getElementById("docentes-busqueda")?.focus();
      }
    };
  }, []);

  function cerrar() {
    if (!guardandoRef.current) onCerrar();
  }

  return (
    <dialog
      ref={dialogRef}
      className="docentes__modal"
      aria-labelledby={tituloId}
      onCancel={(evento) => {
        evento.preventDefault();
        cerrar();
      }}
    >
      <DocenteForm
        token={token}
        docente={docente}
        tituloId={tituloId}
        onGuardado={onGuardado}
        onCancelar={cerrar}
        onGuardando={(valor) => {
          guardandoRef.current = valor;
        }}
      />
    </dialog>
  );
}
