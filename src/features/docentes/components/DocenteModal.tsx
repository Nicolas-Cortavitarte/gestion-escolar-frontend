import { useId, useState } from "react";
import { DocenteForm } from "./DocenteForm";
import type { Docente } from "../docentes.types";
import { Modal } from "../../../shared/components/Modal";

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
  const [guardando, setGuardando] = useState(false);
  const tituloId = useId();

  function cerrar() {
    if (!guardando) onCerrar();
  }

  return (
    <Modal
      className="docentes__modal"
      ariaLabelledby={tituloId}
      bloqueado={guardando}
      onCerrar={cerrar}
    >
      <DocenteForm
        token={token}
        docente={docente}
        tituloId={tituloId}
        onGuardado={onGuardado}
        onCancelar={cerrar}
        onGuardando={setGuardando}
      />
    </Modal>
  );
}
