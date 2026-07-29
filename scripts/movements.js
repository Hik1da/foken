// Obtiene los datos del movimiento
function getMovement(id){
    switch(id){
        case 1:
            return {
                tipo: "Transferencia enviada",
                nombre: "Sebastián Emiliano Campos Orozco",
                monto: -520,
                fecha: "14 Jul 2026, 8:20 p. m.",
                categoria: "Transferencia enviada",
                cuenta: "6616 1000 / 1848 3864",
                mensaje: "Pago de servicio",
                folio: "FKN-4C2BA60F"
            };
        case 2:
            return {
                tipo: "Depósito recibido",
                nombre: "Juan Ángel Rivera Ramírez",
                monto: 1250,
                fecha: "13 Jul 2026, 11:45 a. m.",
                categoria: "Transferencia recibida",
                cuenta: "6461 2000 / 2240 5431",
                mensaje: "Depósito recibido",
                folio: "FKN-DEP-125478"
            };
        case 3:
            return {
                tipo: "Pago Netflix",
                nombre: "Netflix",
                monto: -219,
                fecha: "12 Jul 2026, 7:30 p. m.",
                categoria: "Entretenimiento",
                cuenta: "Tarjeta terminación 3864",
                mensaje: "Suscripción mensual",
                folio: "FKN-NET-219001"
            };
        case 4:
            return {
                tipo: "Estado de cuenta",
                nombre: "Foken",
                monto: 0,
                fecha: "10 Jul 2026, 9:00 a. m.",
                categoria: "Documento",
                cuenta: "Cuenta Foken",
                mensaje: "Estado de cuenta generado",
                folio: "FKN-DOC-100726"
            };
        case 5:
            return {
                tipo: "Estado de cuenta",
                nombre: "Foken",
                monto: 0,
                fecha: "10 Jul 2026, 10:15 a. m.",
                categoria: "Documento",
                cuenta: "Cuenta Foken",
                mensaje: "Consulta de estado de cuenta",
                folio: "FKN-DOC-100727"
            };
        case 6:
            return {
                tipo: "Depósito recibido",
                nombre: "María López",
                monto: 990,
                fecha: "10 Jul 2026, 12:30 p. m.",
                categoria: "Transferencia recibida",
                cuenta: "Cuenta terminación 3864",
                mensaje: "Pago pendiente",
                folio: "FKN-DEP-990001"
            };
        case 7:
            return {
                tipo: "Depósito recibido",
                nombre: "Carlos Hernández",
                monto: 100,
                fecha: "10 Jul 2026, 3:45 p. m.",
                categoria: "Transferencia recibida",
                cuenta: "Cuenta terminación 3864",
                mensaje: "Transferencia",
                folio: "FKN-DEP-100001"
            };
        default:
            return null;
    }
}
// Elementos del modal
const modal = document.getElementById("movementModal");
const closeModalButton = document.getElementById("closeModal");
const acceptModalButton = document.getElementById("acceptModal");
const modalType = document.getElementById("modalType");
const modalAmount = document.getElementById("modalAmount");
const modalName = document.getElementById("modalName");
const modalDate = document.getElementById("modalDate");
const modalCategory = document.getElementById("modalCategory");
const modalAccount = document.getElementById("modalAccount");
const modalMessage = document.getElementById("modalMessage");
const modalFolio = document.getElementById("modalFolio");
// Formatea el dinero
function formatAmount(amount){
    return new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN"
    }).format(amount);
}
// Abre el modal
function openMovementModal(movement){
    modalType.textContent = movement.tipo;
    modalAmount.textContent = formatAmount(movement.monto);
    modalName.textContent = movement.nombre;
    modalDate.textContent = movement.fecha;
    modalCategory.textContent = movement.categoria;
    modalAccount.textContent = movement.cuenta;
    modalMessage.textContent = movement.mensaje;
    modalFolio.textContent = movement.folio;
    modalAmount.classList.remove("income", "expense");
    if(movement.monto < 0){
        modalAmount.classList.add("expense");
    }else if(movement.monto > 0){
        modalAmount.classList.add("income");
    }
    modal.classList.add("active");
    document.body.classList.add("modal-open");
}
// Cierra el modal
function closeMovementModal(){
    modal.classList.remove("active");
    document.body.classList.remove("modal-open");
}
// Busca los datos del movimiento
function showMovementDetails(element){
    const movementId = Number(element.dataset.id);
    const movement = getMovement(movementId);
    if(!movement){
        console.error(
            "No se encontraron datos para el movimiento:",
            movementId
        );
        return;
    }
    openMovementModal(movement);
}
// Agrega el clic a cada movimiento
document.querySelectorAll(".movement").forEach((movementElement) => {
    movementElement.addEventListener("click", () => {
        showMovementDetails(movementElement);
    });
});
// Cierra con la X
closeModalButton.addEventListener("click", closeMovementModal);
// Cierra con el botón
acceptModalButton.addEventListener("click", closeMovementModal);
// Cierra al tocar el fondo
modal.addEventListener("click", (event) => {
    if(event.target === modal){
        closeMovementModal();
    }
});
// Cierra con Escape
document.addEventListener("keydown", (event) => {
    if(event.key === "Escape"){
        closeMovementModal();
    }
});