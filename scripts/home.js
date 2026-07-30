import { getSupabase, getSaldosByUsuario, getUsuarioById, getMovimientosByUsuario, getTarjetasByUsuario, actualizarUltimoAcceso, logout } from './supabase.js'

console.log('home.js cargado')

function calcularCreditoDisponible(tarjetasUsuario) {
    const tarjetaCredito = tarjetasUsuario.find(t => t.tipo_tarjeta === 'credito')
    if (!tarjetaCredito) return 0

    const limite = tarjetaCredito.limite_credito || 100000
    const usado = tarjetaCredito.credito_usado || 0
    return limite - usado
}

document.addEventListener('DOMContentLoaded', async () => {
    const supabase = getSupabase()
    if (!supabase) {
        window.location.href = 'login.html'
        return
    }
    try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error || !user) {
            window.location.href = 'login.html'
            return
        }
        console.log('Sesión activa:', user.email)
        await actualizarUltimoAcceso(user.id)
        const usuario = await getUsuarioById(user.id)
        console.log('Usuario:', usuario)
        const saldos = await getSaldosByUsuario(user.id)
        console.log('Saldos obtenidos:', saldos)

        const tarjetasUsuario = await getTarjetasByUsuario(user.id) || []
        const creditoDisponible = calcularCreditoDisponible(tarjetasUsuario)
        console.log('Crédito disponible calculado:', creditoDisponible)

        const saldoDebito = document.getElementById('saldoDebito')
        if (saldoDebito) {
            saldoDebito.textContent = saldos.debito.toFixed(2)
            console.log('Débito actualizado:', saldos.debito)
        } else {
            console.warn('No se encontró el elemento saldoDebito')
        }
        const saldoCredito = document.getElementById('saldoCredito')
        if (saldoCredito) {
            saldoCredito.textContent = creditoDisponible.toFixed(2)
            console.log('Crédito actualizado:', creditoDisponible)
        } else {
            console.warn('No se encontró el elemento saldoCredito')
        }
        const userIcon = document.querySelector('header a#user img')
        if (userIcon && usuario) {
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
        const movimientosList = document.getElementById('movimientosList')
        if (movimientosList) {
            const movimientos = await getMovimientosByUsuario(user.id)
            const ultimo = movimientos && movimientos.length > 0 ? movimientos[0] : null

            let segundoBloque
            if (ultimo) {
                const esGasto = ultimo.monto < 0
                const icono = esGasto ? 'exchange.png' : 'deposit.png'
                const signo = esGasto ? '-' : '+'
                const montoTexto = `${signo}$${Math.abs(ultimo.monto).toFixed(2)}`
                const colorTexto = esGasto ? '#c0392b' : 'green'
                const colorFondo = esGasto ? '#fdecea' : '#e6f7e6'
                segundoBloque = `
                <a href="movements.html" class="movimiento">
                    <img src="assets/flat-icons/${icono}">
                    <div>
                        <h2>${ultimo.tipo}</h2>
                        <span>${ultimo.fechaCorta}</span>
                        <span style="color: ${colorTexto}; background: ${colorFondo}; padding: 3px 9px; border-radius: 12px;">${montoTexto}</span>
                    </div>
                </a>
                `
            } else {
                segundoBloque = `
                <a href="#" class="movimiento" style="opacity: 0.6;">
                    <img src="assets/flat-icons/document.png">
                    <div>
                        <h2>Esperando movimientos</h2>
                        <span>${new Date().toLocaleDateString()}</span>
                        <span style="color: #666; background: #f0f0f0; padding: 3px 9px; border-radius: 12px;">Sin movimientos</span>
                    </div>
                </a>
                `
            }

            movimientosList.innerHTML = `
                <a href="#" class="movimiento">
                    <img src="assets/flat-icons/exchange.png">
                    <div>
                        <h2>Bienvenido ${usuario.nombre_completo}</h2>
                        <span>${new Date().toLocaleDateString()}</span>
                        <span style="color: green; background: #e6f7e6; padding: 3px 9px; border-radius: 12px;">Activo</span>
                    </div>
                </a>
                ${segundoBloque}
            `
        }
        const userLink = document.querySelector('header a#user');
        if (userLink) {
            userLink.addEventListener('click', async (e) => {
                e.preventDefault();
                if (confirm('¿Deseas cerrar sesión?')) {
                    await logout();
                    window.location.href = 'login.html';
                }
            });
        }
    } catch (error) {
        console.error('Error:', error)
        window.location.href = 'login.html'
    }
})