// src/context/AuthContext.tsx

import React
from "react"
import {
    createContext,
    useContext,
    useState,
    useEffect
} from "react"
import type {
    User,
    AuthContextType
} from "../types/interfaces"

// create the AuthContext with an undefined default
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// provider component that wraps your app and makes auth available
export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) =>
{
    // state for user object and token
    const [user,    setUser]    = useState<User | null>(null)
    const [token,   setToken]   = useState<string | null>(null)
    // track whether we've initialized from storage
    const [loading, setLoading] = useState(true)

    // on mount, read from localStorage
    useEffect(() =>
    {
        const storedToken = localStorage.getItem("authToken")
        const storedUser  = localStorage.getItem("currentUser")

        if (storedToken && storedUser)
        {
            setToken(storedToken)

            try
            {
                setUser(JSON.parse(storedUser))
            }
            catch
            {
                // invalid JSON, remove stored user
                localStorage.removeItem("currentUser")
            }
        }
        // mark init complete
        setLoading(false)
    }, [])

    // login method: save token & user to state and storage
    const login = (newToken: string, newUser: User) =>
    {
        localStorage.setItem("authToken", newToken)
        localStorage.setItem("currentUser", JSON.stringify(newUser))
        setToken(newToken)
        setUser(newUser)
    }

    // logout method: clear storage & state
    const logout = () =>
    {
        localStorage.removeItem("authToken")
        localStorage.removeItem("currentUser")
        setToken(null)
        setUser(null)
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                login,
                logout,
                isAuthenticated: !!token,
                loading
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

// custom hook to use auth context
export function useAuth(): AuthContextType
{
    const context = useContext(AuthContext)
    if (!context)
    {
        throw new Error("useAuth must be used within AuthProvider")
    }
    return context
}
