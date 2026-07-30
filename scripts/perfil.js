import { getSupabase, getUsuarioById, logout, actualizarUltimoAcceso } from './supabase.js'

console.log('perfil.js cargado')

let usuarioActual = null
let supabase = null

/* ============================================
   ELEMENTOS DEL DOM
   ============================================ */

const usuarioNombre = document.getElementById('usuarioNombre')
const usuarioEmail = document.getElementById('usuarioEmail')
const usuarioAvatar = document.getElementById('usuarioAvatar')

/* ============================================
   ELEMENTOS DEL MODAL REUTILIZABLE
   ============================================ */

const modalInformacion = document.getElementById("modalInformacion");
const modalTitulo = document.getElementById("modalTitulo");
const modalTexto = document.getElementById("modalTexto");
const cerrarModalButton = document.getElementById("cerrarModalButton");
const aceptarModalButton = document.getElementById("aceptarModalButton");
const abrirModalButtons = document.querySelectorAll(".abrir-modal");

/* ============================================
   ELEMENTOS DEL MODAL QR
   ============================================ */

const qrButton = document.getElementById("qrButton");
const qrModal = document.getElementById("qrModal");
const cerrarQrButton = document.getElementById("cerrarQrButton");
const cerrarQrAceptar = document.getElementById("cerrarQrAceptar");

/* ============================================
   ELEMENTOS DE EDICIÓN (NUEVOS)
   ============================================ */

const modalEditar = document.getElementById("modalEditar");
const modalPassword = document.getElementById("modalPassword");
const modalEliminar = document.getElementById("modalEliminar");

const btnDatosPersonales = document.getElementById("btnDatosPersonales");
const btnCambiarPassword = document.getElementById("btnCambiarPassword");
const btnEliminarCuenta = document.getElementById("btnEliminarCuenta");

const cerrarEditar = document.getElementById("cerrarEditar");
const cerrarPassword = document.getElementById("cerrarPassword");
const cerrarEliminar = document.getElementById("cerrarEliminar");

const formEditarPerfil = document.getElementById("formEditarPerfil");
const formCambiarPassword = document.getElementById("formCambiarPassword");
const formEliminarCuenta = document.getElementById("formEliminarCuenta");

const editNombre = document.getElementById("editNombre");
const editEmail = document.getElementById("editEmail");
const editTelefono = document.getElementById("editTelefono");

const passwordActual = document.getElementById("passwordActual");
const passwordNueva = document.getElementById("passwordNueva");
const passwordConfirmar = document.getElementById("passwordConfirmar");
const confirmarEliminar = document.getElementById("confirmarEliminar");

let botonQueAbrioModal = null;

/* ============================================
   FUNCIONES DEL MODAL REUTILIZABLE
   ============================================ */

function abrirModal(titulo, texto, boton) {
    if (!modalInformacion || !modalTitulo || !modalTexto) return;
    botonQueAbrioModal = boton;
    modalTitulo.textContent = titulo;
    modalTexto.textContent = texto;
    modalInformacion.classList.add("modal-visible");
    modalInformacion.setAttribute("aria-hidden", "false");
    document.body.classList.add("sin-scroll");
    cerrarModalButton?.focus();
}

function cerrarModal() {
    if (!modalInformacion) return;
    modalInformacion.classList.remove("modal-visible");
    modalInformacion.setAttribute("aria-hidden", "true");
    document.body.classList.remove("sin-scroll");
    botonQueAbrioModal?.focus();
    botonQueAbrioModal = null;
}

abrirModalButtons.forEach(function (boton) {
    boton.addEventListener("click", function () {
        const titulo = boton.dataset.modalTitle;
        const texto = boton.dataset.modalText;
        abrirModal(titulo, texto, boton);
    });
});

cerrarModalButton?.addEventListener("click", cerrarModal);
aceptarModalButton?.addEventListener("click", cerrarModal);

modalInformacion?.addEventListener("click", function (evento) {
    if (evento.target === modalInformacion) cerrarModal();
});

document.addEventListener("keydown", function (evento) {
    if (evento.key === "Escape" && modalInformacion?.classList.contains("modal-visible")) {
        cerrarModal();
    }
});

/* ============================================
   FUNCIONES QR
   ============================================ */

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
    if (e.target === qrModal) cerrarQrModal();
});

/* ============================================
   GENERAR AVATAR EN HEADER
   ============================================ */

function generarAvatarHeader(usuario) {
    const userIcon = document.querySelector('header a#user img')
    if (userIcon && usuario) {
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
        console.log('Avatar generado en perfil:', iniciales)
    }
}

/* ============================================
   FUNCIONES DE MODALES DE EDICIÓN
   ============================================ */

