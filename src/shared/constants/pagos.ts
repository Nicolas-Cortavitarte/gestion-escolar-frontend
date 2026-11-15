export type MetodoPago =
  | "EFECTIVO"
  | "YAPE"
  | "PLIN"
  | "TRANSFERENCIA"
  | "TARJETA";

export const METODOS_PAGO: { valor: MetodoPago; etiqueta: string }[] = [
  { valor: "EFECTIVO", etiqueta: "Efectivo" },
  { valor: "YAPE", etiqueta: "Yape" },
  { valor: "PLIN", etiqueta: "Plin" },
  { valor: "TRANSFERENCIA", etiqueta: "Transferencia bancaria" },
  { valor: "TARJETA", etiqueta: "Tarjeta" },
];

export function etiquetaMetodoPago(metodo?: MetodoPago | null): string {
  if (!metodo) return "Efectivo";
  return (
    METODOS_PAGO.find((item) => item.valor === metodo)?.etiqueta ?? metodo
  );
}
