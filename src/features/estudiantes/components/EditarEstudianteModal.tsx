import { useId, useState } from "react";
import type { Estudiante } from "../estudiantes.types";
import { Modal } from "../../../shared/components/Modal";
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
  const [guardando, setGuardando] = useState(false);
  const tituloId = useId();

  function cerrar() {
    if (!guardando) onCerrar();
  }

  return (
    <Modal
      className="estudiantes-page__modal"
      ariaLabelledby={tituloId}
      bloqueado={guardando}
      onCerrar={cerrar}
    >
      <EditarEstudianteForm
        token={token}
        estudiante={estudiante}
        tituloId={tituloId}
        onActualizado={onActualizado}
        onCancelar={cerrar}
        onGuardando={setGuardando}
      />
    </Modal>
  );
}