function abrirModalEditar() {
    cargarDatosEnFormulario();
    modalEditar.classList.add("modal-visible");
    document.body.classList.add("sin-scroll");
}

function cerrarModalEditar() {
    modalEditar.classList.remove("modal-visible");
    document.body.classList.remove("sin-scroll");
}

function abrirModalPassword() {
    modalPassword.classList.add("modal-visible");
    document.body.classList.add("sin-scroll");
    document.getElementById("formCambiarPassword").reset();
}

function cerrarModalPassword() {
    modalPassword.classList.remove("modal-visible");
    document.body.classList.remove("sin-scroll");
    document.getElementById("formCambiarPassword").reset();
}

function abrirModalEliminar() {
    modalEliminar.classList.add("modal-visible");
    document.body.classList.add("sin-scroll");
}

function cerrarModalEliminar() {
    modalEliminar.classList.remove("modal-visible");
    document.body.classList.remove("sin-scroll");
    document.getElementById("formEliminarCuenta").reset();
}

/* ============================================
   CARGA DE DATOS DEL USUARIO DESDE SUPABASE
   ============================================ */

function cargarDatosEnFormulario() {
    if (usuarioActual) {
        editNombre.value = usuarioActual.nombre_completo || '';
        editEmail.value = usuarioActual.email || '';
        editTelefono.value = usuarioActual.telefono || '';
    }
}

function actualizarPerfilEnUI(usuario) {
    if (!usuario) return;
    const nombre = usuario.nombre_completo || 'Usuario';
    const email = usuario.email || '';
    const iniciales = nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    if (usuarioNombre) usuarioNombre.textContent = nombre;
    if (usuarioEmail) usuarioEmail.textContent = email;
    if (usuarioAvatar) usuarioAvatar.textContent = iniciales || 'U';
}

/* ============================================
   INICIALIZAR PERFIL - CONEXIÓN A SUPABASE
   ============================================ */

document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM cargado - Inicializando perfil');

    supabase = getSupabase();
    if (!supabase) {
        console.error('Supabase no disponible');
        window.location.href = 'login.html';
        return;
    }

    try {
        // 1. Obtener usuario autenticado
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
            console.error('No hay sesión:', error);
            window.location.href = 'login.html';
            return;
        }

        console.log('Sesión activa:', user.email);

        // 2. Actualizar último acceso
        await actualizarUltimoAcceso(user.id);

        // 3. Obtener datos del usuario desde la tabla 'usuarios'
        usuarioActual = await getUsuarioById(user.id);
        console.log('Usuario obtenido de BD:', usuarioActual);

        // 4. Mostrar datos en la UI
        if (usuarioActual) {
            actualizarPerfilEnUI(usuarioActual);
            generarAvatarHeader(usuarioActual);
        } else {
            console.warn('No se encontró usuario en tabla, creando perfil básico');
            // Si no existe, mostrar el email como nombre
            if (usuarioNombre) usuarioNombre.textContent = user.email.split('@')[0];
            if (usuarioEmail) usuarioEmail.textContent = user.email;
            if (usuarioAvatar) usuarioAvatar.textContent = user.email.charAt(0).toUpperCase();
        }

        // 5. Configurar eventos de los botones de edición
        if (btnDatosPersonales) {
            btnDatosPersonales.addEventListener('click', abrirModalEditar);
        }
        if (btnCambiarPassword) {
            btnCambiarPassword.addEventListener('click', abrirModalPassword);
        }
        if (btnEliminarCuenta) {
            btnEliminarCuenta.addEventListener('click', abrirModalEliminar);
        }

        // 6. Configurar eventos de cierre de modales
        if (cerrarEditar) cerrarEditar.addEventListener('click', cerrarModalEditar);
        if (cerrarPassword) cerrarPassword.addEventListener('click', cerrarModalPassword);
        if (cerrarEliminar) cerrarEliminar.addEventListener('click', cerrarModalEliminar);

        // 7. Configurar eventos de formularios
        if (formEditarPerfil) formEditarPerfil.addEventListener('submit', guardarCambios);
        if (formCambiarPassword) formCambiarPassword.addEventListener('submit', cambiarPassword);
        if (formEliminarCuenta) formEliminarCuenta.addEventListener('submit', eliminarCuenta);

        // 8. Cerrar modales al hacer clic fuera
        if (modalEditar) {
            modalEditar.addEventListener('click', (e) => {
                if (e.target === modalEditar) cerrarModalEditar();
            });
        }
        if (modalPassword) {
            modalPassword.addEventListener('click', (e) => {
                if (e.target === modalPassword) cerrarModalPassword();
            });
        }
        if (modalEliminar) {
            modalEliminar.addEventListener('click', (e) => {
                if (e.target === modalEliminar) cerrarModalEliminar();
            });
        }

        // 9. Cerrar modales con tecla ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                cerrarModalEditar();
                cerrarModalPassword();
                cerrarModalEliminar();
            }
        });

        // 10. Configurar cierre de sesión desde el footer
        const logoutFooter = document.getElementById('logoutFooter');
        if (logoutFooter) {
            logoutFooter.addEventListener('click', async (e) => {
                e.preventDefault();
                if (confirm('¿Deseas cerrar sesión?')) {
                    await logout();
                    window.location.href = 'login.html';
                }
            });
        }

        // 11. Configurar cierre de sesión desde el icono del header
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
        console.error('Error al inicializar perfil:', error);
        window.location.href = 'login.html';
    }
});

