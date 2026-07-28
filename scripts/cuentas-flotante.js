/* Elementos del NIP */

const nipModal = document.getElementById("nipModal");
const nipTexto = document.getElementById("nipTexto");
const ojoNip = document.getElementById("ojoNip");

/* Elementos del bloqueo */

const bloqueoModal = document.getElementById("bloqueoModal");
const estadoTarjeta = document.getElementById("estadoTarjeta");
const textoBloquear = document.getElementById("textoBloquear");

/* Elementos de solicitud */

const solicitudModal = document.getElementById("solicitudModal");
const btnContinuarSolicitud = document.getElementById("btnContinuarSolicitud");
const opcionesSolicitud = document.querySelectorAll(".solicitud-opcion");

/* Estados */

let nipVisible = false;
let tarjetaBloqueada = false;
let motivoSolicitud = "";

/* Funciones generales para modales */

function mostrarModal(modal) {
    modal.style.display = "flex";
}

function ocultarModal(modal) {
    modal.style.display = "none";
}

/* Gestión del NIP */

function reiniciarNip() {
    nipVisible = false;
    nipTexto.textContent = "••••";
    ojoNip.src = "assets/ojo-cerrado.png";
    ojoNip.alt = "Mostrar NIP";
}

function abrirModal() {
    reiniciarNip();
    mostrarModal(nipModal);
}

function cerrarModal() {
    ocultarModal(nipModal);
    reiniciarNip();
}

function toggleNip() {
    nipVisible = !nipVisible;

    nipTexto.textContent = nipVisible ? "1234" : "••••";
    ojoNip.src = nipVisible
        ? "assets/ojo-abierto.png"
        : "assets/ojo-cerrado.png";

    ojoNip.alt = nipVisible ? "Ocultar NIP" : "Mostrar NIP";
}

/* Gestión del bloqueo */

function abrirBloqueo() {
    if (tarjetaBloqueada) {
        desbloquearTarjeta();
        return;
    }

    mostrarModal(bloqueoModal);
}

function cerrarBloqueo() {
    ocultarModal(bloqueoModal);
}

function actualizarEstadoTarjeta(bloqueada) {
    tarjetaBloqueada = bloqueada;

    estadoTarjeta.textContent = bloqueada ? "Bloqueada" : "Activa";
    textoBloquear.textContent = bloqueada ? "Desbloquear" : "Bloquear";

    estadoTarjeta.classList.toggle("bloqueada", bloqueada);
    estadoTarjeta.classList.toggle("activa", !bloqueada);
}

function bloquearTarjeta() {
    cerrarBloqueo();
    actualizarEstadoTarjeta(true);

    alert("Tu tarjeta fue bloqueada hasta nuevo aviso.");
}

function desbloquearTarjeta() {
    actualizarEstadoTarjeta(false);

    alert("Tu tarjeta fue desbloqueada.");
}

/* Solicitud de nueva tarjeta */

function abrirSolicitud() {
    mostrarModal(solicitudModal);
}

function reiniciarSolicitud() {
    motivoSolicitud = "";
    btnContinuarSolicitud.disabled = true;

    opcionesSolicitud.forEach(function (opcion) {
        opcion.classList.remove("seleccionada");
    });
}

function cerrarSolicitud() {
    ocultarModal(solicitudModal);
    reiniciarSolicitud();
}

function seleccionarMotivo(boton, motivo) {
    opcionesSolicitud.forEach(function (opcion) {
        opcion.classList.remove("seleccionada");
    });

    boton.classList.add("seleccionada");
    motivoSolicitud = motivo;
    btnContinuarSolicitud.disabled = false;
}

function confirmarSolicitud() {
    if (!motivoSolicitud) {
        return;
    }

    const motivoSeleccionado = motivoSolicitud;

    cerrarSolicitud();

    alert(
        "Tu solicitud para una nueva tarjeta fue registrada.\n\n" +
        "Motivo: " +
        motivoSeleccionado
    );
}

/* Cerrar modales al hacer clic fuera */

window.addEventListener("click", function (evento) {
    if (evento.target === nipModal) {
        cerrarModal();
    }

    if (evento.target === bloqueoModal) {
        cerrarBloqueo();
    }

    if (evento.target === solicitudModal) {
        cerrarSolicitud();
    }
});

/* Cerrar modales con la tecla Escape */

document.addEventListener("keydown", function (evento) {
    if (evento.key !== "Escape") {
        return;
    }

    cerrarModal();
    cerrarBloqueo();
    cerrarSolicitud();
});