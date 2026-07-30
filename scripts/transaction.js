import { getSupabase, getCuentaByUsuario, getTarjetasByUsuario, realizarTransferencia, getContactosByUsuario, guardarContacto, actualizarUltimoAcceso } from './supabase.js'

let cuentaUsuario = null
let idUsuarioActual = null
let tarjetasUsuario = []

function renderizarSelectorTarjetas() {
    const select = document.getElementById('tarjetaOrigen')
    select.innerHTML = '<option value="">Selecciona la tarjeta a usar</option>' +
        tarjetasUsuario.map(t => {
            const tipoDisplay = t.tipo_tarjeta === 'debito' ? 'Débito' : 'Crédito'
            const bloqueada = t.estado === 'bloqueada'
            return `<option value="${t.id_tarjeta}" ${bloqueada ? 'disabled' : ''}>
                ${tipoDisplay} **** ${t.numero_tarjeta.slice(-4)} ${bloqueada ? '(bloqueada)' : ''}
            </option>`
        }).join('')
}

function actualizarDisponibleSegunTarjeta(selectTarjetaOrigen) {
    const idTarjeta = selectTarjetaOrigen.value
    const tarjeta = tarjetasUsuario.find(t => t.id_tarjeta === idTarjeta)
    const spanSaldo = document.getElementById('saldo')

    if (!tarjeta) {
        spanSaldo.textContent = cuentaUsuario.saldo.toFixed(2)
        return
    }

    if (tarjeta.tipo_tarjeta === 'credito') {
        spanSaldo.textContent = (tarjeta.limite_credito || 100000).toFixed(2)
    } else {
        spanSaldo.textContent = cuentaUsuario.saldo.toFixed(2)
    }
}

function renderizarContactos(contactos) {
    const lista = document.getElementById('contactos-list')
    const sinContactos = document.getElementById('sin-contactos')

    if (!contactos || contactos.length === 0) {
        lista.innerHTML = ''
        sinContactos.style.display = 'block'
        return
    }

    sinContactos.style.display = 'none'
    lista.innerHTML = contactos.map(c => `
        <a href="#" class="contacto" data-tarjeta="${c.numero_tarjeta}" data-nombre="${c.nombre_contacto}">
            <img src="assets/flat-icons/user.png">
            <div>
                <h3>${c.nombre_contacto}</h3>
                <p>**** ${c.numero_tarjeta.slice(-4)}</p>
            </div>
        </a>
    `).join('')

    lista.querySelectorAll('.contacto').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault()
            const inputTarjeta = document.getElementById('tarjetaDestino')
            document.getElementById('nombreContacto').value = el.dataset.nombre
            inputTarjeta.value = el.dataset.tarjeta
            inputTarjeta.dispatchEvent(new Event('input'))
            document.getElementById('cantidad').focus()
        })
    })
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
    idUsuarioActual = user.id

    await actualizarUltimoAcceso(user.id)
    cuentaUsuario = await getCuentaByUsuario(user.id)

    if (!cuentaUsuario) {
        alert('No se encontró una cuenta asociada a tu usuario')
        return
    }
    document.getElementById('saldo').textContent = cuentaUsuario.saldo.toFixed(2)

    tarjetasUsuario = await getTarjetasByUsuario(user.id) || []
    renderizarSelectorTarjetas()

    const contactos = await getContactosByUsuario(user.id)
    renderizarContactos(contactos)

    const form = document.getElementById('transferencia-form')
    const selectTarjetaOrigen = document.getElementById('tarjetaOrigen')
    const inputTarjetaDestino = document.getElementById('tarjetaDestino')
    const inputNombreContacto = document.getElementById('nombreContacto')
    const inputCantidad = document.getElementById('cantidad')
    const btnSubmit = form.querySelector('input[type="submit"]')

    function validarFormulario() {
        btnSubmit.disabled = !(
            selectTarjetaOrigen.value.length > 0 &&
            inputTarjetaDestino.value.trim().length > 0 &&
            parseFloat(inputCantidad.value) > 0
        )
    }
    selectTarjetaOrigen.addEventListener('change', () => {
        validarFormulario()
        actualizarDisponibleSegunTarjeta(selectTarjetaOrigen)
    })
    inputTarjetaDestino.addEventListener('input', validarFormulario)
    inputCantidad.addEventListener('input', validarFormulario)

    form.addEventListener('submit', async (e) => {
        e.preventDefault()

        const idTarjetaOrigen = selectTarjetaOrigen.value
        const tarjetaSeleccionada = tarjetasUsuario.find(t => t.id_tarjeta === idTarjetaOrigen)

        if (!tarjetaSeleccionada) {
            alert('Selecciona una tarjeta válida')
            return
        }
        if (tarjetaSeleccionada.estado === 'bloqueada') {
            alert('Esa tarjeta está bloqueada, elige otra')
            return
        }

        const numeroTarjetaDestino = inputTarjetaDestino.value.trim()
        const nombreContacto = inputNombreContacto.value.trim()
        const monto = parseFloat(inputCantidad.value)

        if (!monto || monto <= 0) {
            alert('Ingresa un monto válido')
            return
        }

        const limiteDisponible = tarjetaSeleccionada.tipo_tarjeta === 'credito'
            ? (tarjetaSeleccionada.limite_credito || 100000)
            : cuentaUsuario.saldo

        if (monto > limiteDisponible) {
            alert('No tienes fondos suficientes')
            return
        }

        btnSubmit.disabled = true
        btnSubmit.value = 'Procesando...'

        const resultado = await realizarTransferencia(
            cuentaUsuario.id_cuenta,
            idTarjetaOrigen,
            numeroTarjetaDestino,
            monto,
            'Transferencia'
        )

        if (!resultado.exito) {
            alert('No se pudo completar la transferencia: ' + resultado.error)
            btnSubmit.disabled = false
            btnSubmit.value = 'Transferir con cuenta'
            return
        }

        if (nombreContacto) {
            await guardarContacto(idUsuarioActual, nombreContacto, numeroTarjetaDestino)
            const contactosActualizados = await getContactosByUsuario(idUsuarioActual)
            renderizarContactos(contactosActualizados)
        }

        cuentaUsuario.saldo = resultado.saldo_restante
        actualizarDisponibleSegunTarjeta(selectTarjetaOrigen)

        alert('Transferencia realizada con éxito')

        form.reset()
        renderizarSelectorTarjetas()
        btnSubmit.disabled = true
        btnSubmit.value = 'Transferir con cuenta'
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