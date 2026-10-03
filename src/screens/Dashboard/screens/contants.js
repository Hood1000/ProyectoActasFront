export const mockUsers = [
	{ id: 1, nombre: "Juan", apellido: "Rodríguez", ci: "6845123", categoria: "Docente", condicion: "Titular", email: "juan.rodriguez@upt.edu.bo", role: "DOCENTE" },
	{ id: 2, nombre: "María", apellido: "López", ci: "7123984", categoria: "Docente", condicion: "Interina", email: "maria.lopez@upt.edu.bo", role: "DOCENTE" },
	{ id: 3, nombre: "Carlos", apellido: "Fernández", ci: "5987451", categoria: "Docente", condicion: "Titular", email: "carlos.fernandez@upt.edu.bo", role: "DOCENTE" },
	{ id: 4, nombre: "Ana", apellido: "Sánchez", ci: "8321456", categoria: "Secretario", condicion: "Asignado", email: "ana.sanchez@upt.edu.bo", role: "SECRETARIO" },
	{ id: 5, nombre: "Silvia", apellido: "Rojas", ci: "4561237", categoria: "Coordinadora", condicion: "Activa", email: "silvia.rojas@upt.edu.bo", role: "ADMIN" },
];

export const mockAdmin = {
	id: 999,
	nombre: "Coordinadora",
	apellido: "Sistema",
	ci: "0000000",
	categoria: "Coordinadora",
	condicion: "Activa",
	email: "admin@upt.local",
	role: "ADMIN",
	token: "mock-admin-token",
	password: "admin123"
};

