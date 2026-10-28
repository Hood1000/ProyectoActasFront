/**
 * Indica si el usuario puede votar en la reunión y, si no, por qué. Es el mismo criterio que
 * aplica el backend: reunión en curso, fase de votación abierta y asistencia presente.
 */
export const getVoteState = (meeting, user) => {
  const isRunning = meeting?.status === "EN_CURSO" && !meeting?.isClosed;
  const myEntry = (meeting?.attendance || []).find((entry) => entry.userId === user?.id);

  let reason = "";
  if (!isRunning) {
    reason =
      meeting?.status === "PROGRAMADA"
        ? "Las votaciones se habilitan cuando la reunión esté en curso."
        : "La reunión ya no está en curso: solo puedes consultar los resultados.";
  } else if (!meeting?.votingOpen) {
    reason = "Secretaría aún no ha iniciado la fase de votación.";
  } else if (!myEntry) {
    reason = "No estás convocado a esta reunión: puedes ver los resultados, pero no votar.";
  } else if (myEntry.status !== "PRESENTE") {
    reason = "Para votar tu asistencia debe estar registrada como presente.";
  }

  return { canVote: !reason, isRunning, reason };
};

export const sortPolls = (list) =>
  [...list].sort((a, b) => {
    if (a.status !== b.status) return a.status === "OPEN" ? -1 : 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

export const upsertPoll = (list, poll) => sortPolls([...list.filter((item) => item.id !== poll.id), poll]);
