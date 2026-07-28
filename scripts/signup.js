// scripts/signup.js
import { getSupabase } from './supabase.js'

console.log('🚀 signup.js cargado correctamente')

document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM cargado')
    
    const form = document.getElementById('myForm');
    const openBoxBtn = document.getElementById('openBox');
    const confirmBox = document.getElementById('confirmBox');
    const cancelBtn = document.getElementById('cancelBtn');
    const confirmBtn = document.getElementById('confirmBtn');

    console.log('🔍 Elementos encontrados:', { 
        form: !!form, 
        openBoxBtn: !!openBoxBtn, 
        confirmBox: !!confirmBox, 
        cancelBtn: !!cancelBtn, 
        confirmBtn: !!confirmBtn 
    })

    let formData = {};

    // Mostrar el diálogo al hacer clic en Confirmar
    openBoxBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('🖱️ Click en Confirmar')
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        console.log('📝 Datos:', { email, passwordLength: password.length })

        if (!email || !password || !confirmPassword) {
            alert('❌ Por favor, completa todos los campos.');
            return;
        }

        if (password !== confirmPassword) {
            alert('❌ Las contraseñas no coinciden.');
            return;
        }

        if (password.length < 6) {
            alert('❌ La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        formData = { email, password };
        console.log('✅ Datos válidos, mostrando diálogo')
        confirmBox.showModal();
    });

    // Cancelar registro
    cancelBtn.addEventListener('click', () => {
        console.log('❌ Cancelado')
        confirmBox.close();
        formData = {};
        confirmBtn.textContent = 'Estoy de acuerdo';
        confirmBtn.disabled = false;
    });

    // Confirmar registro
    confirmBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        console.log('✅ Click en "Estoy de acuerdo"')
        
        if (confirmBtn.disabled) {
            console.log('⏳ Botón deshabilitado, ignorando')
            return
        }
        
        confirmBtn.textContent = '⏳ Registrando...';
        confirmBtn.disabled = true;

        try {
            // Obtener cliente de Supabase
            const supabase = getSupabase()
            if (!supabase) {
                alert('❌ Error: Supabase no está cargado. Recarga la página.')
                confirmBtn.textContent = 'Estoy de acuerdo';
                confirmBtn.disabled = false;
                return
            }
            
            console.log('📝 Enviando a Supabase:', { email: formData.email })
            
            const { data, error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password
            });

            console.log('📥 Respuesta de Supabase:', { data, error })

            if (error) {
                console.error('❌ Error de Supabase:', error)
                
                let mensaje = '❌ Error al registrar: '
                if (error.message.includes('User already registered')) {
                    mensaje += 'Este email ya está registrado. Por favor, inicia sesión.'
                } else {
                    mensaje += error.message
                }
                
                alert(mensaje)
                confirmBtn.textContent = 'Estoy de acuerdo';
                confirmBtn.disabled = false;
                return;
            }

            console.log('✅ Éxito:', data)
            confirmBox.close();
            alert('✅ ¡Registro exitoso! Revisa tu correo para confirmar tu cuenta.');
            
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);

        } catch (error) {
            console.error('❌ Excepción:', error)
            alert('❌ Error al registrar. Intenta de nuevo.')
            confirmBtn.textContent = 'Estoy de acuerdo';
            confirmBtn.disabled = false;
        }
    });

    // Cerrar diálogo con ESC
    confirmBox.addEventListener('close', () => {
        console.log('🔚 Diálogo cerrado')
        if (!confirmBox.returnValue) {
            formData = {};
            confirmBtn.textContent = 'Estoy de acuerdo';
            confirmBtn.disabled = false;
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        console.log('📝 Formulario prevenido de enviar')
    });
});