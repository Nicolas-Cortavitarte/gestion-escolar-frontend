import type { ResumenFinancieroMes } from '../dashboard.types'
import './ComparacionFinanciera.css'

interface ComparacionFinancieraProps {
  resumen: ResumenFinancieroMes
}

const formatoSoles = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
})

export function ComparacionFinanciera({ resumen }: ComparacionFinancieraProps) {
  const mayorMonto = Math.max(resumen.ingresos, resumen.egresos)

  const porcentajeIngresos =
    mayorMonto === 0 ? 0 : (resumen.ingresos / mayorMonto) * 100

  const porcentajeEgresos =
    mayorMonto === 0 ? 0 : (resumen.egresos / mayorMonto) * 100

  return (
    <section className="comparacion-financiera" aria-labelledby="comparacion-titulo">
      <h2 id="comparacion-titulo">Ingresos vs. egresos</h2>
      <p>Resumen del mes actual</p>

      <div className="comparacion-financiera__fila">
        <span>Ingresos</span>
        <div className="comparacion-financiera__pista">
          <div
            className="comparacion-financiera__barra comparacion-financiera__barra--ingresos"
            style={{ width: `${porcentajeIngresos}%` }}
          />
        </div>
        <strong>{formatoSoles.format(resumen.ingresos)}</strong>
      </div>

      <div className="comparacion-financiera__fila">
        <span>Egresos</span>
        <div className="comparacion-financiera__pista">
          <div
            className="comparacion-financiera__barra comparacion-financiera__barra--egresos"
            style={{ width: `${porcentajeEgresos}%` }}
          />
        </div>
        <strong>{formatoSoles.format(resumen.egresos)}</strong>
      </div>
    </section>
  )
}