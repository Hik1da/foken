import { getSupabase, getTarjetasByUsuario, getUsuarioById, actualizarUltimoAcceso, logout } from './supabase.js'

const nipModal = document.getElementById("nipModal");
const nipTexto = document.getElementById("nipTexto");
const ojoNip = document.getElementById("ojoNip");
const bloqueoModal = document.getElementById("bloqueoModal");
const estadoTarjeta = document.getElementById("estadoTarjeta");
const textoBloquear = document.getElementById("textoBloquear");
const solicitudModal = document.getElementById("solicitudModal");
const btnContinuarSolicitud = document.getElementById("btnContinuarSolicitud");
const opcionesSolicitud = document.querySelectorAll(".solicitud-opcion");
const carouselTrack = document.getElementById('carouselTrack');
const carouselDots = document.getElementById('carouselDots');

let nipVisible = false;
let tarjetas = [];
let tarjetaActual = 0;
let supabase = null;
let motivoSolicitud = "";
let nipActual = "1234";

function renderizarCarrusel() {
    if (!carouselTrack || tarjetas.length === 0) {
        carouselTrack.innerHTML = `
            <div class="card-slide">
                <div class="card-image-wrapper">
                    <img src="assets/img-tarjeta_x16.png" alt="Tarjeta foken" class="card-image" style="opacity:0.3;">
                </div>
                <div class="card-overlay" style="display:flex; align-items:center; justify-content:center; text-align:center;">
                    <p>No tienes tarjetas registradas</p>
                </div>
            </div>
        `;
        carouselDots.innerHTML = '';
        return;
    }

    carouselTrack.innerHTML = tarjetas.map((tarjeta) => {
        const tipoDisplay = tarjeta.tipo_tarjeta === 'debito' ? 'Débito' : 'Crédito';
        const estadoClass = tarjeta.estado === 'activa' ? 'activa' : 'bloqueada';
        const estadoDisplay = tarjeta.estado === 'activa' ? 'Activa' : 'Bloqueada';
        const numeroMostrar = tarjeta.numero_tarjeta ? '**** ' + tarjeta.numero_tarjeta.slice(-4) : '**** **** **** 0000';
        const expiracion = tarjeta.fecha_expiracion ? tarjeta.fecha_expiracion.slice(0, 7).replace('-', '/') : '12/29';
        const limiteCredito = tarjeta.tipo_tarjeta === 'credito' ? '$100,000' : '';

        return `
            <div class="card-slide">
                <div class="card-image-wrapper">
                    <img src="assets/img-tarjeta_x16.png" alt="Tarjeta foken" class="card-image">
                </div>
                <div class="card-overlay">
                    <div class="card-status ${estadoClass}">${estadoDisplay}</div>
                    <div>
                        <div class="card-tipo">${tipoDisplay}</div>
                    </div>
                    <div>
                        <div class="card-marca">${tarjeta.marca || 'Visa'}</div>
                        <div class="card-number">${numeroMostrar}</div>
                        ${limiteCredito ? `<div style="font-size:11px;opacity:0.8;margin-top:4px;">${limiteCredito}</div>` : ''}
                    </div>
                    <div class="card-footer">
                        <div class="card-titular">
                            <span>Tarjeta</span>
                            <strong>${tarjeta.titular || 'Usuario'}</strong>
                        </div>
                        <div class="card-expira">
                            <span>Expira</span>
                            <strong>${expiracion}</strong>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    renderizarDots();
    actualizarInfoTarjeta(0);
}

function renderizarDots() {
    if (!carouselDots) return;
    carouselDots.innerHTML = tarjetas.map((_, index) => `
        <span class="dot ${index === tarjetaActual ? 'active' : ''}" onclick="irATarjeta(${index})"></span>
    `).join('');
}

function actualizarInfoTarjeta(index) {
    if (!tarjetas || tarjetas.length === 0 || index >= tarjetas.length) return;
    
    const tarjeta = tarjetas[index];
    tarjetaActual = index;
    
    const estadoClass = tarjeta.estado === 'activa' ? 'activa' : 'bloqueada';
    const estadoDisplay = tarjeta.estado === 'activa' ? 'Activa' : 'Bloqueada';
    
    nipActual = tarjeta.nip || "1234";
    
    if (estadoTarjeta) {
        estadoTarjeta.textContent = estadoDisplay;
        estadoTarjeta.className = `status-badge ${estadoClass}`;
    }
    
    if (textoBloquear) {
        textoBloquear.textContent = tarjeta.estado === 'activa' ? 'Bloquear' : 'Desbloquear';
    }
    
    document.querySelectorAll('.dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
    
    moverCarruselA(index);
}

function moverCarruselA(index) {
    if (!carouselTrack || tarjetas.length === 0) return;
    const width = carouselTrack.parentElement.offsetWidth;
    carouselTrack.style.transform = `translateX(-${index * width}px)`;
}

window.moverCarrusel = function(direccion) {
    if (!tarjetas || tarjetas.length === 0) return;
    let nuevoIndex = tarjetaActual + direccion;
    if (nuevoIndex < 0) nuevoIndex = tarjetas.length - 1;
    if (nuevoIndex >= tarjetas.length) nuevoIndex = 0;
    actualizarInfoTarjeta(nuevoIndex);
}

window.irATarjeta = function(index) {
    if (index < 0 || index >= tarjetas.length) return;
    actualizarInfoTarjeta(index);
}

async function cargarDatosUsuario() {
    supabase = getSupabase();
    if (!supabase) {
        setTimeout(cargarDatosUsuario, 2000);
        return;
    }
    
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
            window.location.href = 'login.html';
            return;
        }
        
        await actualizarUltimoAcceso(user.id);
        
        const usuario = await getUsuarioById(user.id);
        console.log('Usuario:', usuario);
      
        const userIcon = document.querySelector('header a#user img')
        if (userIcon && usuario) {
            console.log('Generando avatar para:', usuario.nombre_completo);
            const canvas = document.createElement('canvas')
            canvas.width = 32
            canvas.height = 32
            const ctx = canvas.getContext('2d')
            ctx.beginPath()
            ctx.arc(16, 16, 16, 0, Math.PI * 2)
            ctx.fillStyle = '#4A90D9'
            ctx.fill()
            ctx.fillStyle = '#FFFFFF'
            ctx.font = 'bold 14px Arial'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            const iniciales = (usuario.nombre_completo || 'U')
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)
            ctx.fillText(iniciales || 'U', 16, 17)
            userIcon.src = canvas.toDataURL()
            userIcon.style.borderRadius = '50%'
            console.log('Avatar generado:', iniciales);
        } else {
            console.log('No se encontró el icono de usuario');
            console.log('userIcon:', userIcon);
            console.log('usuario:', usuario);
        }
   
        const tarjetasData = await getTarjetasByUsuario(user.id);
        if (tarjetasData && tarjetasData.length > 0) {
            tarjetas = tarjetasData;
            renderizarCarrusel();
            actualizarInfoTarjeta(0);
        } else {
            renderizarCarrusel();
        }
        
        const userLink = document.querySelector('header a#user');
        if (userLink) {
            userLink.addEventListener('click', async (e) => {
                e.preventDefault();
                if (confirm('¿Deseas cerrar sesión?')) {
                    await logout();
                    window.location.href = 'login.html';
                }
            });
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function reiniciarNip() {
    nipVisible = false;
    nipTexto.textContent = "••••";
    ojoNip.src = "assets/interactive-icons/eye-close.png";
    ojoNip.alt = "Mostrar NIP";
}

window.abrirModal = function() {
    reiniciarNip();
    nipModal.style.display = "flex";
}

window.cerrarModal = function() {
    nipModal.style.display = "none";
    reiniciarNip();
}

window.toggleNip = function() {
    nipVisible = !nipVisible;
    nipTexto.textContent = nipVisible ? nipActual : "••••";
    ojoNip.src = nipVisible ? "assets/interactive-icons/eye-open.png" : "assets/interactive-icons/eye-close.png";
    ojoNip.alt = nipVisible ? "Ocultar NIP" : "Mostrar NIP";
}

window.abrirBloqueo = function() {
    if (!tarjetas || tarjetas.length === 0 || tarjetaActual >= tarjetas.length) {
        alert('No se encontró tarjeta');
        return;
    }
    const tarjeta = tarjetas[tarjetaActual];
    if (tarjeta.estado === 'bloqueada') {
        if (confirm('¿Deseas desbloquear tu tarjeta?')) {
            desbloquearTarjeta();
        }
        return;
    }
    bloqueoModal.style.display = "flex";
}

window.cerrarBloqueo = function() {
    bloqueoModal.style.display = "none";
}

window.bloquearTarjeta = async function() {
    if (!tarjetas || tarjetas.length === 0) return;
    const tarjeta = tarjetas[tarjetaActual];
    if (!supabase) {
        alert('Error de conexión');
        return;
    }
    try {
        const { error } = await supabase
            .from('tarjetas')
            .update({ estado: 'bloqueada' })
            .eq('id_tarjeta', tarjeta.id_tarjeta);
        if (error) {
            alert('Error al bloquear la tarjeta');
            return;
        }
        tarjeta.estado = 'bloqueada';
        actualizarInfoTarjeta(tarjetaActual);
        cerrarBloqueo();
        alert('Tu tarjeta fue bloqueada.');
    } catch (error) {
        alert('Error al procesar la solicitud');
    }
}

async function desbloquearTarjeta() {
    if (!tarjetas || tarjetas.length === 0) return;
    const tarjeta = tarjetas[tarjetaActual];
    if (!supabase) {
        alert('Error de conexión');
        return;
    }
    try {
        const { error } = await supabase
            .from('tarjetas')
            .update({ estado: 'activa' })
            .eq('id_tarjeta', tarjeta.id_tarjeta);
        if (error) {
            alert('Error al desbloquear la tarjeta');
            return;
        }
        tarjeta.estado = 'activa';
        actualizarInfoTarjeta(tarjetaActual);
        alert('Tu tarjeta fue desbloqueada.');
    } catch (error) {
        alert('Error al procesar la solicitud');
    }
}

window.abrirSolicitud = function() {
    reiniciarSolicitud();
    solicitudModal.style.display = "flex";
}

function reiniciarSolicitud() {
    motivoSolicitud = "";
    btnContinuarSolicitud.disabled = true;
    opcionesSolicitud.forEach(el => el.classList.remove("seleccionada"));
}

window.cerrarSolicitud = function() {
    solicitudModal.style.display = "none";
    reiniciarSolicitud();
}

window.seleccionarMotivo = function(boton, motivo) {
    opcionesSolicitud.forEach(el => el.classList.remove("seleccionada"));
    boton.classList.add("seleccionada");
    motivoSolicitud = motivo;
    btnContinuarSolicitud.disabled = false;
}

window.confirmarSolicitud = function() {
    if (!motivoSolicitud) return;
    const motivo = motivoSolicitud;
    cerrarSolicitud();
    alert(`Tu solicitud para una nueva tarjeta fue registrada.\n\nMotivo: ${motivo}\n\nPróximamente recibirás tu nueva tarjeta.`);
}

window.addEventListener("click", function(evento) {
    if (evento.target === nipModal) cerrarModal();
    if (evento.target === bloqueoModal) cerrarBloqueo();
    if (evento.target === solicitudModal) cerrarSolicitud();
});

document.addEventListener("keydown", function(evento) {
    if (evento.key !== "Escape") return;
    cerrarModal();
    cerrarBloqueo();
    cerrarSolicitud();
});

window.addEventListener('resize', () => {
    if (carouselTrack && tarjetas.length > 0) {
        moverCarruselA(tarjetaActual);
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    await cargarDatosUsuario();
});