// src/api/signup.js

import api from "./axios";

// Public schema signup endpoint
const PLATFORM_SIGNUP_URL =
  `${import.meta.env.VITE_API_URL}/auth/register/`;

/**
 * Register a new company.
 *
 * Expected formData:
 * {
 *   company_name: "BuildTech",
 *   license_number: "LIC123",
 *   state: "Kerala",
 *   company_type: "general_contractor",
 *   subscription_plan: "starter",
 *   manager_name: "John Doe",
 *   manager_email: "admin@buildtech.com",
 *   password: "securepassword123"
 * }
 */
export const signupCompany = async (formData) => {
  try {
    const response = await api.post(PLATFORM_SIGNUP_URL, {
      tenant: {
        name: formData.company_name,
        subdomain: formData.subdomain,
      },
      user: {
        email: formData.manager_email,
        password: formData.password,
        confirm_password: formData.confirm_password,
      },
      profile: {
        full_name: formData.manager_name,
      },
      payment: {
        plan: formData.subscription_plan,
        razorpay_order_id: formData.razorpay_order_id,
        razorpay_payment_id: formData.razorpay_payment_id,
        razorpay_signature: formData.razorpay_signature,
      }
    });

    return response.data;
  } catch (error) {
    const errorData = error.response?.data;

    let errorMessage = "Company registration failed.";

    if (errorData) {
      if (typeof errorData === "string") {
        errorMessage = errorData;
      } else if (errorData.error) {
        errorMessage = errorData.error;
      } else if (errorData.detail) {
        errorMessage = errorData.detail;
      } else {
        errorMessage = Object.entries(errorData)
          .map(([field, errors]) => {
            const text = Array.isArray(errors)
              ? errors.join(", ")
              : errors;
            return `${field}: ${text}`;
          })
          .join(" | ");
      }
    }

    throw new Error(errorMessage);
  }
};

// Optional backward compatibility alias
export const initiateCompanySignup = signupCompany;