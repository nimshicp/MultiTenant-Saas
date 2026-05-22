import api from "./axios";


const extractErrorMessage = (
  error,
  fallbackMessage
) => {

  const errorData =
    error.response?.data;

  if (!errorData)
    return fallbackMessage;

  if (typeof errorData === "string")
    return errorData;

  if (errorData.error)
    return errorData.error;

  if (errorData.detail)
    return errorData.detail;

  return Object.entries(errorData)

    .map(([field, messages]) => {

      const text = Array.isArray(messages)

        ? messages.join(", ")

        : messages;

      return `${field}: ${text}`;
    })

    .join(" | ");
};



export const fetchChatUsers =
  async () => {

    try {

      const response = await api.get(
        "/api/chat/users/"
      );

      return response.data;

    } catch (error) {

      throw new Error(

        extractErrorMessage(
          error,
          "Failed to fetch chat users."
        )
      );
    }
};



export const createOrGetRoom =
  async (userId) => {

    try {

      const response = await api.post(
        "/api/chat/room/",
        {
          user_id: userId,
        }
      );

      return response.data;

    } catch (error) {

      throw new Error(

        extractErrorMessage(
          error,
          "Failed to create chat room."
        )
      );
    }
};



export const fetchMessages =
  async (roomId) => {

    try {

      const response = await api.get(
        `/api/chat/messages/${roomId}/`
      );

      return response.data;

    } catch (error) {

      throw new Error(

        extractErrorMessage(
          error,
          "Failed to fetch messages."
        )
      );
    }
};