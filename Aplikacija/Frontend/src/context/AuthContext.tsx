import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { jwtDecode } from "jwt-decode";
import { UserRole } from "../types";
import type { AuthUser } from "../types";

// Struktura jwt
interface JwtPayload {
    nameid: string;
    unique_name: string;
    role: string;
    exp: number;
}

interface AuthContextType {
    user: AuthUser | null;
    login: (authData: string | { token: string } | any) => void;
    logout: () => void;
    isAuthenticated: boolean;
    hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContextInstance = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);

    // Na pokretanju ili kad se uradi refresh
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) trySetUser(token);
    }, []);

    function trySetUser(token: string) {
        try {
            const decoded = jwtDecode<JwtPayload>(token);

            // Provera da li je token istekao, treba da se podesi jos uvek tacno vreme trajanja
            if (decoded.exp * 1000 < Date.now()) {
                localStorage.removeItem("token");
                setUser(null);
                return;
            }

            // Mapiranje
            let userRole: UserRole = UserRole.Guest;
            const backendRole = decoded.role?.toLowerCase() || "";

            if (backendRole === "admin") userRole = UserRole.Admin;
            else if (backendRole === "organizer") userRole = UserRole.Organizer;
            else if (backendRole === "referee") userRole = UserRole.Referee;
            else if (backendRole === "scorer") userRole = UserRole.Scorer;
            else if (backendRole === "captain") userRole = UserRole.Captain;
            else if (backendRole === "player") userRole = UserRole.Player;

            setUser({
                id: parseInt(decoded.nameid),
                username: decoded.unique_name,
                role: userRole,
                token,
            });
        } catch (error) {
            // Ako je token izmenjen ili nevalidan, brišemo sve
            localStorage.removeItem("token");
            setUser(null);
        }
    }

    function login(authData: string | { token: string } | any) {
        let tokenStr = "";

        if (typeof authData === "string") {
            tokenStr = authData;
        } else if (authData && typeof authData === "object" && authData.token) {
            tokenStr = authData.token;
        } else if (authData && typeof authData === "object" && typeof authData.data === "string") {
            tokenStr = authData.data; // Za svaki slucaj ako Axios prosledi ceo response objekat
        } else {
            console.error("Nevalidan format tokena prosleđen u login funkciju:", authData);
            return;
        }

        localStorage.setItem("token", tokenStr);
        trySetUser(tokenStr);
    }

    // Odjava korisnika
    function logout() {
        localStorage.removeItem("token");
        setUser(null);
    }

    // Provera prava pristupa na osnovu uloga
    function hasRole(...roles: UserRole[]) {
        if (!user) return false;
        return roles.includes(user.role);
    }

    return (
        <AuthContextInstance.Provider value={{ user, login, logout, isAuthenticated: !!user, hasRole }}>
            {children}
        </AuthContextInstance.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContextInstance);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}