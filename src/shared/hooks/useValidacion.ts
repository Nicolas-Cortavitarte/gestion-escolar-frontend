import { useRef, useState, type FormEvent, type FocusEvent } from "react";

type CampoValidable =
  | HTMLInputElement
  | HTMLSelectElement
  | HTMLTextAreaElement;

function esCampoValidable(elemento: EventTarget | null): elemento is CampoValidable {
  return (
    elemento instanceof HTMLInputElement ||
    elemento instanceof HTMLSelectElement ||
    elemento instanceof HTMLTextAreaElement
  );
}

function mensajeValidacion(campo: CampoValidable): string {
  const { validity } = campo;

  if (validity.valueMissing) return "Completa este campo.";
  if (validity.typeMismatch) return "Ingresa un valor válido.";
  if (validity.patternMismatch) {
    return campo.dataset.mensajePatron ?? "Revisa el formato del campo.";
  }
  if (validity.rangeOverflow) {
    return "El valor supera el máximo permitido.";
  }
  if (validity.rangeUnderflow) {
    return "El valor es menor al mínimo permitido.";
  }
  if (validity.tooShort && "minLength" in campo) {
    return `Ingresa al menos ${campo.minLength} caracteres.`;
  }
  if (validity.badInput) return "Ingresa un valor válido.";

  if (campo.required && !campo.value.trim()) {
    return "Completa este campo.";
  }

  return validity.valid ? "" : "Revisa este campo.";
}

export function useValidacion() {
  const [errores, setErrores] = useState<Record<string, string>>({});
  const tocados = useRef(new Set<string>());

  function actualizar(campo: CampoValidable) {
    setErrores((actuales) => ({
      ...actuales,
      [campo.id]: mensajeValidacion(campo),
    }));
  }

  function onBlur(evento: FocusEvent<HTMLFormElement>) {
    const campo = evento.target;

    if (!esCampoValidable(campo) || !campo.id) return;

    tocados.current.add(campo.id);
    actualizar(campo);
  }

  function onInput(evento: FormEvent<HTMLFormElement>) {
    const campo = evento.target;

    if (esCampoValidable(campo) && campo.id && tocados.current.has(campo.id)) {
      actualizar(campo);
    }
  }

  function validar(formulario: HTMLFormElement): boolean {
    const nuevos: Record<string, string> = {};
    let primero: CampoValidable | undefined;

    formulario
      .querySelectorAll<CampoValidable>("input, select, textarea")
      .forEach((campo) => {
        if (campo.disabled || !campo.id) return;

        tocados.current.add(campo.id);
        const mensaje = mensajeValidacion(campo);

        if (mensaje) {
          nuevos[campo.id] = mensaje;
          primero ??= campo;
        }
      });

    setErrores(nuevos);
    primero?.focus();

    return !primero;
  }

  return { errores, validar, eventos: { onBlur, onInput } };
}
