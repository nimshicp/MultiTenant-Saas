import api from "../axios";

const PLATFORM_SIGNUP_URL = "http://localhost:8000/api/signup/";

export const signupCompany = async (formData) => {
  try {
    const response = await api.post(PLATFORM_SIGNUP_URL, {
      company_name: formData.company_name,
      license_number: formData.license_number,
      state: formData.state,
      company_type: formData.company_type,
      subscription_plan: formData.subscription_plan,
      manager_email: formData.manager_email,
      manager_name: formData.manager_name,
      password: formData.password,
    });

    return response.data;
  } catch (error) {
    const errorData = error.response?.data;

    const errorMessage =
      errorData?.error ||
      errorData?.detail ||
      "Registration failed";

    throw new Error(errorMessage);
  }
};