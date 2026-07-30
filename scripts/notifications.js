import { getSupabase, getMovimientosByUsuario, actualizarUltimoAcceso } from './supabase.js'

let notificacionesPorId = {}

const notificationModal = document.getElementById("notificationModal")
const closeNotificationButton = document.getElementById("closeNotification")
const acceptNotificationButton = document.getElementById("acceptNotification")
const notificationIcon = document.getElementById("notificationIcon")
const notificationIconImage = document.getElementById("notificationIconImage")
const notificationTitle = document.getElementById("notificationTitle")
const notificationMessage = document.getElementById("notificationMessage")
const notificationDate = document.getElementById("notificationDate")
const notificationReference = document.getElementById("notificationReference")

function formatAmount(amount) {
    return new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN"
    }).format(amount)
}

function formatRelativeTime(fecha) {
    const ahora = new Date()
    const diffMin = Math.floor((ahora - fecha) / 60000)

    if (diffMin < 1) return "Justo ahora"
    if (diffMin < 60) return `Hace ${diffMin} minuto${diffMin === 1 ? "" : "s"}`

    const diffHoras = Math.floor(diffMin / 60)
    if (diffHoras < 24) return `Hace ${diffHoras} hora${diffHoras === 1 ? "" : "s"}`

    const diffDias = Math.floor(diffHoras / 24)
    if (diffDias === 1) return "Ayer"
    if (diffDias < 7) return `Hace ${diffDias} días`

    return fecha.toLocaleDateString("es-MX", { day: "2-digit", month: "short" })
}

function crearNotificacion(movimiento) {
    const esEnviada = movimiento.monto < 0
    const monto = formatAmount(Math.abs(movimiento.monto))
    const fecha = movimiento.fechaISO ? new Date(movimiento.fechaISO) : null

    return {
        id: movimiento.id,
        titulo: esEnviada ? "Transferencia realizada" : "Depósito recibido",
        mensaje: esEnviada
            ? `Tu transferencia de ${monto} fue enviada correctamente a ${movimiento.nombre}.`
            : `Se abonaron ${monto} a tu cuenta desde ${movimiento.nombre}.`,
        fecha: fecha ? formatRelativeTime(fecha) : movimiento.fecha,
        referencia: movimiento.folio,
        icono: esEnviada ? "assets/flat-icons/exchange.png" : "assets/flat-icons/deposit.png",
        clase: esEnviada ? "success" : "deposit"
    }
}

function renderNotifications(notificaciones) {
    const contenedor = document.getElementById("notifications")
    contenedor.innerHTML = ""

    if (!notificaciones || notificaciones.length === 0) {
        contenedor.innerHTML = `<p class="sin-notificaciones">Aún no tienes notificaciones.</p>`
        return
    }

    notificaciones.forEach(notificacion => {
        const article = document.createElement("article")
        article.className = "notification"
        article.dataset.id = notificacion.id
        article.tabIndex = 0

        article.innerHTML = `
            <div class="notification-icon ${notificacion.clase}">
                <img src="${notificacion.icono}" alt="${notificacion.titulo}">
            </div>
            <div class="notification-info">
                <h2>${notificacion.titulo}</h2>
                <p>${notificacion.mensaje}</p>
                <span>${notificacion.fecha}</span>
            </div>
        `

        article.addEventListener("click", () => showNotificationDetails(article))
        contenedor.appendChild(article)
    })
}

function openNotificationModal(notificacion) {
    notificationTitle.textContent = notificacion.titulo
    notificationMessage.textContent = notificacion.mensaje
    notificationDate.textContent = notificacion.fecha
    notificationReference.textContent = notificacion.referencia
    notificationIconImage.src = notificacion.icono
    notificationIconImage.alt = notificacion.titulo

    notificationIcon.classList.remove("success", "deposit", "document", "card")
    notificationIcon.classList.add(notificacion.clase)

    notificationModal.classList.add("active")
    document.body.classList.add("notification-open")
}

function closeNotificationModal() {
    notificationModal.classList.remove("active")
    document.body.classList.remove("notification-open")
}

function showNotificationDetails(element) {
    const notificacion = notificacionesPorId[element.dataset.id]
    if (!notificacion) return
    openNotificationModal(notificacion)
}

document.addEventListener("DOMContentLoaded", async () => {
    const supabase = getSupabase()
    if (!supabase) {
        window.location.href = "login.html"
        return
    }

    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
        window.location.href = "login.html"
        return
    }

    await actualizarUltimoAcceso(user.id)

    const movimientos = await getMovimientosByUsuario(user.id)
    const notificaciones = movimientos.map(crearNotificacion)

    notificacionesPorId = {}
    notificaciones.forEach(n => { notificacionesPorId[n.id] = n })

    renderNotifications(notificaciones)
})

closeNotificationButton.addEventListener("click", closeNotificationModal)
acceptNotificationButton.addEventListener("click", closeNotificationModal)
notificationModal.addEventListener("click", (event) => {
    if (event.target === notificationModal) closeNotificationModal()
})
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeNotificationModal()
})