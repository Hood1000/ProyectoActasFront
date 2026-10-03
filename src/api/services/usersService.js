import axiosClient from "../axiosClient";

const pendingListRequests = new Map();

const list = async (role) => {
  const requestKey = role || "ALL";
  const existingRequest = pendingListRequests.get(requestKey);

  if (existingRequest) {
    return existingRequest;
  }

  const requestPromise = axiosClient
    .get("/users", {
      params: role ? { role } : undefined,
    })
    .then((resp) => resp.data || [])
    .finally(() => {
      pendingListRequests.delete(requestKey);
    });

  pendingListRequests.set(requestKey, requestPromise);
  return requestPromise;
};

const create = async (data) => {
  const resp = await axiosClient.post("/auth/register", data);
  return resp.data || resp;
};

const updateAsAdmin = async (id, data) => {
  const resp = await axiosClient.patch(`/users/${id}/admin`, data);
  return resp.data || resp;
};

const updateProfile = async (data) => {
  const resp = await axiosClient.patch("/users/profile", data);
  return resp.data || resp;
};

const getMe = async () => {
  const resp = await axiosClient.get("/users/me");
  return resp.data || resp;
};

const disable = async (id) => {
  const resp = await axiosClient.patch(`/users/${id}/disable`);
  return resp.data || resp;
};

const enable = async (id) => {
  const resp = await axiosClient.patch(`/users/${id}/enable`);
  return resp.data || resp;
};

export default {
  list,
  create,
  getMe,
  updateAsAdmin,
  updateProfile,
  disable,
  enable,
};
