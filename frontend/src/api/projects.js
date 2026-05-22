// src/api/projects.js
import api from "./axios";

const extractErrorMessage = (error, fallbackMessage) => {
  const errorData = error.response?.data;
  if (!errorData) return fallbackMessage;
  if (typeof errorData === "string") return errorData;
  if (errorData.error) return errorData.error;
  if (errorData.detail) return errorData.detail;
  return Object.entries(errorData)
    .map(([field, messages]) => {
      const text = Array.isArray(messages) ? messages.join(", ") : messages;
      return `${field}: ${text}`;
    })
    .join(" | ");
};

export const fetchProjects = async () => {
  try {
    const response = await api.get("/api/projects/");
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Failed to fetch projects."));
  }
};

export const fetchMyProjects = async () => {
  try {
    const response = await api.get("/api/projects/");
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Failed to fetch your projects."));
  }
};

export const fetchMyTasks = async () => {
  try {
    const response = await api.get("/api/projects/my-tasks/");
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Failed to fetch your tasks."));
  }
};

export const createProject = async (payload) => {
  try {
    const response = await api.post("/api/projects/create/", payload);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Failed to create project."));
  }
};

export const updateProject = async (projectId, payload) => {
  try {
    const response = await api.patch(`/api/projects/${projectId}/`, payload);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Failed to update project."));
  }
};

export const deleteProject = async (projectId) => {
  try {
    await api.delete(`/api/projects/${projectId}/`);
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Failed to delete project."));
  }
};

export const updateTask = async (taskId, payload) => {
  try {
    const response = await api.patch(`/api/projects/tasks/${taskId}/update/`, payload);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Failed to update task."));
  }
};

export const deleteTask = async (taskId) => {
  try {
    await api.delete(`/api/projects/tasks/${taskId}/delete/`);
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Failed to delete task."));
  }
};

export const postComment = async (taskId, content) => {
  try {
    const response = await api.post(`/api/projects/tasks/${taskId}/comment/`, { content });
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Failed to post comment."));
  }
};

// Checklist Operations
export const addChecklistItem = async (taskId, content) => {
  try {
    const response = await api.post(`/api/projects/tasks/${taskId}/checklist/`, { content });
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Failed to add checkpoint."));
  }
};

export const updateChecklistItem = async (itemId, payload) => {
  try {
    const response = await api.patch(`/api/projects/checklist/${itemId}/`, payload);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Failed to update checkpoint."));
  }
};

export const deleteChecklistItem = async (itemId) => {
  try {
    await api.delete(`/api/projects/checklist/${itemId}/`);
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Failed to delete checkpoint."));
  }
};

export const fetchProjectManagers = async () => {
  try {
    const response = await api.get("/api/employee/list/");
    const employees = Array.isArray(response.data) ? response.data : [];
    return employees.filter((emp) => emp.role === "PROJECT_MANAGER" || emp.role === "ADMIN");
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Failed to fetch Project Managers."));
  }
};

export const fetchEmployees = async () => {
  try {
    const response = await api.get("/api/employee/list/");
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Failed to fetch employees."));
  }
};

// ===============================
// TASK EVIDENCE APIs
// ===============================

export const getTaskEvidenceUploadUrl = async (
  taskId,
  fileName,
  contentType
) => {
  try {

    const response = await api.post(

      `/api/projects/tasks/${taskId}/upload-url/`,

      {
        file_name: fileName,
        content_type: contentType,
      }
    );

    return response.data;

  } catch (error) {

    throw new Error(
      extractErrorMessage(
        error,
        "Failed to generate upload URL."
      )
    );
  }
};


export const saveTaskEvidence = async (
  taskId,
  payload
) => {
  try {

    const response = await api.post(

      `/api/projects/tasks/${taskId}/evidence/`,

      payload
    );

    return response.data;

  } catch (error) {

    throw new Error(
      extractErrorMessage(
        error,
        "Failed to save task evidence."
      )
    );
  }
};


export const fetchTaskEvidences = async (
  taskId
) => {
  try {

    const response = await api.get(

      `/api/projects/tasks/${taskId}/evidence/list/`
    );

    return response.data;

  } catch (error) {

    throw new Error(
      extractErrorMessage(
        error,
        "Failed to fetch task evidences."
      )
    );
  }
};