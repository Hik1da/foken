// MODAL GESTIONAR NIP

const modal = document.getElementById("nipModal");
const nipTexto = document.getElementById("nipTexto");
const ojo = document.getElementById("ojoNip");

const nipReal = "1234";

let visible = false;

function abrirModal() {

    modal.style.display = "flex";
    // Inicia de forma oculta
    visible = false;
    nipTexto.textContent = "••••";
    ojo.src = "assets/ojo-cerrado.png";

}

function cerrarModal() {

    modal.style.display = "none";

}

function toggleNip() {

    if (visible) {

        visible = false;
        nipTexto.textContent = "••••";
        ojo.src = "assets/ojo-cerrado.png";

    } else {

        visible = true;
        nipTexto.textContent = nipReal;
        ojo.src = "assets/ojo-abierto.png";

    }

}

// MODAL BLOQUEAR TARJETA
const bloqueoModal = document.getElementById("bloqueoModal");

function abrirBloqueo() {

    bloqueoModal.style.display = "flex";

}

function cerrarBloqueo() {

    bloqueoModal.style.display = "none";

}

// OPCIONES DE BLOQUEO

const estadoTarjeta = document.getElementById("estadoTarjeta");
const textoBloquear = document.getElementById("textoBloquear");
const btnBloquear = document.getElementById("btnBloquear");

document.querySelectorAll(".bloqueo-btn").forEach(function (boton) {

    boton.addEventListener("click", function () {

        cerrarBloqueo();

        alert("Tu tarjeta fue bloqueada hasta nuevo aviso.");

        estadoTarjeta.textContent = "Bloqueada";
        estadoTarjeta.classList.remove("activa");
        estadoTarjeta.classList.add("bloqueada");

        textoBloquear.textContent = "Desbloquear";

        btnBloquear.onclick = function () {

            alert("Tu tarjeta fue desbloqueada.");

            estadoTarjeta.textContent = "Activa";
            estadoTarjeta.classList.remove("bloqueada");
            estadoTarjeta.classList.add("activa");

            textoBloquear.textContent = "Bloquear";

            btnBloquear.onclick = abrirBloqueo;
        };

    });

});

// CERRAR AL HACER CLIC FUERA
window.addEventListener("click", function (event) {

    if (event.target === modal) {

        cerrarModal();

    }

    if (event.target === bloqueoModal) {

        cerrarBloqueo();

    }

});

// CERRAR CON ESC
document.addEventListener("keydown", function (event) {

    if (event.key === "Escape") {

        cerrarModal();
        cerrarBloqueo();

    }

});