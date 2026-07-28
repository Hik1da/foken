// scripts/home.js
import { getSupabase, logout } from './supabase.js'

console.log('🚀 home.js cargado')

// Verificar sesión al cargar
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📄 DOM cargado')
    
    const supabase = getSupabase()
    if (!supabase) {
        alert('❌ Error: Supabase no está cargado')
        window.location.href = 'login.html'
        return
    }
    
    try {
        // Verificar sesión
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error || !user) {
            console.log('🔒 No hay sesión, redirigiendo a login')
            window.location.href = 'login.html'
            return
        }
        
        console.log('✅ Sesión activa:', user.email)
        
        // Mostrar información del usuario
        document.getElementById('userInfo').innerHTML = `
            <div style="padding: 15px; background: #f5f5f5; border-radius: 8px;">
                <p><strong>👤 Usuario:</strong> ${user.email}</p>
                <p><strong>📧 Email confirmado:</strong> ${user.email_confirmed_at ? '✅ Sí' : '❌ No'}</p>
                <p><strong>📅 ID:</strong> ${user.id.substring(0, 8)}...</p>
            </div>
        `
        
        // Configurar botón de cerrar sesión
        document.getElementById('logoutBtn').addEventListener('click', async () => {
            console.log('🔴 Cerrando sesión...')
            const success = await logout()
            if (success) {
                window.location.href = 'login.html'
            } else {
                alert('❌ Error al cerrar sesión')
            }
        })
        
    } catch (error) {
        console.error('❌ Error:', error)
        window.location.href = 'login.html'
    }
})