/* ============================================
   GUARDAR CAMBIOS (UPDATE)
   ============================================ */

async function guardarCambios(e) {
    e.preventDefault();
    const nombre = editNombre.value.trim();
    const email = editEmail.value.trim();
    const telefono = editTelefono.value.trim();

    if (!nombre || !email) {
        alert('Nombre y email son obligatorios');
        return;
    }

    const btn = e.target.querySelector('.btn-guardar');
    const textoOriginal = btn.textContent;
    btn.textContent = 'Guardando...';
    btn.disabled = true;

    try {
        const { error } = await supabase
            .from('usuarios')
            .update({
                nombre_completo: nombre,
                email: email,
                telefono: telefono || null,
                updated_at: new Date().toISOString()
            })
            .eq('id_usuario', usuarioActual.id_usuario);

        if (error) {
            alert('Error al guardar: ' + error.message);
            return;
        }

        usuarioActual.nombre_completo = nombre;
        usuarioActual.email = email;
        usuarioActual.telefono = telefono;

        actualizarPerfilEnUI(usuarioActual);
        generarAvatarHeader(usuarioActual);
        alert('✅ Datos actualizados correctamente');
        cerrarModalEditar();

    } catch (error) {
        alert('Error: ' + error.message);
    } finally {
        btn.textContent = textoOriginal;
        btn.disabled = false;
    }
}

/* ============================================
   CAMBIAR CONTRASEÑA (UPDATE)
   ============================================ */

async function cambiarPassword(e) {
    e.preventDefault();
    const actual = passwordActual.value;
    const nueva = passwordNueva.value;
    const confirmar = passwordConfirmar.value;

    if (!actual || !nueva || !confirmar) {
        alert('Completa todos los campos');
        return;
    }

    if (nueva.length < 6) {
        alert('La nueva contraseña debe tener al menos 6 caracteres');
        return;
    }

    if (nueva !== confirmar) {
        alert('Las contraseñas no coinciden');
        return;
    }

    const btn = e.target.querySelector('.btn-guardar');
    const textoOriginal = btn.textContent;
    btn.textContent = 'Actualizando...';
    btn.disabled = true;

    try {
        const { error } = await supabase.auth.updateUser({
            password: nueva
        });

        if (error) {
            if (error.message.includes('Invalid')) {
                alert('Contraseña actual incorrecta');
            } else {
                alert('Error al cambiar contraseña: ' + error.message);
            }
            return;
        }

        alert('✅ Contraseña actualizada correctamente');
        cerrarModalPassword();

    } catch (error) {
        alert('Error: ' + error.message);
    } finally {
        btn.textContent = textoOriginal;
        btn.disabled = false;
    }
}

/* ============================================
   ELIMINAR CUENTA (DELETE)
   ============================================ */

async function eliminarCuenta(e) {
    e.preventDefault();
    const emailConfirm = confirmarEliminar.value.trim();

    if (emailConfirm !== usuarioActual.email) {
        alert('El correo no coincide con el de la cuenta');
        return;
    }

    if (!confirm('⚠️ ¿Estás seguro de eliminar tu cuenta? Esta acción es irreversible.')) {
        return;
    }

    const btn = e.target.querySelector('.btn-eliminar');
    const textoOriginal = btn.textContent;
    btn.textContent = 'Eliminando...';
    btn.disabled = true;

    try {
        const userId = usuarioActual.id_usuario;

        await supabase.from('tarjetas').delete().eq('id_usuario', userId);
        await supabase.from('cuentas').delete().eq('id_usuario', userId);
        await supabase.from('usuarios').delete().eq('id_usuario', userId);

        const { error } = await supabase.auth.admin.deleteUser(userId);

        if (error) {
            console.warn('Error al eliminar usuario de Auth:', error);
        }

        await logout();
        alert('✅ Cuenta eliminada correctamente');
        window.location.href = 'login.html';

    } catch (error) {
        alert('Error al eliminar cuenta: ' + error.message);
        btn.textContent = textoOriginal;
        btn.disabled = false;
    }
}