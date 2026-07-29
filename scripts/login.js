// scripts/login.js
import { getSupabase, crearUsuario, actualizarUltimoAcceso } from './supabase.js'

console.log('login.js cargado correctamente')

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM cargado')
    
    const loginForm = document.getElementById('loginForm')
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault()
            
            const email = document.getElementById('email').value.trim()
            const password = document.getElementById('password').value
            
            // Mostrar mensaje de carga
            const submitBtn = loginForm.querySelector('input[type="submit"]')
            const originalValue = submitBtn.value
            submitBtn.value = 'Iniciando...'
            submitBtn.disabled = true
            
            try {
                const supabase = getSupabase()
                if (!supabase) {
                    alert('Error de conexión. Recarga la página.')
                    submitBtn.value = originalValue
                    submitBtn.disabled = false
                    return
                }
                
                // 1. Intentar iniciar sesión
                console.log('Intentando login:', email)
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: email,
                    password: password
                })
                
                if (error) {
                    let mensaje = 'Error'
                    if (error.message.includes('Invalid login credentials')) {
                        mensaje += 'Credenciales incorrectas. Verifica tu email y contraseña.'
                    } else if (error.message.includes('Email not confirmed')) {
                        mensaje += 'Por favor, confirma tu email antes de iniciar sesión.'
                    } else {
                        mensaje += error.message
                    }
                    alert(mensaje)
                    submitBtn.value = originalValue
                    submitBtn.disabled = false
                    return
                }
                
                console.log('Sesión iniciada:', data.user.email)
                
                // 2. Verificar si el usuario existe en la tabla usuarios
                console.log('Verificando usuario en tabla...')
                const { data: usuarioExistente, error: usuarioError } = await supabase
                    .from('usuarios')
                    .select('*')
                    .eq('id_usuario', data.user.id)
                    .maybeSingle()
                
                if (usuarioError) {
                    console.error('Error al verificar usuario:', usuarioError)
                }
                
                // 3. Si no existe, crearlo
                if (!usuarioExistente) {
                    console.log('Usuario no existe en tabla, creando...')
                    
                    // Obtener el nombre del usuario del email (parte antes del @)
                    const nombreCompleto = email.split('@')[0]
                        .replace(/[^a-zA-ZáéíóúñÑ ]/g, ' ')
                        .split(' ')
                        .map(p => p.charAt(0).toUpperCase() + p.slice(1))
                        .join(' ') || 'Usuario Foken'
                    
                    const nuevoUsuario = await crearUsuario(
                        data.user.id,
                        nombreCompleto,
                        email,
                        '' // Teléfono vacío por ahora
                    )
                    
                    if (nuevoUsuario) {
                        console.log('Usuario creado en tabla:', nuevoUsuario)
                        
                        // También crear cuenta y tarjetas si no existen
                        await crearCuentaYTarjetas(data.user.id, nombreCompleto)
                    }
                } else {
                    console.log('Usuario existe en tabla:', usuarioExistente)
                    
                    // 4. Actualizar último acceso
                    console.log('Actualizando último acceso...')
                    await actualizarUltimoAcceso(data.user.id)
                }
                
                // Redirigir a home
                window.location.href = 'home.html'
                
            } catch (error) {
                console.error('Error:', error)
                alert('Error al iniciar sesión. Intenta de nuevo.')
                submitBtn.value = originalValue
                submitBtn.disabled = false
            }
        })
    }
})

// Función auxiliar para crear cuenta y tarjetas
async function crearCuentaYTarjetas(userId, nombreCompleto) {
    const supabase = getSupabase()
    if (!supabase) return null
    
    console.log('Creando cuenta y tarjetas para:', userId)
    
    try {
        // 1. Crear cuenta
        const { data: cuentaData, error: cuentaError } = await supabase
            .from('cuentas')
            .insert([{
                id_usuario: userId,
                saldo: 0,
                tipo_cuenta: 'corriente',
                estado: 'activa'
            }])
            .select()
        
        if (cuentaError) {
            console.error('Error al crear cuenta:', cuentaError)
            return null
        }
        
        console.log('Cuenta creada:', cuentaData[0])
        const idCuenta = cuentaData[0].id_cuenta
        
        // 2. Crear tarjetas
        function generarNumero() {
            let num = '4'
            for (let i = 0; i < 15; i++) num += Math.floor(Math.random() * 10)
            return num
        }
        
        const tarjetas = [
            {
                id_usuario: userId,
                id_cuenta: idCuenta,
                tipo_tarjeta: 'debito',
                marca: 'Visa',
                numero_tarjeta: generarNumero(),
                numero_encripado: '****',
                titular: nombreCompleto,
                fecha_expiracion: '2029-12-31',
                cvv_encripado: '***',
                estado: 'activa'
            },
            {
                id_usuario: userId,
                id_cuenta: idCuenta,
                tipo_tarjeta: 'credito',
                marca: 'Mastercard',
                numero_tarjeta: generarNumero(),
                numero_encripado: '****',
                titular: nombreCompleto,
                fecha_expiracion: '2029-12-31',
                cvv_encripado: '***',
                estado: 'activa'
            }
        ]
        
        const { data: tarjetasData, error: tarjetasError } = await supabase
            .from('tarjetas')
            .insert(tarjetas)
            .select()
        
        if (tarjetasError) {
            console.error('Error al crear tarjetas:', tarjetasError)
            return null
        }
        
        console.log('Tarjetas creadas:', tarjetasData.length)
        return { cuenta: cuentaData[0], tarjetas: tarjetasData }
        
    } catch (error) {
        console.error('Error:', error)
        return null
    }
}