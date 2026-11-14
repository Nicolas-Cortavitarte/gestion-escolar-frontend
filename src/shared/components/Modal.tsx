import { useEffect, useRef, type ReactNode } from "react";
import "./Modal.css";

interface Props {
  abierto?: boolean;
  onCerrar: () => void;
  bloqueado?: boolean;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
  className?: string;
  children: ReactNode;
}

export function Modal({
  abierto = true,
  onCerrar,
  bloqueado = false,
  ariaLabelledby,
  ariaDescribedby,
  className = "",
  children,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (abierto) {
      const focoAnterior =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;

      if (!dialog.open) {
        dialog.showModal();
      }

      return () => {
        if (dialog.open) {
          dialog.close();
        }
        if (focoAnterior?.isConnected) {
          focoAnterior.focus();
        }
      };
    }

    if (dialog.open) {
      dialog.close();
    }
  }, [abierto]);

  return (
    <dialog
      ref={dialogRef}
      className={`modal-base ${className}`.trim()}
      aria-labelledby={ariaLabelledby}
      aria-describedby={ariaDescribedby}
      onCancel={(evento) => {
        evento.preventDefault();
        if (bloqueado) {
          return;
        }
        onCerrar();
      }}
    >
      {children}
    </dialog>
  );
}
