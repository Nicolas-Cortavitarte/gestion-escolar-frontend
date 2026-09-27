export type RolUsuario = 'ADMIN' | 'DOCENTE'

export interface LoginRequest {
    correo: string
    contrasena: string
}

export interface LoginResponse {
    token: string
    correo: string
    rol: RolUsuario   
}