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
            .select('tipo_tarjeta, limite_credito')
            .eq('id_usuario', userId)
        if (error) {
            console.error('Error al obtener saldos:', error)
            return { debito: 0, credito: 0, creditoDisponible: 0 }
        }
        const { data: cuenta } = await supabase
            .from('cuentas')
            .select('saldo')
            .eq('id_usuario', userId)
            .maybeSingle()

        const saldoCuenta = cuenta?.saldo || 0
        const tarjetaCredito = tarjetas?.find(t => t.tipo_tarjeta === 'credito')
        const creditoTotal = tarjetaCredito?.limite_credito || 100000

        return {
            debito: saldoCuenta,
            credito: creditoTotal,
            creditoDisponible: creditoTotal
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
                limite_diario: 10000,
                limite_mensual: 50000
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
                limite_diario: 20000,
                limite_mensual: 100000,
                limite_credito: 100000
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

export const realizarTransferencia = async (idCuentaOrigen, idTarjetaOrigen, numeroTarjetaDestino, monto, concepto) => {
    const supabase = getSupabase()
    if (!supabase) return { exito: false, error: 'Error de conexión' }
    const { data, error } = await supabase.rpc('realizar_transferencia', {
        p_id_cuenta_origen: idCuentaOrigen,
        p_id_tarjeta_origen: idTarjetaOrigen,
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

// Suma un monto al saldo actual de la cuenta (depósito por transferencia CLABE).
// Nota: hace lectura + escritura desde el cliente, no es una operación atómica.
// Si más adelante quieres blindarlo contra condiciones de carrera, lo ideal
// sería moverlo a una función RPC en Supabase, similar a "realizar_transferencia".
export const realizarDeposito = async (idCuenta, monto) => {
    const supabase = getSupabase()
    if (!supabase) return { exito: false, error: 'Error de conexión' }
    try {
        const { data: cuentaActual, error: errorLectura } = await supabase
            .from('cuentas')
            .select('saldo')
            .eq('id_cuenta', idCuenta)
            .single()

        if (errorLectura || !cuentaActual) {
            console.error('Error al leer la cuenta:', errorLectura)
            return { exito: false, error: errorLectura?.message || 'No se encontró la cuenta' }
        }

        const nuevoSaldo = Number(cuentaActual.saldo) + Number(monto)

        const { data, error } = await supabase
            .from('cuentas')
            .update({ saldo: nuevoSaldo })
            .eq('id_cuenta', idCuenta)
            .select()

        if (error) {
            console.error('Error al depositar:', error)
            return { exito: false, error: error.message }
        }

        return { exito: true, saldo_nuevo: data[0].saldo }
    } catch (error) {
        console.error('Excepción al depositar:', error)
        return { exito: false, error: error.message }
    }
}

// Convierte crédito disponible en saldo de la cuenta de débito:
// aumenta credito_usado en la tarjeta y suma el monto al saldo de la cuenta.
// También registra un movimiento para que aparezca en movements.html y notifications.html.
export const realizarConversionCreditoADebito = async (idCuenta, idTarjetaCredito, monto) => {
    const supabase = getSupabase()
    if (!supabase) return { exito: false, error: 'Error de conexión' }
    try {
        const { data: tarjeta, error: errorTarjeta } = await supabase
            .from('tarjetas')
            .select('credito_usado, limite_credito, estado')
            .eq('id_tarjeta', idTarjetaCredito)
            .single()

        if (errorTarjeta || !tarjeta) {
            return { exito: false, error: errorTarjeta?.message || 'No se encontró la tarjeta de crédito' }
        }
        if (tarjeta.estado === 'bloqueada') {
            return { exito: false, error: 'Tu tarjeta de crédito está bloqueada' }
        }

        const limite = Number(tarjeta.limite_credito) || 100000
        const usado = Number(tarjeta.credito_usado) || 0
        const disponible = limite - usado

        if (monto > disponible) {
            return { exito: false, error: 'No tienes crédito disponible suficiente' }
        }

        const { error: errorTarjetaUpdate } = await supabase
            .from('tarjetas')
            .update({ credito_usado: usado + monto })
            .eq('id_tarjeta', idTarjetaCredito)

        if (errorTarjetaUpdate) {
            return { exito: false, error: errorTarjetaUpdate.message }
        }

        const deposito = await realizarDeposito(idCuenta, monto)
        if (!deposito.exito) {
            return deposito
        }

        const { error: errorMovimiento } = await supabase
            .from('movimientos')
            .insert([{
                id_cuenta_origen: null,
                id_cuenta_destino: idCuenta,
                id_tarjeta: idTarjetaCredito,
                tipo_movimiento: 'deposito',
                estado: 'completado',
                monto: monto,
                moneda: 'MXN',
                concepto: 'Conversión de crédito a saldo',
                saldo_posterior: deposito.saldo_nuevo,
                fecha_movimiento: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }])

        if (errorMovimiento) {
            console.error('Error al registrar el movimiento de conversión:', errorMovimiento)
        }

        return {
            exito: true,
            saldo_nuevo: deposito.saldo_nuevo,
            credito_disponible_nuevo: disponible - monto,
            movimiento_registrado: !errorMovimiento,
            movimiento_error: errorMovimiento?.message || null
        }
    } catch (error) {
        console.error('Excepción al convertir crédito a saldo:', error)
        return { exito: false, error: error.message }
    }
}

export const getContactosByUsuario = async (userId) => {
    const supabase = getSupabase()
    if (!supabase) return []
    const { data, error } = await supabase
        .from('contactos')
        .select('*')
        .eq('id_usuario', userId)
        .order('nombre_contacto', { ascending: true })
    if (error) {
        console.error('Error al obtener contactos:', error)
        return []
    }
    return data
}

export const guardarContacto = async (userId, nombreContacto, numeroTarjeta) => {
    const supabase = getSupabase()
    if (!supabase) return null
    const { data, error } = await supabase
        .from('contactos')
        .upsert(
            { id_usuario: userId, nombre_contacto: nombreContacto, numero_tarjeta: numeroTarjeta },
            { onConflict: 'id_usuario,numero_tarjeta' }
        )
        .select()
    if (error) {
        console.error('Error al guardar contacto:', error)
        return null
    }
    return data[0]
}

// Trae todos los movimientos (enviados y recibidos) de la cuenta del usuario,
// resolviendo el nombre de la contraparte y formateando los datos que
// necesita la pantalla movements.html
export const getMovimientosByUsuario = async (userId) => {
    const supabase = getSupabase()
    if (!supabase) return []

    const cuenta = await getCuentaByUsuario(userId)
    if (!cuenta) return []

    const idCuenta = cuenta.id_cuenta

    const { data: movimientos, error } = await supabase
        .from('movimientos')
        .select('*')
        .or(`id_cuenta_origen.eq.${idCuenta},id_cuenta_destino.eq.${idCuenta}`)
        .order('fecha_movimiento', { ascending: false })

    if (error) {
        console.error('Error al obtener movimientos:', error)
        return []
    }
    if (!movimientos || movimientos.length === 0) return []

    // Junta los ids de las cuentas "contraparte" para buscar el nombre de su dueño
    const idsCuentasContraparte = new Set()
    movimientos.forEach(m => {
        const esOrigen = m.id_cuenta_origen === idCuenta
        const contraparte = esOrigen ? m.id_cuenta_destino : m.id_cuenta_origen
        if (contraparte) idsCuentasContraparte.add(contraparte)
    })

    let nombrePorCuenta = {}
    if (idsCuentasContraparte.size > 0) {
        const { data: cuentasContraparte, error: errorCuentas } = await supabase
            .from('cuentas')
            .select('id_cuenta, id_usuario')
            .in('id_cuenta', Array.from(idsCuentasContraparte))

        if (!errorCuentas && cuentasContraparte && cuentasContraparte.length > 0) {
            const idsUsuarios = [...new Set(cuentasContraparte.map(c => c.id_usuario))]
            const { data: usuarios, error: errorUsuarios } = await supabase
                .from('usuarios')
                .select('id_usuario, nombre_completo')
                .in('id_usuario', idsUsuarios)

            const nombrePorUsuario = {}
            if (!errorUsuarios) {
                (usuarios || []).forEach(u => {
                    nombrePorUsuario[u.id_usuario] = u.nombre_completo
                })
            }

            cuentasContraparte.forEach(c => {
                nombrePorCuenta[c.id_cuenta] = nombrePorUsuario[c.id_usuario] || 'Cuenta Foken'
            })
        }
    }

    // Formatea cada movimiento con lo que necesita la UI
    return movimientos.map(m => {
        const esOrigen = m.id_cuenta_origen === idCuenta
        const idContraparte = esOrigen ? m.id_cuenta_destino : m.id_cuenta_origen
        const nombreContraparte = nombrePorCuenta[idContraparte] || 'Foken'
        const monto = esOrigen ? -Math.abs(Number(m.monto)) : Math.abs(Number(m.monto))
        const tipoDisplay = esOrigen ? 'Transferencia enviada' : 'Depósito recibido'

        const fecha = new Date(m.fecha_movimiento)
        const fechaCorta = fecha.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
        const fechaLarga = fecha.toLocaleString('es-MX', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: 'numeric', minute: '2-digit', hour12: true
        })

        return {
            id: m.id_movimiento,
            tipo: tipoDisplay,
            nombre: nombreContraparte,
            monto,
            fecha: fechaLarga,
            fechaISO: m.fecha_movimiento,
            fechaCorta,
            categoria: esOrigen ? 'Transferencia enviada' : 'Transferencia recibida',
            cuenta: nombreContraparte,
            mensaje: m.concepto || 'Transferencia',
            folio: m.referencia || m.id_movimiento,
            estado: m.estado
        }
    })
}