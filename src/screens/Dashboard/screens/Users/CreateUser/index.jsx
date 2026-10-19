import React, { useState, useEffect, useRef } from "react";
import { IconX } from "@tabler/icons-react";
import usersService from "../../../../../api/services/usersService";
import { conditionOptions, dedicationOptions, roleOptions } from "../constants";
import "./styles.css";

const CreateUser = ({ initialUser, mode = "create", onCancel, onSaved }) => {
  const isEditMode = mode === "edit";
  const [email, setEmail] = useState("");
  const [dedicacion, setDedicacion] = useState("");
  const [role, setRole] = useState("DOCENTE");
  const [condicion, setCondicion] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => setOpen(true));
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    if (!initialUser) return;

    setEmail(initialUser.email || "");
    setDedicacion(initialUser.dedicacion || "");
    setRole(initialUser.role || "DOCENTE");
    setCondicion(initialUser.condicion || "");
  }, [initialUser]);

  const close = () => {
    setOpen(false);
    setTimeout(() => {
      if (onCancel) onCancel();
    }, 220);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (isEditMode && initialUser?.id) {
        const payload = {
          condicion: condicion.trim() || undefined,
          dedicacion: dedicacion || undefined,
          role: role || undefined,
        };

        const updatedUser = await usersService.updateAsAdmin(initialUser.id, payload);
        setSuccess("Usuario actualizado correctamente.");

        if (onSaved) onSaved(updatedUser);
      } else {
        const createdUser = await usersService.create({
          condicion: condicion || undefined,
          dedicacion: dedicacion || undefined,
          email: email.trim(),
          password,
          role: role || "DOCENTE",
        });

        setSuccess("Usuario creado correctamente.");
        setEmail("");
        setDedicacion("");
        setRole("DOCENTE");
        setCondicion("");
        setPassword("");

        if (onSaved) onSaved(createdUser);
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          (isEditMode ? "Error al actualizar usuario" : "Error al crear usuario"),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className={`createUserBackdrop ${open ? "open" : ""}`} onClick={close} />
      <aside
        ref={panelRef}
        className={`createUserPanel ${open ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="createUserHeader">
          <div>
            <h3>{isEditMode ? "Editar Usuario" : "Crear Usuario"}</h3>
            <p>
              {isEditMode
                ? "Actualiza la información institucional del usuario."
                : "La coordinación crea el acceso inicial y luego el usuario completa su perfil."}
            </p>
          </div>
          <button className="closeBtn" onClick={close} aria-label="Cerrar panel" type="button">
            <IconX size={20} color="#667085" />
          </button>
        </div>

        <form autoComplete="off" className="createUserForm" onSubmit={handleSubmit}>
          <label>Rol</label>
          <select onChange={(e) => setRole(e.target.value)} required value={role}>
            {roleOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <label>Dedicación</label>
          <select
            value={dedicacion}
            onChange={(e) => setDedicacion(e.target.value)}
            required
          >
            <option value="">Selecciona una dedicación</option>
            {dedicationOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <label>Condición</label>
          <select
            value={condicion}
            onChange={(e) => setCondicion(e.target.value)}
            required
          >
            <option value="">Selecciona una condición</option>
            {conditionOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          {!isEditMode && (
            <>
              <label>Correo del nuevo usuario</label>
              <input
                autoComplete="off"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@example.com"
                required
                type="email"
                value={email}
              />
              <label>Contraseña temporal</label>
              <input
                autoComplete="new-password"
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña de primer acceso"
                required
                type="password"
                value={password}
              />
            </>
          )}

          {error && <div className="formError">{error}</div>}
          {success && <div className="formSuccess">{success}</div>}

          <div className="formActions">
            <button
              type="submit"
              disabled={loading}
              className="createUserActionBtn createUserPrimaryBtn"
            >
              {loading ? (isEditMode ? "Guardando..." : "Creando...") : isEditMode ? "Guardar" : "Crear"}
            </button>
            <button
              type="button"
              onClick={close}
              className="createUserActionBtn createUserSecondaryBtn"
            >
              Cancelar
            </button>
          </div>
        </form>
      </aside>
    </>
  );
};

export default CreateUser;
