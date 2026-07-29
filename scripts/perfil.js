/* Elementos de la CLABE */

const clabeNumero = document.getElementById("clabeNumero");
const copiarClabeButton = document.getElementById("copiarClabeButton");
const mensajeCopiado = document.getElementById("mensajeCopiado");


/* Elementos del modal reutilizable */

const modalInformacion = document.getElementById("modalInformacion");
const modalTitulo = document.getElementById("modalTitulo");
const modalTexto = document.getElementById("modalTexto");
const cerrarModalButton = document.getElementById("cerrarModalButton");
const aceptarModalButton = document.getElementById("aceptarModalButton");
const abrirModalButtons = document.querySelectorAll(".abrir-modal");

let botonQueAbrioModal = null;


/* Mostrar mensaje de CLABE */

function mostrarMensajeClabe(mensaje) {

    if (!mensajeCopiado) {
        return;
    }

    mensajeCopiado.textContent = mensaje;

    setTimeout(function () {

        mensajeCopiado.textContent = "";

    }, 2000);

}


/* Copiar CLABE */

async function copiarClabe() {

    if (!clabeNumero) {
        return;
    }

    const numero = clabeNumero.textContent.trim();

    try {

        if (navigator.clipboard && window.isSecureContext) {

            await navigator.clipboard.writeText(numero);

            mostrarMensajeClabe(
                "CLABE copiada correctamente"
            );

        } else {

            copiarClabeAlternativo(numero);

        }

    } catch (error) {

        copiarClabeAlternativo(numero);

    }

}


/* Copiar CLABE en navegadores antiguos */

function copiarClabeAlternativo(numero) {

    const campoTemporal = document.createElement("textarea");

    campoTemporal.value = numero;
    campoTemporal.style.position = "fixed";
    campoTemporal.style.left = "-9999px";
    campoTemporal.style.opacity = "0";

    document.body.appendChild(campoTemporal);

    campoTemporal.focus();
    campoTemporal.select();

    try {

        const copiado = document.execCommand("copy");

        if (copiado) {

            mostrarMensajeClabe(
                "CLABE copiada correctamente"
            );

        } else {

            mostrarMensajeClabe(
                "No se pudo copiar la CLABE"
            );

        }

    } catch (error) {

        mostrarMensajeClabe(
            "No se pudo copiar la CLABE"
        );

    }

    campoTemporal.remove();

}


copiarClabeButton?.addEventListener(
    "click",
    copiarClabe
);


/* Abrir modal */

function abrirModal(titulo, texto, boton) {

    if (
        !modalInformacion ||
        !modalTitulo ||
        !modalTexto
    ) {
        return;
    }

    botonQueAbrioModal = boton;

    modalTitulo.textContent = titulo;
    modalTexto.textContent = texto;

    modalInformacion.classList.add(
        "modal-visible"
    );

    modalInformacion.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.classList.add(
        "sin-scroll"
    );

    cerrarModalButton?.focus();

}


/* Cerrar modal */

function cerrarModal() {

    if (!modalInformacion) {
        return;
    }

    modalInformacion.classList.remove(
        "modal-visible"
    );

    modalInformacion.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.classList.remove(
        "sin-scroll"
    );

    botonQueAbrioModal?.focus();

    botonQueAbrioModal = null;

}


/* Eventos de los botones que abren el modal */

abrirModalButtons.forEach(function (boton) {

    boton.addEventListener("click", function () {

        const titulo = boton.dataset.modalTitle;
        const texto = boton.dataset.modalText;

        abrirModal(
            titulo,
            texto,
            boton
        );

    });

});

/* Modal QR */

const qrButton = document.getElementById("qrButton");
const qrModal = document.getElementById("qrModal");
const cerrarQrButton = document.getElementById("cerrarQrButton");
const cerrarQrAceptar = document.getElementById("cerrarQrAceptar");

function abrirQrModal() {

    qrModal.classList.add("modal-visible");
    document.body.classList.add("sin-scroll");

}

function cerrarQrModal() {

    qrModal.classList.remove("modal-visible");
    document.body.classList.remove("sin-scroll");

}

qrButton.addEventListener("click", abrirQrModal);

cerrarQrButton.addEventListener("click", cerrarQrModal);

cerrarQrAceptar.addEventListener("click", cerrarQrModal);

qrModal.addEventListener("click", function (e) {

    if (e.target === qrModal) {

        cerrarQrModal();

    }

});

document.addEventListener("keydown", function (e) {

    if (e.key === "Escape") {

        cerrarQrModal();

    }

});


/* Botones para cerrar el modal */

cerrarModalButton?.addEventListener(
    "click",
    cerrarModal
);

aceptarModalButton?.addEventListener(
    "click",
    cerrarModal
);


/* Cerrar al presionar fuera del contenido */

modalInformacion?.addEventListener(
    "click",
    function (evento) {

        if (evento.target === modalInformacion) {

            cerrarModal();

        }

    }
);


/* Cerrar presionando Escape */

document.addEventListener(
    "keydown",
    function (evento) {

        if (
            evento.key === "Escape" &&
            modalInformacion?.classList.contains(
                "modal-visible"
            )
        ) {

            cerrarModal();

        }

    }
);