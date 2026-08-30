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
import { MOCK_AUTH_TOKEN, mockAuthUser } from "../mocks/data"
import { isMockMode, clearClientAuthState } from "../utils/authStorage"
import { fetchSessionUser, endSession } from "../hooks/useSessionApi"

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) =>
{
    const [user,    setUser]    = useState<User | null>(null)
    const [token,   setToken]   = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() =>
    {
        if (isMockMode)
        {
            localStorage.setItem("authToken_v2", MOCK_AUTH_TOKEN)
            localStorage.setItem("currentUser", JSON.stringify(mockAuthUser))
            setToken(MOCK_AUTH_TOKEN)
            setUser(mockAuthUser)
            setLoading(false)
            return
        }

        void (async () =>
        {
            try
            {
                const sessionUser = await fetchSessionUser()

                if (!sessionUser)
                {
                    clearClientAuthState()
                    setToken(null)
                    setUser(null)
                    return
                }

                localStorage.setItem("currentUser", JSON.stringify(sessionUser))
                setUser(sessionUser)
                setToken(null)
            }
            catch
            {
                clearClientAuthState()
                setToken(null)
                setUser(null)
            }
            finally
            {
                setLoading(false)
            }
        })()
    }, [])

    const login = (newUser: User, mockToken?: string) =>
    {
        localStorage.setItem("currentUser", JSON.stringify(newUser))
        setUser(newUser)

        if (isMockMode && mockToken) {
            localStorage.setItem("authToken_v2", mockToken)
            setToken(mockToken)
            return
        }

        setToken(null)
    }

    const logout = () =>
    {
        void endSession().finally(() =>
        {
            clearClientAuthState()
            setToken(null)
            setUser(null)
        })
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                login,
                logout,
                isAuthenticated: !!user,
                loading
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth(): AuthContextType
{
    const context = useContext(AuthContext)
    if (!context)
    {
        throw new Error("useAuth must be used within AuthProvider")
    }
    return context
}
