// scripts/login.js
console.log('🚀 login.js cargado correctamente')

document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM cargado')
    
    const loginForm = document.getElementById('loginForm')
    
    if (!loginForm) {
        console.error('❌ Formulario de login no encontrado')
        return
    }
    
    console.log('✅ Formulario encontrado')
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault()
        console.log('🖱️ Click en Iniciar sesión')
        
        const email = document.getElementById('email').value.trim()
        const password = document.getElementById('password').value
        
        console.log('📝 Datos:', { email })
        
        // Validar campos
        if (!email || !password) {
            alert('❌ Por favor, completa todos los campos.')
            return
        }
        
        // Mostrar mensaje de carga
        const submitBtn = loginForm.querySelector('input[type="submit"]')
        const originalValue = submitBtn.value
        submitBtn.value = '⏳ Iniciando sesión...'
        submitBtn.disabled = true
        
        try {
            // Verificar que Supabase esté cargado
            if (typeof window.supabase === 'undefined') {
                alert('❌ Error: Supabase no está cargado. Recarga la página.')
                submitBtn.value = originalValue
                submitBtn.disabled = false
                return
            }
            
            // Crear cliente de Supabase
            const { createClient } = window.supabase
            const supabase = createClient(
                'https://ibrrrbqundkgokhlvuou.supabase.co',
                'sb_publishable_qmpThkeEu1eckP1_fPv7rQ_HG9qxVD_'
            )
            
            // Intentar iniciar sesión
            console.log('📝 Intentando login...')
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            })
            
            if (error) {
                console.error('❌ Error de login:', error)
                
                // Mensajes de error más amigables
                let mensaje = '❌ Error al iniciar sesión: '
                if (error.message.includes('Invalid login credentials')) {
                    mensaje += 'Credenciales incorrectas. Verifica tu email y contraseña.'
                } else if (error.message.includes('Email not confirmed')) {
                    mensaje += 'Por favor, confirma tu email antes de iniciar sesión. Revisa tu bandeja de entrada.'
                } else {
                    mensaje += error.message
                }
                
                alert(mensaje)
                submitBtn.value = originalValue
                submitBtn.disabled = false
                return
            }
            
            console.log('✅ Sesión iniciada:', data.user.email)
            
            // Mostrar mensaje de éxito
            alert('✅ ¡Bienvenido ' + data.user.email + '!')
            
            // Redirigir a home
            window.location.href = 'home.html'
            
        } catch (error) {
            console.error('❌ Excepción:', error)
            alert('❌ Error al iniciar sesión. Intenta de nuevo.')
            submitBtn.value = originalValue
            submitBtn.disabled = false
        }
    })
})