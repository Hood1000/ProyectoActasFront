import React, { useEffect, useMemo, useState } from "react";
import {
  IconBriefcase,
  IconCertificate,
  IconDeviceFloppy,
  IconId,
  IconMail,
  IconPhone,
} from "@tabler/icons-react";
import { useAuth } from "../../../../context/AuthContext";
import usersService from "../../../../api/services/usersService";
import "./styles.css";

const EMPTY_FORM = {
  cedula: "",
  email: "",
  name: "",
  phoneNumber: "",
};

const Profile = () => {
  const { user, updateLocalUser } = useAuth();
  const [formValues, setFormValues] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const currentUser = await usersService.getMe();
        if (currentUser) {
          updateLocalUser(currentUser);
        }
      } catch {
        // Keep local cached user data if profile fetch fails.
      }
    };

    loadProfile();
  }, []);

  useEffect(() => {
    setFormValues({
      cedula: user?.cedula || "",
      email: user?.email || "",
      name: user?.name || "",
      phoneNumber: user?.phoneNumber || "",
    });
  }, [user]);

  const roleLabel = useMemo(() => {
    const roleMap = {
      ADMIN: "Coordinadora",
      DOCENTE: "Docente",
      SECRETARIO: "Secretario",
    };

    return roleMap[user?.role] || user?.role || "Usuario";
  }, [user?.role]);

  const handleChange = (event) => {
    const { name, value } = event.currentTarget;

    setFormValues((previous) => ({
      ...previous,
      [name]: value,
    }));
    setMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setIsSaving(true);
    setMessage("");

    try {
      const payload = {
        cedula: formValues.cedula.trim() || undefined,
        email: formValues.email.trim() || undefined,
        name: formValues.name.trim() || undefined,
        phoneNumber: formValues.phoneNumber.trim() || undefined,
      };

      const updatedUser = await usersService.updateProfile(payload);
      updateLocalUser(updatedUser);
      setMessage("Perfil actualizado correctamente.");
    } catch (err) {
      setMessage(
        err?.response?.data?.message ||
          "No se pudo actualizar el perfil. Verifica los datos e intenta nuevamente.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="profilePage">
      <header className="profileHeader">
        <div className="profileHeaderInfo">
          <span className="profileEyebrow">Mi Perfil</span>
          <h2 className="profileTitle">{user?.name || "Usuario"}</h2>
          <p className="profileSubtitle">
            <IconMail size={16} /> {user?.email || "Sin correo registrado"}
          </p>
          <div className="profileHeaderChips">
            <span className="profileRoleBadge">{roleLabel}</span>
            <span className="profileChip">
              <IconId size={15} /> {user?.cedula || "Cédula no registrada"}
            </span>
            <span className="profileChip">
              <IconPhone size={15} /> {user?.phoneNumber || "Teléfono no registrado"}
            </span>
          </div>
        </div>
      </header>

      <form className="profileFormCard" onSubmit={handleSubmit}>
        <div className="profileFormHeader">
          <div>
            <h3 className="profileSectionTitle">Datos editables</h3>
            <p className="profileSectionText">
              Mantén tu información actualizada para el uso interno del sistema.
            </p>
          </div>
        </div>

        <div className="profileGrid">
          <div className="profileField">
            <label htmlFor="profile-name">Nombre completo</label>
            <input
              id="profile-name"
              name="name"
              onChange={handleChange}
              placeholder="Ingresa tu nombre completo"
              value={formValues.name}
            />
          </div>

          <div className="profileField">
            <label htmlFor="profile-email">Correo electrónico</label>
            <input
              autoComplete="off"
              id="profile-email"
              name="email"
              onChange={handleChange}
              placeholder="ejemplo@dominio.com"
              type="email"
              value={formValues.email}
            />
          </div>

          <div className="profileField">
            <label htmlFor="profile-cedula">Cédula</label>
            <input
              id="profile-cedula"
              name="cedula"
              onChange={handleChange}
              placeholder="Ej: 11707696"
              value={formValues.cedula}
            />
          </div>

          <div className="profileField">
            <label htmlFor="profile-phone">Número de teléfono</label>
            <input
              id="profile-phone"
              name="phoneNumber"
              onChange={handleChange}
              placeholder="Ej: 0414-1234567"
              value={formValues.phoneNumber}
            />
          </div>
        </div>

        <section className="profileReadOnlySection">
          <div className="profileFormHeader">
            <div>
              <h3 className="profileSectionTitle">Información institucional</h3>
              <p className="profileSectionText">
                Datos referenciales disponibles para consulta dentro del perfil.
              </p>
            </div>
          </div>

          <div className="profileReadOnlyGrid">
            <article className="profileReadOnlyCard">
              <span className="profileReadOnlyIcon">
                <IconBriefcase size={22} />
              </span>
              <span className="profileReadOnlyLabel">Dedicación</span>
              <strong className="profileReadOnlyValue">
                {user?.dedicacion || "No registrada"}
              </strong>
            </article>

            <article className="profileReadOnlyCard profileReadOnlyCard--accent">
              <span className="profileReadOnlyIcon">
                <IconCertificate size={22} />
              </span>
              <span className="profileReadOnlyLabel">Condición</span>
              <strong className="profileReadOnlyValue">
                {user?.condicion || "No registrada"}
              </strong>
            </article>
          </div>
        </section>

        {message && <div className="profileMessage">{message}</div>}

        <div className="profileActions">
          <button className="profileSaveBtn" disabled={isSaving} type="submit">
            <IconDeviceFloppy size={18} />
            {isSaving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </section>
  );
};

export default Profile;
