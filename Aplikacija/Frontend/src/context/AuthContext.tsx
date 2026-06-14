import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { jwtDecode } from "jwt-decode";
import { UserRole } from "../types";
import type { AuthUser } from "../types";
import api, { setAccessToken } from "../services/api";

// Struktura jwt
interface JwtPayload {
    nameid: string;
    unique_name: string;
    role: string;
    exp: number;
}

interface AuthContextType {
    user: AuthUser | null;
    login: (authData: { token: string }) => void;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
    isLoading: boolean;
    hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContextInstance = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const decodeAndSetUser = useCallback((token: string) => {
        try {
            const decoded = jwtDecode<JwtPayload>(token);

            let userRole: UserRole = UserRole.Player;
            const backendRole = decoded.role?.toLowerCase() || "";

            if (backendRole === "admin") userRole = UserRole.Admin;
            else if (backendRole === "organizer") userRole = UserRole.Organizer;
            else if (backendRole === "referee") userRole = UserRole.Referee;
            else if (backendRole === "scorer") userRole = UserRole.Scorer;
            else if (backendRole === "captain") userRole = UserRole.Captain;
            else if (backendRole === "player") userRole = UserRole.Player;

            const authUser: AuthUser = {
                id: parseInt(decoded.nameid),
                username: decoded.unique_name,
                role: userRole,
                token,
            };

            setUser(authUser);
            setAccessToken(token);
        } catch (error) {
            console.error("Greška pri dekodiranju tokena:", error);
            setUser(null);
            setAccessToken(null);
        }
    }, []);

    useEffect(() => {
        const silentRefresh = async () => {
            try {
                const response = await api.post("/Auth/Refresh");
                if (response.data?.token) {
                    decodeAndSetUser(response.data.token);
                }
            } catch (err) {
                setUser(null);
                setAccessToken(null);
            } finally {
                setIsLoading(false);
            }
        };

        silentRefresh();
    }, [decodeAndSetUser]);

    function login(authData: { token: string }) {
        if (authData?.token) {
            decodeAndSetUser(authData.token);
        }
    }

    async function logout() {
        try {
            await api.post("/Auth/Logout");
        } catch (err) {
            console.error("Greška pri odjavi:", err);
        } finally {
            setUser(null);
            setAccessToken(null);
        }
    }

    function hasRole(...roles: UserRole[]) {
        if (!user) return false;
        return roles.includes(user.role);
    }

    return (
        <AuthContextInstance.Provider value={{ user, login, logout, isAuthenticated: !!user, isLoading, hasRole }}>
            {children}
        </AuthContextInstance.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContextInstance);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}