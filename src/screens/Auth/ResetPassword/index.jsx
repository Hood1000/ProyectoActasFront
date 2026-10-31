import { useEffect, useRef, useState } from "react";
import { IconArrowLeft, IconEye, IconEyeOff } from "@tabler/icons-react";
import { Link } from "react-router-dom";
import authService from "../../../api/services/authService";
import { clearResetFragment, protectResetPage, readResetToken, validatePassword } from "./utils";
import "../../Dashboard/components/Login/styles.css";
import "./styles.css";

const ResetPassword = () => {
  const [token, setToken] = useState(readResetToken);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");
  const isSubmitting = useRef(false);

  useEffect(() => {
    const restoreReferrer = protectResetPage();
    const handleHashChange = () => {
      const nextToken = readResetToken();
      clearResetFragment();
      setToken(nextToken);
      setPassword("");
      setConfirmation("");
      setError("");
      setIsSubmitted(false);
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      restoreReferrer();
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting.current || !token) return;
    const validationError = validatePassword(password, confirmation);
    setError(validationError);
    if (validationError) return;

    isSubmitting.current = true;
    setIsLoading(true);
    try {
      await authService.resetPassword(token, password);
      setIsSubmitted(true);
      setToken("");
      setPassword("");
      setConfirmation("");
    } catch (requestError) {
      if (requestError.response?.status === 400) {
        setToken("");
        setPassword("");
        setConfirmation("");
      } else if (requestError.response?.status === 429) {
        setError("Demasiados intentos. Espera unos minutos antes de volver a intentarlo.");
      } else {
        setError("No se pudo cambiar la contraseña. Intenta de nuevo más tarde.");
      }
    } finally {
      isSubmitting.current = false;
      setIsLoading(false);
    }
  };

  return (
    <main className="loginPageWrapper resetPasswordPage">
      <section aria-labelledby="resetPasswordTitle" className="loginContainer loginActive">
        <header className="loginHeader">
          <img alt="Universidad Politécnica Territorial José Félix Ribas" height={72} src={`${import.meta.env.BASE_URL}favicon.svg`} width={72} />
          <h1 className="titleLogin" id="resetPasswordTitle">Restablecer contraseña</h1>
        </header>

        {isSubmitted ? (
          <p className="loginSuccess" role="status">
            Contraseña actualizada. Ya puedes iniciar sesión con tu nueva contraseña.
          </p>
        ) : !token ? (
          <div className="resetPasswordInvalid">
            <p className="loginError" role="alert">
              El enlace no es válido, ha expirado o ya fue utilizado.
            </p>
            <Link className="loginInlineLink" to="/recuperar-contrasena">Solicitar otro enlace</Link>
          </div>
        ) : (
          <form aria-busy={isLoading} className="loginForm" onSubmit={handleSubmit}>
            <div className="inputGroup">
              <label htmlFor="resetPassword">Nueva contraseña</label>
              <div className="resetPasswordField">
                <input
                  aria-describedby="resetPasswordHint"
                  autoComplete="new-password"
                  className="loginInput"
                  disabled={isLoading}
                  id="resetPassword"
                  minLength={6}
                  name="password"
                  onChange={(event) => setPassword(event.currentTarget.value)}
                  required
                  type={isVisible ? "text" : "password"}
                  value={password}
                />
                <button
                  aria-controls="resetPassword resetConfirmation"
                  aria-label={isVisible ? "Ocultar contraseñas" : "Mostrar contraseñas"}
                  aria-pressed={isVisible}
                  className="resetPasswordToggle"
                  onClick={() => setIsVisible((previous) => !previous)}
                  title={isVisible ? "Ocultar contraseñas" : "Mostrar contraseñas"}
                  type="button"
                >
                  {isVisible ? <IconEyeOff aria-hidden="true" size={20} /> : <IconEye aria-hidden="true" size={20} />}
                </button>
              </div>
              <p className="resetPasswordHint" id="resetPasswordHint">Mínimo 6 caracteres, máximo 72 bytes UTF-8.</p>
            </div>
            <div className="inputGroup">
              <label htmlFor="resetConfirmation">Confirmar contraseña</label>
              <input
                autoComplete="new-password"
                className="loginInput"
                disabled={isLoading}
                id="resetConfirmation"
                minLength={6}
                name="passwordConfirmation"
                onChange={(event) => setConfirmation(event.currentTarget.value)}
                required
                type={isVisible ? "text" : "password"}
                value={confirmation}
              />
            </div>
            {error && <div className="loginError" role="alert">{error}</div>}
            <button className="loginButton" disabled={isLoading} type="submit">
              {isLoading ? "Guardando..." : "Guardar contraseña"}
            </button>
          </form>
        )}

        <Link className="loginInlineLink resetPasswordBack" to="/">
          <IconArrowLeft aria-hidden="true" size={18} />
          Volver al inicio de sesión
        </Link>
      </section>
    </main>
  );
};

export default ResetPassword;