import axios from "axios";
import axiosClient from "../axiosClient";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const list = async () => {
  const resp = await axiosClient.get("/meetings");
  return resp.data || [];
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

const getAvailableAgenda = async () => {
  const resp = await axiosClient.get("/meetings/agenda/available");
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

const listMeetingChatMessages = async (meetingId) => {
  const resp = await axiosClient.get(`/meetings/${meetingId}/chat`);
  return resp.data || [];
};

const postMeetingChatMessage = async (meetingId, payload) => {
  const resp = await axiosClient.post(`/meetings/${meetingId}/chat`, payload);
  return resp.data || resp;
};

export default {
  cancel,
  closeAnnualYear,
  closeMeeting,
  confirmAttendance,
  consolidateAgenda,
  create,
  dismissNotification,
  getAvailableAgenda,
  listAbsenceAlerts,
  listAnnualArchives,
  listMeetingChatMessages,
  list,
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  postMeetingChatMessage,
  proposePoint,
  reviewAbsenceAlert,
  reviewPoint,
  update,
  uploadEvidenceFile,
};
