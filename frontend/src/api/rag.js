import api from "./axios";

const getRagBaseUrl = () => {
  return import.meta.env.VITE_RAG_URL;
};

const getTenantSchemaName = () => {
  const company = localStorage.getItem("company") || "";
  const cleaned = company.trim().toLowerCase();

  if (!cleaned) {
    return "";
  }

  return `tenant_${cleaned}`;
};

const extractErrorMessage = (error, fallbackMessage) => {
  const errorData = error?.response?.data;

  if (!errorData) return fallbackMessage;

  if (typeof errorData === "string") return errorData;
  if (errorData.detail) return errorData.detail;
  if (errorData.error) return errorData.error;

  return Object.entries(errorData)
    .map(([field, messages]) => {
      const text = Array.isArray(messages) ? messages.join(", ") : messages;
      return `${field}: ${text}`;
    })
    .join(" | ");
};

export const uploadDocument = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/api/documents/", formData);
  return response.data;
};

export const askRagQuestion = async (question) => {
  const schemaName = getTenantSchemaName();

  if (!schemaName) {
    throw new Error("Tenant context is missing. Please log in again.");
  }

  const response = await fetch(`${getRagBaseUrl()}/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      question,
      schema_name: schemaName,
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(
      extractErrorMessage(
        { response: { data: payload } },
        "RAG query failed."
      )
    );
  }

  return response.json();
};

export const streamRagQuestion = async ({
  question,
  onMeta,
  onToken,
}) => {
  const schemaName = getTenantSchemaName();

  if (!schemaName) {
    throw new Error("Tenant context is missing. Please log in again.");
  }

  const response = await fetch(`${getRagBaseUrl()}/query/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      question,
      schema_name: schemaName,
    }),
  });

  if (!response.ok || !response.body) {
    const payload = await response.json().catch(() => null);
    throw new Error(
      extractErrorMessage(
        { response: { data: payload } },
        "RAG query failed."
      )
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const parseEventBlock = (block) => {
    const lines = block.split("\n");
    let eventName = "message";
    let data = "";

    for (const line of lines) {
      if (line.startsWith("event:")) {
        eventName = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        data += line.slice(5).trim();
      }
    }

    return { eventName, data };
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    let boundaryIndex = buffer.indexOf("\n\n");
    while (boundaryIndex !== -1) {
      const rawEvent = buffer.slice(0, boundaryIndex).trim();
      buffer = buffer.slice(boundaryIndex + 2);

      if (rawEvent) {
        const { eventName, data } = parseEventBlock(rawEvent);

        if (data) {
          const payload = JSON.parse(data);

          if (eventName === "meta" && onMeta) {
            onMeta(payload);
          } else if (eventName === "token" && onToken) {
            onToken(payload.token || "");
          } else if (eventName === "done") {
            return payload;
          } else if (eventName === "error") {
            throw new Error(payload.detail || "RAG query failed.");
          }
        }
      }

      boundaryIndex = buffer.indexOf("\n\n");
    }
  }

  return null;
};

export const fetchRagDocuments = async () => {
  const response = await api.get("/api/documents/");
  return response.data;
};

export const deleteRagDocument = async (documentId) => {
  const response = await api.delete(
    `/api/documents/${encodeURIComponent(documentId)}/`
  );
  return response.data;
};

export const fetchRagDocumentsHistory = fetchRagDocuments;

export const getCurrentTenantSchema = getTenantSchemaName;