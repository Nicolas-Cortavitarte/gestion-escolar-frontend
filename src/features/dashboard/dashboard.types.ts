export interface MovimientoFinanciero {
    id: string
    tipo: 'INGRESO' | 'EGRESO'
    monto: number
    fecha: string
}

export interface ResumenFinancieroMes {
  ingresos: number
  egresos: number
}