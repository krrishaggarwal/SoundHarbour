import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AiOutlineLogin } from "react-icons/ai";

const Login = () => {
  const navigate = useNavigate();
  const __URL__ = "http://localhost:1337";

  const [inputs, setInputs] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setInputs((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch(`${__URL__}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inputs),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);
        // Save fullName for navbar avatar (if returned by login)
        if (data.fullName) localStorage.setItem("fullName", data.fullName);
        alert("Login Successful");
        navigate("/");
      } else {
        alert(data.msg || "Login failed");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-screen flex justify-center items-center bg-purple-900">
      <form
        className="bg-white flex flex-col px-6 py-10 shadow-2xl rounded-xl w-[300px]"
        onSubmit={handleSubmit}
      >
        <h1 className="text-center text-purple-800 text-2xl mb-4 font-semibold">
          Login
        </h1>
        <div className="flex flex-col space-y-4">
          <input
            type="email"
            placeholder="Email"
            name="email"
            className="border p-2 rounded outline-none"
            onChange={handleChange}
          />
          <input
            type="password"
            placeholder="Password"
            name="password"
            className="border p-2 rounded outline-none"
            onChange={handleChange}
          />
          <button
            disabled={loading}
            className="flex justify-center items-center space-x-2 bg-purple-800 text-white py-2 rounded hover:bg-purple-900 transition"
          >
            <span>{loading ? "Logging in..." : "Login"}</span>
            <AiOutlineLogin />
          </button>
          <div className="flex justify-center items-center space-x-2 text-sm">
            <p>Don't have an account?</p>
            <Link to="/register" className="text-purple-700">
              Register
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Login;
