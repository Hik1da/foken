import { getSupabase, getCuentaByUsuario, realizarTransferencia, actualizarUltimoAcceso } from './supabase.js'

let cuentaUsuario = null

document.addEventListener('DOMContentLoaded', async () => {
    const supabase = getSupabase()
    if (!supabase) {
        window.location.href = 'login.html'
        return
    }

    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
        window.location.href = 'login.html'
        return
    }

    await actualizarUltimoAcceso(user.id)
    cuentaUsuario = await getCuentaByUsuario(user.id)

    if (cuentaUsuario) {
        document.getElementById('saldo').textContent = cuentaUsuario.saldo.toFixed(2)
    } else {
        alert('No se encontró una cuenta asociada a tu usuario')
        return
    }

    const form = document.getElementById('transferencia-form')
    const inputTarjetaDestino = document.getElementById('tarjetaDestino')
    const inputCantidad = document.getElementById('cantidad')
    const btnSubmit = form.querySelector('input[type="submit"]')

    function validarFormulario() {
        btnSubmit.disabled = !(inputTarjetaDestino.value.trim().length > 0 && parseFloat(inputCantidad.value) > 0)
    }
    inputTarjetaDestino.addEventListener('input', validarFormulario)
    inputCantidad.addEventListener('input', validarFormulario)

    form.addEventListener('submit', async (e) => {
        e.preventDefault()

        const numeroTarjetaDestino = inputTarjetaDestino.value.trim()
        const monto = parseFloat(inputCantidad.value)

        if (!monto || monto <= 0) {
            alert('Ingresa un monto válido')
            return
        }
        if (monto > cuentaUsuario.saldo) {
            alert('No tienes fondos suficientes')
            return
        }

        btnSubmit.disabled = true
        btnSubmit.value = 'Procesando...'

        const resultado = await realizarTransferencia(cuentaUsuario.id_cuenta, numeroTarjetaDestino, monto, 'Transferencia')

        if (!resultado.exito) {
            alert('No se pudo completar la transferencia: ' + resultado.error)
            btnSubmit.disabled = false
            btnSubmit.value = 'Transferir con cuenta'
            return
        }

        alert('Transferencia realizada con éxito')
        window.location.href = 'home.html'
    })

    const logoutFooter = document.getElementById('logoutFooter')
    if (logoutFooter) {
        logoutFooter.addEventListener('click', async (e) => {
            e.preventDefault()
            if (confirm('¿Deseas cerrar sesión?')) {
                const { logout } = await import('./supabase.js')
                await logout()
                window.location.href = 'login.html'
            }
        })
    }
})