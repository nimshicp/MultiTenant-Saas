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


export const createMeeting =
  async (meetingData) => {

    try {

      const response = await api.post(
        "/api/meetings/create/",
        meetingData
      );

      return response.data;

    } catch (error) {

      throw new Error(

        extractErrorMessage(
          error,
          "Failed to create meeting."
        )
      );
    }
};


export const getMeetings =
  async () => {

    try {

      const response = await api.get(
        "/api/meetings/"
      );

      return response.data;

    } catch (error) {

      throw new Error(

        extractErrorMessage(
          error,
          "Failed to fetch meetings."
        )
      );
    }
};


export const getUpcomingMeetings =
  async () => {

    try {

      const response = await api.get(
        "/api/meetings/upcoming/"
      );

      return response.data;

    } catch (error) {

      throw new Error(

        extractErrorMessage(
          error,
          "Failed to fetch upcoming meetings."
        )
      );
    }
};


export const getMeetingDetail =
  async (meetingId) => {

    try {

      const response = await api.get(
        `/api/meetings/${meetingId}/`
      );

      return response.data;

    } catch (error) {

      throw new Error(

        extractErrorMessage(
          error,
          "Failed to fetch meeting details."
        )
      );
    }
};


export const cancelMeeting =
  async (meetingId) => {

    try {

      const response = await api.delete(
        `/api/meetings/${meetingId}/`
      );

      return response.data;

    } catch (error) {

      throw new Error(

        extractErrorMessage(
          error,
          "Failed to cancel meeting."
        )
      );
    }
};

export const updateMeeting =
  async (
    meetingId,
    meetingData
  ) => {

    try {

      const response =
        await api.put(

          `/api/meetings/${meetingId}/`,

          meetingData
        );

      return response.data;

    } catch (error) {

      throw new Error(

        extractErrorMessage(

          error,

          "Failed to update meeting."
        )
      );
    }
};