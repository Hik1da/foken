// scripts/home.js
import { getSupabase, logout, getUsuarioById, getTarjetasByUsuario, getSaldo, actualizarUltimoAcceso } from './supabase.js'

console.log('home.js cargado')

document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM cargado')
    
    const supabase = getSupabase()
    if (!supabase) {
        window.location.href = 'login.html'
        return
    }
    
    try {
        // Verificar sesión
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error || !user) {
            window.location.href = 'login.html'
            return
        }
        
        console.log('Sesión activa:', user.email)
        
        // Actualizar último acceso
        await actualizarUltimoAcceso(user.id)
        
        // Obtener datos del usuario
        const usuario = await getUsuarioById(user.id)
        console.log('Usuario:', usuario)
        
        // Obtener tarjetas
        const tarjetas = await getTarjetasByUsuario(user.id)
        console.log('Tarjetas:', tarjetas)
        
        // Obtener saldo
        const saldo = await getSaldo(user.id)
        console.log('Saldo:', saldo)
        
        // Actualizar saldo en la interfaz
        const saldoElement = document.getElementById('saldo')
        if (saldoElement) {
            saldoElement.textContent = saldo.toFixed(2)
        }
        
        // Actualizar el nombre del usuario en el header (icono)
        const userIcon = document.querySelector('header a#user img')
        if (userIcon && usuario) {
            // Crear avatar con iniciales
            const canvas = document.createElement('canvas')
            canvas.width = 32
            canvas.height = 32
            const ctx = canvas.getContext('2d')
            
            ctx.beginPath()
            ctx.arc(16, 16, 16, 0, Math.PI * 2)
            ctx.fillStyle = '#4A90D9'
            ctx.fill()
            
            ctx.fillStyle = '#FFFFFF'
            ctx.font = 'bold 14px Arial'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            const iniciales = (usuario.nombre_completo || 'U')
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)
            ctx.fillText(iniciales || 'U', 16, 17)
            
            userIcon.src = canvas.toDataURL()
        }
        
        // Si hay tarjetas, mostrar información en la interfaz
        if (tarjetas && tarjetas.length > 0) {
            const tarjetaDebito = tarjetas.find(t => t.tipo_tarjeta === 'debito')
            const tarjetaCredito = tarjetas.find(t => t.tipo_tarjeta === 'credito')
            
            // Actualizar estado de tarjeta si existe el elemento
            const estadoTarjeta = document.getElementById('estadoTarjeta')
            if (estadoTarjeta && tarjetaDebito) {
                estadoTarjeta.textContent = tarjetaDebito.estado === 'activa' ? 'Activa' : 'Bloqueada'
                estadoTarjeta.className = `status-badge ${tarjetaDebito.estado === 'activa' ? 'activa' : 'bloqueada'}`
            }
        }
        
        // Cerrar sesión (al hacer clic en el icono de usuario del footer)
        const footerUserLink = document.querySelector('footer a:last-child')
        if (footerUserLink) {
            footerUserLink.addEventListener('click', async (e) => {
                e.preventDefault()
                if (confirm('¿Deseas cerrar sesión?')) {
                    await logout()
                    window.location.href = 'login.html'
                }
            })
        }
        
    } catch (error) {
        console.error('Error:', error)
        window.location.href = 'login.html'
    }
})