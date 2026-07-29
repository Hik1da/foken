console.log('supabase.js cargado')

const SUPABASE_URL = 'https://ibrrrbqundkgokhlvuou.supabase.co'
const SUPABASE_KEY = 'sb_publishable_qmpThkeEu1eckP1_fPv7rQ_HG9qxVD_'

export function getSupabase() {
    if (typeof window.supabase === 'undefined') {
        console.error('Supabase no está cargado')
        return null
    }
    const { createClient } = window.supabase
    return createClient(SUPABASE_URL, SUPABASE_KEY)
}

export const logout = async () => {
    const supabase = getSupabase()
    if (!supabase) return false
    const { error } = await supabase.auth.signOut()
    if (error) {
        console.error('Error al cerrar sesión:', error)
        return false
    }
    return true
}

export const crearUsuario = async (userId, nombreCompleto, email, telefono) => {
    const supabase = getSupabase()
    if (!supabase) return null
    try {
        const { data, error } = await supabase
            .from('usuarios')
            .insert([{
                id_usuario: userId,
                nombre_completo: nombreCompleto || 'Usuario Foken',
                email: email,
                telefono: telefono || null,
                fecha_registro: new Date().toISOString(),
                ultimo_acceso: new Date().toISOString(),
                estado: 'activo'
            }])
            .select()
        if (error) {
            console.error('Error al crear usuario:', error)
            return null
        }
        return data[0]
    } catch (error) {
        console.error('Excepción al crear usuario:', error)
        return null
    }
}

export const getUsuarioById = async (userId) => {
    const supabase = getSupabase()
    if (!supabase) return null
    const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id_usuario', userId)
        .single()
    if (error) {
        console.error('Error al obtener usuario:', error)
        return null
    }
    return data
}

export const actualizarUltimoAcceso = async (userId) => {
    const supabase = getSupabase()
    if (!supabase) return null
    const { data, error } = await supabase
        .from('usuarios')
        .update({ ultimo_acceso: new Date().toISOString() })
        .eq('id_usuario', userId)
        .select()
    if (error) {
        console.error('Error al actualizar acceso:', error)
        return null
    }
    return data[0]
}

export const getCuentaByUsuario = async (userId) => {
    const supabase = getSupabase()
    if (!supabase) return null
    const { data, error } = await supabase
        .from('cuentas')
        .select('*')
        .eq('id_usuario', userId)
        .maybeSingle()
    if (error) {
        console.error('Error al obtener cuenta:', error)
        return null
    }
    return data
}

export const getSaldo = async (userId) => {
    const supabase = getSupabase()
    if (!supabase) return 0
    const { data, error } = await supabase
        .from('cuentas')
        .select('saldo')
        .eq('id_usuario', userId)
        .maybeSingle()
    if (error) {
        console.error('Error al obtener saldo:', error)
        return 0
    }
    return data?.saldo || 0
}

export const getTarjetasByUsuario = async (userId) => {
    const supabase = getSupabase()
    if (!supabase) return null
    const { data, error } = await supabase
        .from('tarjetas')
        .select('*')
        .eq('id_usuario', userId)
    if (error) {
        console.error('Error al obtener tarjetas:', error)
        return null
    }
    return data
}

