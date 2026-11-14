export const moneda = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .trim();
}

export function fechaHoy(): string {
  const hoy = new Date();
  return [
    hoy.getFullYear(),
    String(hoy.getMonth() + 1).padStart(2, "0"),
    String(hoy.getDate()).padStart(2, "0"),
  ].join("-");
}

export function rangoMesActual(): { desde: string; hasta: string } {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());

  const anio = partes.find((parte) => parte.type === "year")!.value;
  const mes = partes.find((parte) => parte.type === "month")!.value;
  const ultimoDia = new Date(Number(anio), Number(mes), 0).getDate();

  return {
    desde: `${anio}-${mes}-01`,
    hasta: `${anio}-${mes}-${String(ultimoDia).padStart(2, "0")}`,
  };
}

export function mostrarFecha(fecha: string): string {
  const partes = fecha.slice(0, 10).split("-");
  return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : fecha;
}
