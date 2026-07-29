// Obtiene los datos de la notificación

function getNotification(id){

    switch(id){

        case 1:
            return {
                titulo: "Transferencia realizada",
                mensaje: "Tu transferencia de $520.00 fue enviada correctamente.",
                fecha: "Hace 5 minutos",
                referencia: "FKN-TRF-520001",
                icono: "assets/exchange.png",
                clase: "success"
            };

        case 2:
            return {
                titulo: "Depósito recibido",
                mensaje: "Se abonaron $1,250.00 a tu cuenta.",
                fecha: "Hace 1 hora",
                referencia: "FKN-DEP-125001",
                icono: "assets/deposit.png",
                clase: "deposit"
            };

        case 3:
            return {
                titulo: "Estado de cuenta",
                mensaje: "Ya puedes consultar tu estado de cuenta.",
                fecha: "Ayer",
                referencia: "FKN-DOC-290726",
                icono: "assets/document.png",
                clase: "document"
            };

        case 4:
            return {
                titulo: "Pago realizado",
                mensaje: "Se realizó correctamente el pago de Netflix.",
                fecha: "20 Jul",
                referencia: "FKN-NET-219001",
                icono: "assets/card.png",
                clase: "card"
            };

        default:
            return null;

    }

}


// Elementos de la ventana

const notificationModal =
    document.getElementById("notificationModal");

const closeNotificationButton =
    document.getElementById("closeNotification");

const acceptNotificationButton =
    document.getElementById("acceptNotification");

const notificationIcon =
    document.getElementById("notificationIcon");

const notificationIconImage =
    document.getElementById("notificationIconImage");

const notificationTitle =
    document.getElementById("notificationTitle");

const notificationMessage =
    document.getElementById("notificationMessage");

const notificationDate =
    document.getElementById("notificationDate");

const notificationReference =
    document.getElementById("notificationReference");


// Abre la ventana

function openNotificationModal(notification){

    notificationTitle.textContent = notification.titulo;
    notificationMessage.textContent = notification.mensaje;
    notificationDate.textContent = notification.fecha;
    notificationReference.textContent = notification.referencia;

    notificationIconImage.src = notification.icono;
    notificationIconImage.alt = notification.titulo;

    notificationIcon.classList.remove(
        "success",
        "deposit",
        "document",
        "card"
    );

    notificationIcon.classList.add(notification.clase);

    notificationModal.classList.add("active");

    document.body.classList.add("notification-open");

}


// Cierra la ventana

function closeNotificationModal(){

    notificationModal.classList.remove("active");

    document.body.classList.remove("notification-open");

}


// Busca la notificación

function showNotificationDetails(element){

    const notificationId = Number(element.dataset.id);

    const notification = getNotification(notificationId);

    if(!notification){

        console.error(
            "No se encontró la notificación:",
            notificationId
        );

        return;

    }

    openNotificationModal(notification);

}


// Agrega el clic a cada notificación

document.querySelectorAll(".notification").forEach((element) => {

    element.addEventListener("click", () => {

        showNotificationDetails(element);

    });

});


// Cierra con la X

closeNotificationButton.addEventListener(
    "click",
    closeNotificationModal
);


// Cierra con el botón

acceptNotificationButton.addEventListener(
    "click",
    closeNotificationModal
);


// Cierra al tocar el fondo

notificationModal.addEventListener("click", (event) => {

    if(event.target === notificationModal){

        closeNotificationModal();

    }

});


// Cierra con Escape

document.addEventListener("keydown", (event) => {

    if(event.key === "Escape"){

        closeNotificationModal();

    }

});