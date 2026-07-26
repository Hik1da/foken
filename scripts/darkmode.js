function toggleDarkMode() {
    let element = document.body;
    element.classList.toggle("dark-mode");
    if(element.classList.contains("dark-mode"))
        localStorage.setItem("darkMode", "enabled");
    else
        localStorage.setItem("darkMode", "disabled");
}

function loadDarkModePreference() {
    let darkMode = localStorage.getItem("darkMode");
    if(darkMode === "enabled")
        document.body.classList.add("dark-mode");
}

document.addEventListener("DOMContentLoaded", () => {
    document.body.classList.add("no-transition");
    loadDarkModePreference();
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            document.body.classList.remove("no-transition");
        })
    });
});