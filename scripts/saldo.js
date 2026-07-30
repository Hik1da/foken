let saldoVisible = true;

const saldoReal = "$231.23";

function toggleSaldo() {
    const saldo = document.getElementById("saldoTexto");
    const ojo = document.getElementById("toggleSaldo");

    if (saldoVisible) {
        saldo.textContent = "••••••";
        ojo.src = "assets/flat-icons/eye-open.png";
    } else {
        saldo.textContent = saldoReal;
        ojo.src = "assets/flat-icons/eye-close.png";
    }

    saldoVisible = !saldoVisible;
}