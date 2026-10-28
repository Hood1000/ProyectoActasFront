import meetingsService from "../api/services/meetingsService";

export const MAX_EVIDENCE_BYTES = 15 * 1024 * 1024;

/**
 * Abre el acta firmada con una URL firmada de corta duración. La pestaña se abre antes
 * de pedir la URL para que el navegador no la bloquee como ventana emergente.
 */
export const openMeetingEvidence = async (meetingId) => {
  const tab = window.open("", "_blank");
  try {
    const { url } = await meetingsService.getEvidenceUrl(meetingId);
    if (tab) {
      tab.opener = null;
      tab.location.href = url;
    } else {
      window.location.assign(url);
    }
  } catch (err) {
    tab?.close();
    throw err;
  }
};
