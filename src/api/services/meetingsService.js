import axios from "axios";
import axiosClient from "../axiosClient";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const list = async () => {
  const resp = await axiosClient.get("/meetings");
  return resp.data || [];
};

const getById = async (meetingId) => {
  const resp = await axiosClient.get(`/meetings/${meetingId}`);
  return resp.data;
};

const create = async (payload) => {
  const resp = await axiosClient.post("/meetings", payload);
  return resp.data || resp;
};

const update = async (meetingId, payload) => {
  const resp = await axiosClient.patch(`/meetings/${meetingId}`, payload);
  return resp.data || resp;
};

const cancel = async (meetingId, reason) => {
  const resp = await axiosClient.post(`/meetings/${meetingId}/cancel`, { reason });
  return resp.data || resp;
};

const getAvailableAgenda = async (meetingId) => {
  const resp = await axiosClient.get("/meetings/agenda/available", {
    params: meetingId ? { meetingId } : {},
  });
  return resp.data;
};

const proposePoint = async (meetingId, payload) => {
  const resp = await axiosClient.post(`/meetings/${meetingId}/proposals`, payload);
  return resp.data || resp;
};

const reviewPoint = async (meetingId, pointId, payload) => {
  const resp = await axiosClient.patch(
    `/meetings/${meetingId}/proposals/${pointId}/review`,
    payload,
  );
  return resp.data || resp;
};

const consolidateAgenda = async (meetingId) => {
  const resp = await axiosClient.post(`/meetings/${meetingId}/agenda/consolidate`);
  return resp.data || resp;
};

const uploadEvidenceFile = async (meetingId, file) => {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("file", file);
  const resp = await axios.post(
    `${API_URL}/meetings/${meetingId}/evidence/upload`,
    formData,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return resp.data || resp;
};

const getEvidenceUrl = async (meetingId) => {
  const resp = await axiosClient.get(`/meetings/${meetingId}/evidence/url`);
  return resp.data;
};

const startVoting = async (meetingId) => {
  const resp = await axiosClient.post(`/meetings/${meetingId}/voting/start`);
  return resp.data || resp;
};

const closeMeeting = async (meetingId) => {
  const resp = await axiosClient.post(`/meetings/${meetingId}/close`);
  return resp.data || resp;
};

const confirmAttendance = async (meetingId) => {
  const resp = await axiosClient.post(`/meetings/${meetingId}/attendance/confirm`);
  return resp.data || resp;
};

const closeAnnualYear = async (year) => {
  const resp = await axiosClient.post('/meetings/annual-close', { year });
  return resp.data || resp;
};

const listAnnualArchives = async () => {
  const resp = await axiosClient.get('/meetings/annual-archives');
  return resp.data || [];
};

const getAnnualArchiveData = async (year) => {
  const resp = await axiosClient.get(`/meetings/annual-archives/${year}/data`);
  return resp.data || resp;
};

const downloadAnnualReportPdf = async (year) => {
  const resp = await axiosClient.get(`/meetings/annual-archives/${year}/pdf`, {
    responseType: "blob",
  });
  return resp.data;
};

const listAbsenceAlerts = async () => {
  const resp = await axiosClient.get('/meetings/absence-alerts');
  return resp.data || [];
};

const reviewAbsenceAlert = async (alertId, payload) => {
  const resp = await axiosClient.patch(`/meetings/absence-alerts/${alertId}/review`, payload);
  return resp.data || resp;
};

const listNotifications = async () => {
  const resp = await axiosClient.get('/meetings/notifications');
  return resp.data || [];
};

const markNotificationAsRead = async (recipientId) => {
  const resp = await axiosClient.post(`/meetings/notifications/${recipientId}/read`);
  return resp.data || resp;
};

const markAllNotificationsAsRead = async () => {
  const resp = await axiosClient.post('/meetings/notifications/read-all');
  return resp.data || resp;
};

const dismissNotification = async (recipientId) => {
  const resp = await axiosClient.delete(`/meetings/notifications/${recipientId}`);
  return resp.data || resp;
};

const listMeetingChatMessages = async (meetingId, params) => {
  const resp = await axiosClient.get(`/meetings/${meetingId}/chat`, { params });
  return resp.data || [];
};

const postMeetingChatMessage = async (meetingId, payload) => {
  const resp = await axiosClient.post(`/meetings/${meetingId}/chat`, payload);
  return resp.data || resp;
};

const listMeetingPolls = async (meetingId) => {
  const resp = await axiosClient.get(`/meetings/${meetingId}/polls`);
  return resp.data || [];
};

const createMeetingPoll = async (meetingId, payload) => {
  const resp = await axiosClient.post(`/meetings/${meetingId}/polls`, payload);
  return resp.data || resp;
};

const voteMeetingPoll = async (meetingId, pollId, option) => {
  const resp = await axiosClient.post(`/meetings/${meetingId}/polls/${pollId}/vote`, { option });
  return resp.data || resp;
};

const closeMeetingPoll = async (meetingId, pollId) => {
  const resp = await axiosClient.post(`/meetings/${meetingId}/polls/${pollId}/close`);
  return resp.data || resp;
};

const markAttendance = async (meetingId, userId, payload) => {
  const resp = await axiosClient.patch(`/meetings/${meetingId}/attendance/${userId}`, payload);
  return resp.data || resp;
};

const finalizeAttendance = async (meetingId) => {
  const resp = await axiosClient.post(`/meetings/${meetingId}/attendance/finalize`);
  return resp.data || resp;
};

const getAttendanceSummary = async (params, config = {}) =>
  (await axiosClient.get('/meetings/attendance/history', { ...config, params })).data;

const getTeacherAttendanceHistory = async (teacherId, params, config = {}) =>
  (await axiosClient.get(`/meetings/attendance/history/${teacherId}`, { ...config, params })).data;

const listAbsenceCases = async (params, config = {}) =>
  (await axiosClient.get('/meetings/absence-cases', { ...config, params })).data;

const listWarnings = async (params, config = {}) =>
  (await axiosClient.get('/meetings/warnings', { ...config, params })).data;

const issueWarning = async (teacherId, payload) =>
  (await axiosClient.post(`/meetings/absence-cases/${teacherId}/warning`, payload)).data;

export default {
  cancel,
  closeAnnualYear,
  closeMeeting,
  closeMeetingPoll,
  confirmAttendance,
  consolidateAgenda,
  create,
  createMeetingPoll,
  dismissNotification,
  downloadAnnualReportPdf,
  finalizeAttendance,
  getAnnualArchiveData,
  getAttendanceSummary,
  getAvailableAgenda,
  getById,
  getEvidenceUrl,
  getTeacherAttendanceHistory,
  issueWarning,
  listAbsenceCases,
  listAbsenceAlerts,
  listAnnualArchives,
  listMeetingChatMessages,
  listMeetingPolls,
  list,
  listNotifications,
  listWarnings,
  markAllNotificationsAsRead,
  markAttendance,
  markNotificationAsRead,
  postMeetingChatMessage,
  proposePoint,
  reviewAbsenceAlert,
  reviewPoint,
  startVoting,
  update,
  uploadEvidenceFile,
  voteMeetingPoll,
};
