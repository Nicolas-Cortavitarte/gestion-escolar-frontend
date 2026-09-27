import { Navigate, Route, Routes } from "react-router";
import { LoginPage } from "../../features/auth/pages/LoginPage";
import type { LoginResponse } from "../../features/auth/auth.types";
import { AdminLayout } from "../../layouts/admin/AdminLayout";
import { AdminDashboardPage } from "../../features/dashboard/pages/AdminDashboardPage";

interface AppRoutesProps {
    sesion: LoginResponse | null
    onLogin: (sesion: LoginResponse) => void
    onLogout: () => void
}

export function AppRoutes({ sesion, onLogin, onLogout }: AppRoutesProps) {
    const rutaDelRol = sesion?.rol === 'ADMIN' ? '/admin' : '/docente'

    return (
        <Routes>
            <Route path="/login" element={sesion ? <Navigate to={rutaDelRol} replace /> : <LoginPage onLogin={onLogin}/>} />

            <Route path="/admin" element={sesion?.rol === 'ADMIN' ? (
                <AdminLayout onLogout={onLogout}>
                    <AdminDashboardPage token={sesion.token} />
                </AdminLayout>
            ) : (
                <Navigate to={sesion ? rutaDelRol : '/login'} replace />
            )} />

            <Route path="/docente" element={sesion?.rol === 'DOCENTE' ? (
                <main>
                    <h1>Panel del docente</h1>
                    <button type="button" onClick={onLogout}>
                        Cerrar sesión
                    </button>
                </main>
            ) : (
                <Navigate to={sesion ? rutaDelRol : '/login'} replace />
            )} />

            <Route path="*" element={<Navigate to={sesion ? rutaDelRol : '/login'} replace />} />
        </Routes>
    );
}