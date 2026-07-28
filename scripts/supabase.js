// scripts/supabase.js
console.log('🔧 supabase.js cargado')

// Configuración
const SUPABASE_URL = 'https://ibrrrbqundkgokhlvuou.supabase.co'
const SUPABASE_KEY = 'sb_publishable_qmpThkeEu1eckP1_fPv7rQ_HG9qxVD_'

// Función para obtener el cliente de Supabase
export function getSupabase() {
    if (typeof window.supabase === 'undefined') {
        console.error('❌ Supabase no está cargado')
        return null
    }
    
    const { createClient } = window.supabase
    return createClient(SUPABASE_URL, SUPABASE_KEY)
}

// Función para probar la conexión
export const testConnection = async () => {
    try {
        const supabase = getSupabase()
        if (!supabase) return false
        
        const { data, error } = await supabase.auth.getSession()
        if (error) {
            console.error('❌ Error de conexión:', error)
            return false
        }
        console.log('✅ Conexión exitosa a Supabase')
        return true
    } catch (error) {
        console.error('❌ Error:', error)
        return false
    }
}

// Función para obtener la sesión actual
export const getSession = async () => {
    const supabase = getSupabase()
    if (!supabase) return null
    
    const { data, error } = await supabase.auth.getSession()
    if (error) {
        console.error('❌ Error al obtener sesión:', error)
        return null
    }
    return data.session
}

// Función para cerrar sesión
export const logout = async () => {
    const supabase = getSupabase()
    if (!supabase) return false
    
    const { error } = await supabase.auth.signOut()
    if (error) {
        console.error('❌ Error al cerrar sesión:', error)
        return false
    }
    return true
}