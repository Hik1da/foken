import { getSupabase, getCuentaByUsuario, getTarjetasByUsuario, realizarConversionCreditoADebito, actualizarUltimoAcceso } from './supabase.js'

let cuentaUsuario = null
let tarjetaCredito = null

const saldoDebito = document.getElementById('saldoDebito')
const saldoCredito = document.getElementById('saldoCredito')
const saldoCreditoForm = document.getElementById('saldoCreditoForm')
const form = document.getElementById('transferencia-form')
const inputCantidad = document.getElementById('cantidad')
const btnSubmit = form.querySelector('input[type="submit"]')

function creditoDisponible() {
    if (!tarjetaCredito) return 0
    const limite = Number(tarjetaCredito.limite_credito) || 100000
    const usado = Number(tarjetaCredito.credito_usado) || 0
    return limite - usado
}

function actualizarSaldosEnPantalla() {
    saldoDebito.textContent = cuentaUsuario.saldo.toFixed(2)
    const disponible = creditoDisponible()
    saldoCredito.textContent = disponible.toFixed(2)
    saldoCreditoForm.textContent = disponible.toFixed(2)
}

function validarFormulario() {
    const monto = parseFloat(inputCantidad.value)
    const hayTarjeta = tarjetaCredito && tarjetaCredito.estado !== 'bloqueada'
    btnSubmit.disabled = !(hayTarjeta && monto > 0 && monto <= creditoDisponible())
}

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
    if (!cuentaUsuario) {
        alert('No se encontró una cuenta asociada a tu usuario')
        return
    }

    const tarjetas = await getTarjetasByUsuario(user.id) || []
    tarjetaCredito = tarjetas.find(t => t.tipo_tarjeta === 'credito') || null

    actualizarSaldosEnPantalla()

    inputCantidad.addEventListener('input', validarFormulario)

    form.addEventListener('submit', async (e) => {
        e.preventDefault()

        if (!tarjetaCredito) {
            alert('No se encontró tu tarjeta de crédito')
            return
        }

        const monto = parseFloat(inputCantidad.value)
        if (!monto || monto <= 0) {
            alert('Ingresa un monto válido')
            return
        }
        if (monto > creditoDisponible()) {
            alert('No tienes crédito disponible suficiente')
            return
        }

        btnSubmit.disabled = true
        btnSubmit.value = 'Procesando...'

        const resultado = await realizarConversionCreditoADebito(
            cuentaUsuario.id_cuenta,
            tarjetaCredito.id_tarjeta,
            monto
        )

        if (!resultado.exito) {
            alert('No se pudo completar la conversión: ' + resultado.error)
            btnSubmit.value = 'Depositar a cuenta'
            validarFormulario()
            return
        }

        cuentaUsuario.saldo = resultado.saldo_nuevo
        tarjetaCredito.credito_usado = (Number(tarjetaCredito.credito_usado) || 0) + monto
        actualizarSaldosEnPantalla()

        if (resultado.movimiento_registrado === false) {
            alert(
                'Se actualizó tu saldo y tu crédito, pero no se pudo registrar el movimiento.\n\n' +
                'Error: ' + resultado.movimiento_error
            )
        } else {
            alert('Convertiste ' + monto.toFixed(2) + ' de tu crédito a tu saldo de débito')
        }

        form.reset()
        btnSubmit.value = 'Depositar a cuenta'
        btnSubmit.disabled = true
    })
})