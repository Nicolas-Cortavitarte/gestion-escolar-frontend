import type { LoginRequest, LoginResponse } from "./auth.types";

const API_URL = import.meta.env.VITE_API_URL;

export async function iniciarSesion (credenciales: LoginRequest): Promise<LoginResponse> {
    const respuesta = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(credenciales),
    })

    if (respuesta.status === 401) {
        throw new Error('Correo o contraseña incorrectos. Intente de nuevo. ') 
    } 

    if (!respuesta.ok) {
        throw new Error('Ocurrió un error al iniciar sesión. Intente de nuevo. ') 
    } 

    return (await respuesta.json()) as LoginResponse; 
} 