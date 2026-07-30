import { getSupabase, getTarjetaDebitoByUsuario, getCuentaCompleta, getUsuarioCompleto, actualizarUltimoAcceso, realizarDeposito } from './supabase.js'

console.log('deposit.js cargado')

let cuentaUsuario = null
let tarjetaDebito = null
let usuarioActual = null

const popup = document.getElementById("popup")
const clabeElement = document.getElementById("CLABE")
const userNombre = document.getElementById("user")
const saldoElement = document.getElementById("saldo")

function showPopup(evt) {
    popup.style.left = (evt.pageX + 8) + 'px'
    popup.style.top = (evt.pageY - 36) + 'px'
    popup.style.opacity = 1
}

function hidePopup() {
    popup.style.opacity = 0
}

function copyInputField() {
    const textToCopy = clabeElement.innerText
    if (textToCopy && textToCopy !== 'Cargando...' && textToCopy !== 'No disponible') {
        navigator.clipboard.writeText(textToCopy)
        showPopupWithMessage('Número copiado al portapapeles!')
    } else {
        alert('No hay información disponible para copiar')
    }
}

function showPopupWithMessage(mensaje) {
    popup.textContent = mensaje
    popup.style.opacity = 1
    setTimeout(() => {
        popup.style.opacity = 0
    }, 2000)
}

function toggleDepositSection() {
    const container = document.getElementById("deposit-container")
    if (container.style.display === "block") {
        container.style.display = "none"
    } else {
        container.style.display = "block"
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const btnCopiarClabe = document.getElementById('clabe-copy')
    if (btnCopiarClabe) {
        btnCopiarClabe.addEventListener('click', (e) => {
            copyInputField()
            showPopup(e)
        })
        btnCopiarClabe.addEventListener('mouseleave', hidePopup)
    }

    const btnDepositar = document.getElementById('btn-depositar')
    if (btnDepositar) {
        btnDepositar.addEventListener('click', toggleDepositSection)
    }

    const form = document.getElementById('transferencia-form')
    const inputCantidad = document.getElementById('cantidad')
    const btnSubmit = form?.querySelector('input[type="submit"]')
    const valorOriginalBoton = btnSubmit?.value || 'Depositar a cuenta'

    if (inputCantidad) {
        inputCantidad.addEventListener('input', () => {
            if (btnSubmit) {
                btnSubmit.disabled = !(parseFloat(inputCantidad.value) > 0)
            }
        })
    }

    if (form && btnSubmit) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault()

            const monto = parseFloat(inputCantidad?.value)
            if (!monto || monto <= 0) {
                alert('Ingresa un monto válido')
                return
            }
            if (!cuentaUsuario) {
                alert('No se encontró tu cuenta, recarga la página')
                return
            }

            btnSubmit.disabled = true
            btnSubmit.value = 'Procesando...'

            try {
                const resultado = await realizarDeposito(cuentaUsuario.id_cuenta, monto)

                if (!resultado.exito) {
                    alert('No se pudo completar el depósito: ' + resultado.error)
                    btnSubmit.disabled = false
                    btnSubmit.value = valorOriginalBoton
                    return
                }

                cuentaUsuario.saldo = resultado.saldo_nuevo
                if (saldoElement) {
                    saldoElement.textContent = resultado.saldo_nuevo.toFixed(2)
                }

                alert('Depósito realizado con éxito')
                form.reset()
                btnSubmit.disabled = true
                btnSubmit.value = valorOriginalBoton

            } catch (error) {
                alert('Error: ' + error.message)
                btnSubmit.disabled = false
                btnSubmit.value = valorOriginalBoton
            }
        })
    }

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

        usuarioActual = user
        console.log('Sesión activa:', user.email)

        await actualizarUltimoAcceso(user.id)

        const usuario = await getUsuarioCompleto(user.id)
        console.log('Usuario:', usuario)

        cuentaUsuario = await getCuentaCompleta(user.id)
        console.log('Cuenta:', cuentaUsuario)

        tarjetaDebito = await getTarjetaDebitoByUsuario(user.id)
        console.log('Tarjeta débito:', tarjetaDebito)

        if (userNombre) {
            const nombre = usuario?.nombre_completo || 
                          usuarioActual?.user_metadata?.nombre_completo || 
                          user.email.split('@')[0] || 
                          'Usuario'
            userNombre.textContent = nombre
        }

        if (clabeElement) {
            if (tarjetaDebito && tarjetaDebito.numero_tarjeta) {
                clabeElement.textContent = tarjetaDebito.numero_tarjeta
                console.log('Número de tarjeta:', tarjetaDebito.numero_tarjeta)
            } else {
                clabeElement.textContent = 'No disponible'
                console.warn('No se encontró tarjeta de débito')
            }
        }

        if (saldoElement && cuentaUsuario) {
            saldoElement.textContent = cuentaUsuario.saldo.toFixed(2)
        }

        if (tarjetaDebito && tarjetaDebito.numero_tarjeta) {
            console.log('Tarjeta: **** **** **** ' + tarjetaDebito.numero_tarjeta.slice(-4))
        }

    } catch (error) {
        console.error('Error al cargar datos:', error)
        alert('Error al cargar los datos de tu cuenta')
    }
})