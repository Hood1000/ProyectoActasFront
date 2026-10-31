import { useRef, useState } from "react";
import { IconArrowLeft } from "@tabler/icons-react";
import { Link } from "react-router-dom";
import authService from "../../../api/services/authService";
import "../../Dashboard/components/Login/styles.css";
import "./styles.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");
  const isSubmitting = useRef(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    setIsLoading(true);
    setError("");

    try {
      await authService.forgotPassword(email.trim());
      setIsSubmitted(true);
      setEmail("");
    } catch (requestError) {
      if (requestError.response?.status === 429) {
        setError("Demasiados intentos. Espera unos minutos antes de volver a intentarlo.");
      } else {
        setError("No se pudo completar la solicitud. Intenta de nuevo más tarde.");
      }
    } finally {
      isSubmitting.current = false;
      setIsLoading(false);
    }
  };

  return (
    <main className="loginPageWrapper forgotPasswordPage">
      <section aria-labelledby="forgotPasswordTitle" className="loginContainer loginActive">
        <header className="loginHeader">
          <img alt="Universidad Politécnica Territorial José Félix Ribas" height={72} src={`${import.meta.env.BASE_URL}favicon.svg`} width={72} />
          <h1 className="titleLogin" id="forgotPasswordTitle">Recuperar contraseña</h1>
        </header>

        {isSubmitted ? (
          <p className="loginSuccess" role="status">
            Si existe una cuenta habilitada, recibirás las instrucciones para recuperar tu contraseña.
          </p>
        ) : (
          <form aria-busy={isLoading} className="loginForm" onSubmit={handleSubmit}>
            <div className="inputGroup">
              <label htmlFor="recoveryEmail">Correo electrónico</label>
              <input
                autoComplete="email"
                className="loginInput"
                disabled={isLoading}
                id="recoveryEmail"
                name="email"
                onChange={(event) => setEmail(event.currentTarget.value)}
                required
                type="email"
                value={email}
              />
            </div>
            {error && <div className="loginError" role="alert">{error}</div>}
            <button className="loginButton" disabled={isLoading} type="submit">
              {isLoading ? "Enviando..." : "Enviar enlace"}
            </button>
          </form>
        )}

        <Link className="loginInlineLink forgotPasswordBack" to="/">
          <IconArrowLeft aria-hidden="true" size={18} />
          Volver al inicio de sesión
        </Link>
      </section>
    </main>
  );
};

export default ForgotPassword;