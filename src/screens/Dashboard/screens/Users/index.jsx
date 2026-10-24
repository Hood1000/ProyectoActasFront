import React, { useCallback, useEffect, useState } from "react";
import { IconPlus, IconX, IconPencil } from "@tabler/icons-react";
import { useAuth } from "../../../../context/AuthContext";
import usersService from "../../../../api/services/usersService";
import "./styles.css";
import CreateUser from "./CreateUser";

const LOAD_ERROR_MESSAGE =
  "No fue posible cargar la tabla de usuarios en este momento.";
const ACTION_ERROR_MESSAGE =
  "No se pudo completar la accion. Intenta de nuevo.";

const Users = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [confirmToggleUser, setConfirmToggleUser] = useState(null);
  const { user } = useAuth();
  const canManageUsers = user?.role === "ADMIN";

  const mapUserRow = (apiUser) => {
    return {
      cedula: apiUser?.cedula || "",
      condicion: apiUser?.condicion || "",
      dedicacion: apiUser?.dedicacion || "",
      email: apiUser?.email || "",
      id: apiUser?.id,
      isActive: apiUser?.isActive ?? true,
      name: apiUser?.name || "-",
      nombreCompleto: apiUser?.name || "-",
      role: apiUser?.role || "",
    };
  };

  const openEdit = (targetUser) => {
    setActionError(null);
    setEditingUser(targetUser);
  };

  const openConfirmToggle = (targetUser) => {
    setActionError(null);
    setConfirmToggleUser(targetUser);
  };

  const handleToggleActive = async (targetUser) => {
    setActionError(null);
    setActionLoadingId(targetUser.id);

    try {
      let updatedUser;

      if (targetUser.isActive) {
        updatedUser = await usersService.disable(targetUser.id);
      } else {
        updatedUser = await usersService.enable(targetUser.id);
      }

      setUsers((prev) =>
        prev.map((row) =>
          row.id === targetUser.id ? mapUserRow(updatedUser) : row,
        ),
      );
    } catch {
      setActionError(ACTION_ERROR_MESSAGE);
    } finally {
      setActionLoadingId(null);
    }
  };

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const apiUsers = await usersService.list();
      setUsers(Array.isArray(apiUsers) ? apiUsers.map(mapUserRow) : []);
    } catch {
      setError(LOAD_ERROR_MESSAGE);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const confirmToggleActive = async () => {
    if (!confirmToggleUser) return;
    await handleToggleActive(confirmToggleUser);
    setConfirmToggleUser(null);
  };

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  return (
    <div className="usersContainer">
      <header className="usersHeader">
        <div>
          <h2 className="usersTitle">Usuarios</h2>
          <p className="usersSubtitle">
            Registro de participantes habilitados dentro del sistema.
          </p>
        </div>
        <div className="usersActions">
          {canManageUsers && (
            <button
              type="button"
              className={
                showCreate
                  ? "usersCreateBtn usersCreateBtn--secondary"
                  : "usersCreateBtn"
              }
              onClick={() => setShowCreate((s) => !s)}
            >
              {showCreate ? (
                <>
                  <IconX size={18} />
                  Cerrar
                </>
              ) : (
                <>
                  <IconPlus size={18} />
                  Nuevo usuario
                </>
              )}
            </button>
          )}
        </div>
      </header>

      {!canManageUsers && (
        <div className="usersInfo">
          Solo la coordinadora puede registrar o editar usuarios del sistema.
        </div>
      )}

      <div className="usersBody">
        {showCreate && canManageUsers && (
          <CreateUser
            onCancel={() => setShowCreate(false)}
            onSaved={() => {
              setShowCreate(false);
              loadUsers();
            }}
          />
        )}

        {editingUser && canManageUsers && (
          <CreateUser
            initialUser={editingUser}
            mode="edit"
            onCancel={() => setEditingUser(null)}
            onSaved={(updatedUser) => {
              setEditingUser(null);
              setUsers((prev) =>
                prev.map((row) =>
                  row.id === updatedUser.id ? mapUserRow(updatedUser) : row,
                ),
              );
            }}
          />
        )}

        <div className="usersContent">
          {isLoading && <div className="usersInfo">Cargando usuarios...</div>}
          {!isLoading && error && <div className="usersInfo">{error}</div>}
          {!isLoading && actionError && (
            <div className="usersInfo">{actionError}</div>
          )}

          {confirmToggleUser && (
            <>
              <div
                className="usersConfirmBackdrop"
                onClick={() => setConfirmToggleUser(null)}
              />
              <div
                className="usersConfirmModal"
                role="dialog"
                aria-modal="true"
              >
                <h3 className="usersConfirmTitle">
                  {confirmToggleUser.isActive
                    ? "Deshabilitar usuario"
                    : "Habilitar usuario"}
                </h3>
                <p className="usersConfirmText">
                  {confirmToggleUser.isActive
                    ? `Vas a deshabilitar a ${confirmToggleUser.nombreCompleto}. No podrá iniciar sesión hasta ser habilitado de nuevo.`
                    : `Vas a habilitar a ${confirmToggleUser.nombreCompleto}. Recuperará el acceso al sistema.`}
                </p>
                <div className="usersConfirmActions">
                  <button
                    className="usersModalBtn usersModalBtn--secondary"
                    onClick={() => setConfirmToggleUser(null)}
                    type="button"
                  >
                    Cancelar
                  </button>
                  <button
                    className="usersModalBtn usersModalBtn--primary"
                    onClick={confirmToggleActive}
                    type="button"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="usersTableWrap">
            <table className="usersTable">
              <thead>
                <tr>
                  <th>Nombre completo</th>
                  <th>Correo</th>
                  <th>CI</th>
                  <th>Rol</th>
                  <th>Dedicación</th>
                  <th>Condición</th>
                  <th>Estado</th>
                  {canManageUsers && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {!isLoading && users.length === 0 && (
                  <tr>
                    <td colSpan={canManageUsers ? 8 : 7}>
                      No hay usuarios para mostrar.
                    </td>
                  </tr>
                )}

                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.nombreCompleto}</td>
                    <td>{u.email || "-"}</td>
                    <td>{u.cedula || "-"}</td>
                    <td>{u.role || "-"}</td>
                    <td>{u.dedicacion || "-"}</td>
                    <td>{u.condicion || "-"}</td>
                    <td>{u.isActive ? "Activo" : "Inactivo"}</td>
                    {canManageUsers && (
                      <td className="usersActionsCell">
                        <button
                          className={`usersTableBtn ${u.isActive ? "usersTableBtn--disable" : "usersTableBtn--enable"}`}
                          disabled={actionLoadingId === u.id}
                          onClick={() => openConfirmToggle(u)}
                          type="button"
                        >
                          {u.isActive ? "Deshabilitar" : "Habilitar"}
                        </button>
                        <button
                          className="usersTableBtn usersTableBtn--edit"
                          onClick={() => openEdit(u)}
                          type="button"
                        >
                          Editar
                          <IconPencil size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Users;
