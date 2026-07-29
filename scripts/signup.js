import { getSupabase, crearUsuario, crearCuentaYTarjetas } from './supabase.js'

console.log('🚀 signup.js cargado correctamente')

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('myForm');
    const openBoxBtn = document.getElementById('openBox');
    const confirmBox = document.getElementById('confirmBox');
    const cancelBtn = document.getElementById('cancelBtn');
    const confirmBtn = document.getElementById('confirmBtn');

    let formData = {};

    openBoxBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (!email || !password || !confirmPassword) {
            alert('Por favor, completa todos los campos.');
            return;
        }

        if (password !== confirmPassword) {
            alert('Las contraseñas no coinciden.');
            return;
        }

        if (password.length < 6) {
            alert('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        const nombreCompleto = email.split('@')[0]
            .replace(/[^a-zA-ZáéíóúñÑ ]/g, ' ')
            .split(' ')
            .map(p => p.charAt(0).toUpperCase() + p.slice(1))
            .join(' ') || 'Usuario Foken';
        
        formData = { email, password, nombreCompleto };
        confirmBox.showModal();
    });

    cancelBtn.addEventListener('click', () => {
        confirmBox.close();
        formData = {};
        confirmBtn.textContent = 'Estoy de acuerdo';
        confirmBtn.disabled = false;
    });

    confirmBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        if (confirmBtn.disabled) return;
        confirmBtn.textContent = '⏳ Registrando...';
        confirmBtn.disabled = true;

        try {
            const supabase = getSupabase()
            if (!supabase) {
                alert('Error: Supabase no está cargado.')
                confirmBtn.textContent = 'Estoy de acuerdo';
                confirmBtn.disabled = false;
                return
            }
            
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password
            });

            if (authError) {
                let mensaje = 'Error '
                if (authError.message.includes('User already registered')) {
                    mensaje += 'Este email ya está registrado.'
                } else {
                    mensaje += authError.message
                }
                alert(mensaje)
                confirmBtn.textContent = 'Estoy de acuerdo';
                confirmBtn.disabled = false;
                return;
            }

            const usuario = await crearUsuario(
                authData.user.id,
                formData.nombreCompleto,
                formData.email,
                ''
            )

            if (!usuario) {
                alert('Error al crear perfil de usuario.')
                confirmBtn.textContent = 'Estoy de acuerdo';
                confirmBtn.disabled = false;
                return
            }

            const resultado = await crearCuentaYTarjetas(
                authData.user.id,
                formData.nombreCompleto
            )

            if (resultado) {
                console.log('Cuenta y tarjetas creadas')
            }

            confirmBox.close();
            alert('¡Registro exitoso! Revisa tu correo para confirmar tu cuenta.\n\n' +
                  'Usuario: ' + formData.nombreCompleto + '\n' +
                  'Se han creado tus tarjetas de débito y crédito.');
            
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 3000);

        } catch (error) {
            console.error('Error:', error)
            alert('Error al registrar. Intenta de nuevo.')
            confirmBtn.textContent = 'Estoy de acuerdo';
            confirmBtn.disabled = false;
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
    });
});