import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";

import "./styles.css";

const Login = () => {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const clearMessages = () => {
    setError("");
  };

  const normalizeErrorMessage = (err, fallbackMessage) => {
    const backendMessage = err?.response?.data?.message;
    if (Array.isArray(backendMessage)) {
      return backendMessage.join(" ");
    }
    if (typeof backendMessage === "string" && backendMessage.trim().length > 0) {
      return backendMessage;
    }
    return fallbackMessage;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    clearMessages();
    setIsLoading(true);

    try {
      const res = await login(loginEmail, loginPassword);
      if (res && res.access_token) {
        navigate("/dashboard");
      } else {
        setError("Respuesta inválida del servidor");
      }
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) {
        setError(
          normalizeErrorMessage(
            err,
            "Credenciales inválidas. Por favor verifica usuario y contraseña.",
          ),
        );
      } else if (status >= 400 && status < 500) {
        setError(normalizeErrorMessage(err, "Solicitud inválida."));
      } else {
        setError("Error del servidor. Intenta nuevamente más tarde.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="loginPageWrapper">
      <div className="loginContainer loginActive">
        <div className="loginHeader">
          <h1 className="titleLogin">Bienvenido</h1>
          <p className="loginSubtitle">Ingresa tus credenciales para continuar</p>
        </div>

        <form className="loginForm" onSubmit={handleLogin}>
          <div className="inputGroup">
            <label htmlFor="loginEmail">Correo electrónico</label>
            <input
              className="loginInput"
              id="loginEmail"
              onChange={(e) => setLoginEmail(e.currentTarget.value)}
              placeholder="ejemplo@dominio.com"
              required
              type="email"
              value={loginEmail}
            />
          </div>

          <div className="inputGroup">
            <label htmlFor="loginPassword">Contraseña</label>
            <input
              className="loginInput"
              id="loginPassword"
              onChange={(e) => setLoginPassword(e.currentTarget.value)}
              placeholder="••••••••"
              required
              type="password" 
              value={loginPassword}
            />
          </div>

          <div className="loginInlineLinkRow">
            <span className="loginInlineLinkLabel">
              El registro de usuarios lo realiza la administración.
            </span>
          </div>

          {error && <div className="loginError">{error}</div>}

          <button className="loginButton" disabled={isLoading} type="submit">
            {isLoading ? "Ingresando..." : "Iniciar Sesión"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
