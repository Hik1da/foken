import { getSupabase, getCuentaByUsuario, actualizarUltimoAcceso, realizarDeposito } from './supabase.js'

let cuentaUsuario = null

const popup = document.getElementById("popup")

function showPopup(evt) {
    popup.style.left = (evt.pageX + 8) + 'px'
    popup.style.top = (evt.pageY - 36) + 'px'
    popup.style.opacity = 1
}

function hidePopup() {
    popup.style.opacity = 0
}

function copyInputField() {
    const textToCopy = document.getElementById("CLABE").innerText
    navigator.clipboard.writeText(textToCopy)
}

function toggleDepositSection() {
    document.getElementById("deposit-container").style.display = "block"
}

document.addEventListener('DOMContentLoaded', async () => {
    // Enganchamos los botones de la UI primero, para que funcionen
    // sin importar lo que pase con la carga de datos de la cuenta.
    const btnCopiarClabe = document.getElementById('clabe-copy')
    btnCopiarClabe.addEventListener('click', (e) => {
        copyInputField()
        showPopup(e)
    })
    btnCopiarClabe.addEventListener('mouseleave', hidePopup)

    document.getElementById('btn-depositar').addEventListener('click', toggleDepositSection)

    const form = document.getElementById('transferencia-form')
    const inputCantidad = document.getElementById('cantidad')
    const spanSaldo = document.getElementById('saldo')
    const btnSubmit = form.querySelector('input[type="submit"]')
    const valorOriginalBoton = btnSubmit.value

    function validarFormulario() {
        btnSubmit.disabled = !(parseFloat(inputCantidad.value) > 0)
    }
    inputCantidad.addEventListener('input', validarFormulario)

    form.addEventListener('submit', async (e) => {
        e.preventDefault()

        const monto = parseFloat(inputCantidad.value)
        if (!monto || monto <= 0) {
            alert('Ingresa un monto válido')
            return
        }
        if (!cuentaUsuario) {
            alert('No se encontró tu cuenta, recarga la página e intenta de nuevo')
            return
        }

        btnSubmit.disabled = true
        btnSubmit.value = 'Procesando...'

        const resultado = await realizarDeposito(cuentaUsuario.id_cuenta, monto)

        if (!resultado.exito) {
            alert('No se pudo completar el depósito: ' + resultado.error)
            btnSubmit.disabled = false
            btnSubmit.value = valorOriginalBoton
            return
        }

        cuentaUsuario.saldo = resultado.saldo_nuevo
        spanSaldo.textContent = cuentaUsuario.saldo.toFixed(2)

        alert('Depósito realizado con éxito')

        form.reset()
        btnSubmit.disabled = true
        btnSubmit.value = valorOriginalBoton
    })

    // Carga de sesión y datos de cuenta
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

    spanSaldo.textContent = cuentaUsuario.saldo.toFixed(2)
})