document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const usuario = document.getElementById("usuario").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorText = document.getElementById("error");

  try {
    const res = await fetch("http://localhost:8000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario, password })
    });

    const data = await res.json();

    if (!res.ok) {
      errorText.textContent = data.error || "Error de autenticación";
      return;
    }

    // Guardar el token
    localStorage.setItem("token", data.token);
    localStorage.setItem("usuario", data.usuario);
    localStorage.setItem("registro", data.registro);

    // Redirigir al home
    window.location.href = "/home.html";
  } catch (err) {
    errorText.textContent = "Error de conexión con el servidor.";
    console.error(err);
  }
});
