const formulario = document.getElementById("login-form");
const email = document.getElementById("email");
const senha = document.getElementById("senha");
const feedback = document.getElementById("login-feedback");
const togglePassword = document.getElementById("toggle-password");

togglePassword.addEventListener("click", () => {
  const mostrarSenha = senha.type === "password";

  senha.type = mostrarSenha ? "text" : "password";

  togglePassword.setAttribute(
    "aria-label",
    mostrarSenha ? "Ocultar senha" : "Mostrar senha"
  );

  const icone = togglePassword.querySelector("i");

  icone.className = mostrarSenha
    ? "fa-regular fa-eye-slash"
    : "fa-regular fa-eye";
});

formulario.addEventListener("submit", (evento) => {
  evento.preventDefault();

  feedback.textContent = "";

  if (!email.value.trim() || !senha.value) {
    feedback.textContent = "Preencha todos os campos.";
    return;
  }

  if (!email.validity.valid) {
    feedback.textContent = "Digite um e-mail válido.";
    return;
  }

  // Navegação demonstrativa, sem autenticação real.
  window.location.href = "painel.html";
});