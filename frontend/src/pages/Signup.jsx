import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const Signup = () => {
  const navigate = useNavigate();

  // Form state based on your Django SignupSerializer
  const [formData, setFormData] = useState({
    company_name: "",
    license_number: "",
    state: "",
    company_type: "general_contractor",
    manager_name: "",
    manager_email: "",
    password: "",
    subscription_plan: "starter",
  });

  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Handle input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Submit signup form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // Public schema signup endpoint
      // Final URL based on:
      // public_urls.py -> path("api/", include("customers.urls"))
      // customers/urls.py -> path("signup/", CompanySignupView.as_view())
      // Final endpoint: http://localhost:8000/api/signup/
      await axios.post(
        "http://localhost:8000/api/signup/",
        formData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Show success message
      setSuccess(
        "Company created successfully! You can now log in using your company name."
      );

      // Redirect to login page after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      // Handle backend validation errors
      if (err?.response?.data) {
        const data = err.response.data;

        // If DRF returns field-wise errors
        if (typeof data === "object" && !data.detail) {
          const messages = Object.entries(data)
            .map(([field, errors]) => {
              const errorText = Array.isArray(errors)
                ? errors.join(", ")
                : errors;
              return `${field}: ${errorText}`;
            })
            .join(" | ");

          setError(messages);
        } else {
          setError(
            data.detail ||
            "Signup failed. Please check your details."
          );
        }
      } else {
        setError(
          "Signup failed. Please check your details."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 py-10">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl rounded-lg bg-white p-8 shadow-xl"
      >
        <h2 className="mb-6 text-center text-3xl font-bold text-gray-800">
          Company Registration
        </h2>

        {/* Success Message */}
        {success && (
          <p className="mb-4 rounded bg-green-100 p-3 text-sm text-green-700">
            {success}
          </p>
        )}

        {/* Error Message */}
        {error && (
          <p className="mb-4 rounded bg-red-100 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {/* Company Details */}
        <h3 className="mb-4 text-xl font-semibold text-gray-700">
          Company Details
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <input
            type="text"
            name="company_name"
            placeholder="Company Name"
            value={formData.company_name}
            onChange={handleChange}
            className="rounded border p-3"
            required
          />

          <input
            type="text"
            name="license_number"
            placeholder="License Number"
            value={formData.license_number}
            onChange={handleChange}
            className="rounded border p-3"
            required
          />

          <input
            type="text"
            name="state"
            placeholder="State"
            value={formData.state}
            onChange={handleChange}
            className="rounded border p-3"
            required
          />

          <select
            name="company_type"
            value={formData.company_type}
            onChange={handleChange}
            className="rounded border p-3"
          >
            <option value="general_contractor">
              General Contractor
            </option>
            <option value="developer">
              Developer
            </option>
            <option value="home_builder">
              Home Builder
            </option>
          </select>
        </div>

        {/* Manager Details */}
        <h3 className="mb-4 mt-8 text-xl font-semibold text-gray-700">
          Company Manager Details
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <input
            type="text"
            name="manager_name"
            placeholder="Manager Name"
            value={formData.manager_name}
            onChange={handleChange}
            className="rounded border p-3"
            required
          />

          <input
            type="email"
            name="manager_email"
            placeholder="Manager Email"
            value={formData.manager_email}
            onChange={handleChange}
            className="rounded border p-3"
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password (min 8 characters)"
            value={formData.password}
            onChange={handleChange}
            className="rounded border p-3 md:col-span-2"
            minLength={8}
            required
          />
        </div>

        {/* Subscription Plan */}
        <h3 className="mb-4 mt-8 text-xl font-semibold text-gray-700">
          Subscription Plan
        </h3>

        <select
          name="subscription_plan"
          value={formData.subscription_plan}
          onChange={handleChange}
          className="w-full rounded border p-3"
        >
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="mt-8 w-full rounded bg-blue-600 py-3 font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Creating Company..." : "Create Company"}
        </button>

        {/* Login Link */}
        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-blue-600 hover:underline"
          >
            Sign In
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Signup;