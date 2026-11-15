import { etiquetaMetodoPago, type MetodoPago } from "../constants/pagos";
import { moneda } from "./formato";

export interface DatosRecibo {
  titulo: string;
  referencia: string;
  fechaPago: string | null | undefined;
  titular: string;
  documento?: string | null;
  concepto: string;
  detalle?: { etiqueta: string; monto: number }[];
  total: number;
  metodoPago?: MetodoPago | null;
  codigoOperacion?: string | null;
}

function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatearFechaRecibo(fecha?: string | null): string {
  if (!fecha) {
    return new Intl.DateTimeFormat("es-PE", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date());
  }
  const parsed = new Date(fecha);
  if (Number.isNaN(parsed.getTime())) return fecha;
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

export function imprimirRecibo(datos: DatosRecibo): boolean {
  const ventana = window.open("", "_blank", "width=720,height=680");
  if (!ventana) return false;

  const filasDetalle = (datos.detalle ?? [])
    .map(
      (item) => `
      <tr>
        <td>${escaparHtml(item.etiqueta)}</td>
        <td style="text-align:right;">${escaparHtml(moneda.format(item.monto))}</td>
      </tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>${escaparHtml(datos.titulo)}</title>
  <style>
    body {
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      color: #0f172a;
      margin: 0;
      padding: 24px;
      background: #fff;
    }
    .recibo {
      max-width: 560px;
      margin: 0 auto;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 24px;
    }
    .recibo__cabecera {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #204589;
      padding-bottom: 14px;
      margin-bottom: 18px;
      gap: 12px;
    }
    .recibo__cabecera h1 {
      margin: 0;
      font-size: 1.15rem;
      color: #204589;
    }
    .recibo__cabecera p {
      margin: 4px 0 0;
      font-size: 0.85rem;
      color: #475569;
    }
    .recibo__datos {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px 16px;
      margin-bottom: 18px;
      font-size: 0.9rem;
    }
    .recibo__etiqueta {
      display: block;
      font-size: 0.78rem;
      color: #64748b;
      margin-bottom: 2px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      font-size: 0.92rem;
    }
    th, td {
      padding: 8px 6px;
      border-bottom: 1px solid #e2e8f0;
      text-align: left;
    }
    th {
      color: #475569;
      font-size: 0.82rem;
      text-transform: uppercase;
    }
    .recibo__total {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 1.1rem;
      font-weight: 700;
      color: #204589;
      border-top: 2px solid #cbd5e1;
      padding-top: 12px;
    }
    .recibo__pie {
      margin-top: 20px;
      font-size: 0.8rem;
      color: #64748b;
      text-align: center;
    }
    @media print {
      body { padding: 0; }
      .recibo { border: none; }
    }
  </style>
</head>
<body>
  <article class="recibo">
    <header class="recibo__cabecera">
      <div>
        <h1>${escaparHtml(datos.titulo)}</h1>
        <p>Comprobante interno de pago</p>
      </div>
      <div style="text-align:right;">
        <span class="recibo__etiqueta">N.º Referencia</span>
        <strong>${escaparHtml(datos.referencia.slice(0, 8).toUpperCase())}</strong>
      </div>
    </header>

    <section class="recibo__datos">
      <div>
        <span class="recibo__etiqueta">Titular</span>
        <strong>${escaparHtml(datos.titular)}</strong>
      </div>
      <div>
        <span class="recibo__etiqueta">Fecha de pago</span>
        <strong>${escaparHtml(formatearFechaRecibo(datos.fechaPago))}</strong>
      </div>
      ${
        datos.documento
          ? `<div>
        <span class="recibo__etiqueta">DNI</span>
        <strong>${escaparHtml(datos.documento)}</strong>
      </div>`
          : ""
      }
      <div>
        <span class="recibo__etiqueta">Método de pago</span>
        <strong>${escaparHtml(etiquetaMetodoPago(datos.metodoPago))}</strong>
      </div>
      ${
        datos.codigoOperacion
          ? `<div>
        <span class="recibo__etiqueta">N.º de operación</span>
        <strong>${escaparHtml(datos.codigoOperacion)}</strong>
      </div>`
          : ""
      }
      <div style="grid-column: 1 / -1;">
        <span class="recibo__etiqueta">Concepto</span>
        <strong>${escaparHtml(datos.concepto)}</strong>
      </div>
    </section>

    ${
      filasDetalle
        ? `<table>
      <thead>
        <tr>
          <th>Descripción</th>
          <th style="text-align:right;">Importe</th>
        </tr>
      </thead>
      <tbody>${filasDetalle}</tbody>
    </table>`
        : ""
    }

    <div class="recibo__total">
      <span>Total pagado</span>
      <span>${escaparHtml(moneda.format(datos.total))}</span>
    </div>

    <p class="recibo__pie">Documento generado desde el Sistema de Gestión Escolar.</p>
  </article>
  <script>
    window.addEventListener("load", function () {
      window.focus();
      window.print();
    });
  </script>
</body>
</html>`;

  ventana.document.open();
  ventana.document.write(html);
  ventana.document.close();
  return true;
}
