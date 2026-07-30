import { getSupabase, getCuentaByUsuario, getMovimientosByUsuario, actualizarUltimoAcceso } from './supabase.js'
 
// Guarda los movimientos ya formateados, indexados por id, para abrir el modal sin volver a pedirlos
let movimientosPorId = {}
 
// Elementos del modal
const modal = document.getElementById("movementModal")
const closeModalButton = document.getElementById("closeModal")
const acceptModalButton = document.getElementById("acceptModal")
const modalType = document.getElementById("modalType")
const modalAmount = document.getElementById("modalAmount")
const modalName = document.getElementById("modalName")
const modalDate = document.getElementById("modalDate")
const modalCategory = document.getElementById("modalCategory")
const modalAccount = document.getElementById("modalAccount")
const modalMessage = document.getElementById("modalMessage")
const modalFolio = document.getElementById("modalFolio")
 
// Formatea el dinero
function formatAmount(amount) {
    return new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN"
    }).format(amount)
}
 
// Abre el modal
function openMovementModal(movement) {
    modalType.textContent = movement.tipo
    modalAmount.textContent = formatAmount(movement.monto)
    modalName.textContent = movement.nombre
    modalDate.textContent = movement.fecha
    modalCategory.textContent = movement.categoria
    modalAccount.textContent = movement.cuenta
    modalMessage.textContent = movement.mensaje
    modalFolio.textContent = movement.folio
    modalAmount.classList.remove("income", "expense")
    if (movement.monto < 0) {
        modalAmount.classList.add("expense")
    } else if (movement.monto > 0) {
        modalAmount.classList.add("income")
    }
    modal.classList.add("active")
    document.body.classList.add("modal-open")
}
 
// Cierra el modal
function closeMovementModal() {
    modal.classList.remove("active")
    document.body.classList.remove("modal-open")
}
 
// Busca los datos del movimiento y abre el modal
function showMovementDetails(element) {
    const movementId = element.dataset.id
    const movement = movimientosPorId[movementId]
    if (!movement) {
        console.error("No se encontraron datos para el movimiento:", movementId)
        return
    }
    openMovementModal(movement)
}
 
// Elige el ícono según el tipo de movimiento
function getIconForMovement(movement) {
    if (movement.monto < 0) return "assets/flat-icons/exchange.png"
    return "assets/flat-icons/deposit.png"
}
 
// Dibuja la lista de movimientos en el DOM a partir de los datos ya formateados
function renderMovements(movimientos) {
    const contenedor = document.getElementById("movements")
    contenedor.innerHTML = ""
 
    if (!movimientos || movimientos.length === 0) {
        contenedor.innerHTML = `<p class="sin-movimientos">Aún no tienes movimientos.</p>`
        return
    }
 
    movimientos.forEach(movement => {
        const article = document.createElement("article")
        article.className = "movement"
        article.dataset.id = movement.id
        article.tabIndex = 0
 
        const claseMonto = movement.monto < 0 ? "expense" : (movement.monto > 0 ? "income" : "")
        const signo = movement.monto < 0 ? "-" : ""
 
        article.innerHTML = `
            <img src="${getIconForMovement(movement)}" alt="${movement.tipo}">
            <div class="movement-info">
                <h2>${movement.tipo}</h2>
                <span>${movement.fechaCorta}</span>
            </div>
            <strong class="${claseMonto}">${signo}${formatAmount(Math.abs(movement.monto))}</strong>
        `
 
        article.addEventListener("click", () => showMovementDetails(article))
        contenedor.appendChild(article)
    })
}
 
// Filtra los movimientos visibles según lo que se escriba en el buscador
function setupSearch(movimientos) {
    const input = document.querySelector(".search input")
    if (!input) return
 
    input.addEventListener("input", () => {
        const texto = input.value.trim().toLowerCase()
        const filtrados = texto
            ? movimientos.filter(m =>
                m.tipo.toLowerCase().includes(texto) ||
                m.nombre.toLowerCase().includes(texto) ||
                m.mensaje.toLowerCase().includes(texto)
              )
            : movimientos
        renderMovements(filtrados)
    })
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
 
    const cuenta = await getCuentaByUsuario(user.id)
    if (!cuenta) {
        document.getElementById("movements").innerHTML =
            `<p class="sin-movimientos">No se encontró una cuenta asociada a tu usuario.</p>`
        return
    }
 
    const movimientos = await getMovimientosByUsuario(user.id)
    movimientosPorId = {}
    movimientos.forEach(m => { movimientosPorId[m.id] = m })
 
    renderMovements(movimientos)
    setupSearch(movimientos)
})
 
// Cierra con la X
closeModalButton.addEventListener("click", closeMovementModal)
// Cierra con el botón
acceptModalButton.addEventListener("click", closeMovementModal)
// Cierra al tocar el fondo
modal.addEventListener("click", (event) => {
    if (event.target === modal) {
        closeMovementModal()
    }
})
// Cierra con Escape
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeMovementModal()
    }
})
 