export const getSaldosByUsuario = async (userId) => {
    const supabase = getSupabase()
    if (!supabase) return { debito: 0, credito: 0, creditoDisponible: 0 }
    try {
        const { data: tarjetas, error } = await supabase
            .from('tarjetas')
            .select('tipo_tarjeta, limites')
            .eq('id_usuario', userId)
        if (error) {
            console.error('Error al obtener saldos:', error)
            return { debito: 0, credito: 0, creditoDisponible: 0 }
        }
        console.log('Tarjetas encontradas:', tarjetas)
        const { data: cuenta, error: errorCuenta } = await supabase
            .from('cuentas')
            .select('saldo')
            .eq('id_usuario', userId)
            .maybeSingle()
        const saldoCuenta = cuenta?.saldo || 0
        let creditoTotal = 0
        if (tarjetas && tarjetas.length > 0) {
            tarjetas.forEach(t => {
                console.log('Procesando tarjeta:', t.tipo_tarjeta, t.limites)
                if (t.tipo_tarjeta === 'credito') {
                    if (t.limites && typeof t.limites === 'object') {
                        if (t.limites.credito) {
                            creditoTotal = t.limites.credito
                            console.log('Límite encontrado:', creditoTotal)
                        } else {
                            creditoTotal = 100000
                            console.log('Sin límite, usando default: 100000')
                        }
                    } else {
                        creditoTotal = 100000
                        console.log('Limites es null, usando default: 100000')
                    }
                }
            })
        } else {
            console.log('No se encontraron tarjetas para el usuario')
            creditoTotal = 100000
        }
        if (creditoTotal === 0) {
            creditoTotal = 100000
            console.log('Forzando crédito a 100000 por seguridad')
        }
        const creditoUsado = 0
        const creditoDisponible = Math.max(0, creditoTotal - creditoUsado)
        console.log('Resultado final:', { debito: saldoCuenta, credito: creditoTotal, creditoDisponible })
        return {
            debito: saldoCuenta,
            credito: creditoTotal,
            creditoDisponible: creditoDisponible
        }
    } catch (error) {
        console.error('Error:', error)
        return { debito: 0, credito: 100000, creditoDisponible: 100000 }
    }
}

function generarNumeroTarjeta(tipo) {
    let prefix = tipo === 'debito' ? '4' : '5'
    let numero = prefix
    for (let i = 0; i < 15; i++) {
        numero += Math.floor(Math.random() * 10)
    }
    return numero
}

function generarFechaExpiracion() {
    const fecha = new Date()
    fecha.setFullYear(fecha.getFullYear() + 3)
    return fecha.toISOString().split('T')[0]
}

function generarNIP() {
    return String(Math.floor(1000 + Math.random() * 9000))
}

export const crearCuentaYTarjetas = async (userId, nombreCompleto) => {
    const supabase = getSupabase()
    if (!supabase) return null
    try {
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
        const idCuenta = cuentaData[0].id_cuenta
        const nip = generarNIP()
        const tarjetas = [
            {
                id_usuario: userId,
                id_cuenta: idCuenta,
                tipo_tarjeta: 'debito',
                marca: 'Visa',
                numero_tarjeta: generarNumeroTarjeta('debito'),
                numero_encripado: '****' + generarNumeroTarjeta('debito').slice(-4),
                titular: nombreCompleto,
                fecha_expiracion: generarFechaExpiracion(),
                cvv_encripado: '***',
                estado: 'activa',
                nip: nip,
                limites: { diario: 10000, mensual: 50000 }
            },
            {
                id_usuario: userId,
                id_cuenta: idCuenta,
                tipo_tarjeta: 'credito',
                marca: 'Mastercard',
                numero_tarjeta: generarNumeroTarjeta('credito'),
                numero_encripado: '****' + generarNumeroTarjeta('credito').slice(-4),
                titular: nombreCompleto,
                fecha_expiracion: generarFechaExpiracion(),
                cvv_encripado: '***',
                estado: 'activa',
                nip: nip,
                limites: { diario: 20000, mensual: 100000, credito: 100000 }
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
        return { cuenta: cuentaData[0], tarjetas: tarjetasData }
    } catch (error) {
        console.error('Error:', error)
        return null
    }
}

export const realizarTransferencia = async (idCuentaOrigen, numeroTarjetaDestino, monto, concepto) => {
    const supabase = getSupabase()
    if (!supabase) return { exito: false, error: 'Error de conexión' }
    const { data, error } = await supabase.rpc('realizar_transferencia', {
        p_id_cuenta_origen: idCuentaOrigen,
        p_numero_tarjeta_destino: numeroTarjetaDestino,
        p_monto: monto,
        p_concepto: concepto || 'Transferencia'
    })
    if (error) {
        console.error('Error en transferencia:', error)
        return { exito: false, error: error.message }
    }
    return data
}