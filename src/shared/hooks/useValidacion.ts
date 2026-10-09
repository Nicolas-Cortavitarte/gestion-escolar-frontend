import { useRef, useState, type FormEvent, type FocusEvent } from "react";

function mensajeValidacion(input: HTMLInputElement): string {
  const { validity } = input;

  if (validity.valueMissing) return "Completa este campo.";
  if (validity.typeMismatch) return "Ingresa un valor válido.";
  if (validity.patternMismatch) {
    return input.dataset.mensajePatron ?? "Revisa el formato del campo.";
  }
  if (validity.rangeOverflow) {
    return "El valor supera el máximo permitido.";
  }
  if (validity.rangeUnderflow) {
    return "El valor es menor al mínimo permitido.";
  }
  if (validity.tooShort) {
    return `Ingresa al menos ${input.minLength} caracteres.`;
  }
  if (validity.badInput) return "Ingresa un valor válido.";

  if (input.required && !input.value.trim()) {
    return "Completa este campo.";
  }

  return validity.valid ? "" : "Revisa este campo.";
}

export function useValidacion() {
  const [errores, setErrores] = useState<Record<string, string>>({});
  const tocados = useRef(new Set<string>());

  function actualizar(input: HTMLInputElement) {
    setErrores((actuales) => ({
      ...actuales,
      [input.id]: mensajeValidacion(input),
    }));
  }

  function onBlur(evento: FocusEvent<HTMLFormElement>) {
    const input = evento.target;

    if (!(input instanceof HTMLInputElement)) return;

    tocados.current.add(input.id);
    actualizar(input);
  }

  function onInput(evento: FormEvent<HTMLFormElement>) {
    const input = evento.target;

    if (input instanceof HTMLInputElement && tocados.current.has(input.id)) {
      actualizar(input);
    }
  }

  function validar(formulario: HTMLFormElement): boolean {
    const nuevos: Record<string, string> = {};
    let primero: HTMLInputElement | undefined;

    formulario.querySelectorAll<HTMLInputElement>("input").forEach((input) => {
      if (input.disabled) return;

      tocados.current.add(input.id);
      const mensaje = mensajeValidacion(input);

      if (mensaje) {
        nuevos[input.id] = mensaje;
        primero ??= input;
      }
    });

    setErrores(nuevos);
    primero?.focus();

    return !primero;
  }

  return { errores, validar, eventos: { onBlur, onInput } };
}
