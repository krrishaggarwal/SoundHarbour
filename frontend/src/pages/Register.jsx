import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SongContext } from "../Context/SongContext";

const Register = () => {
  const navigate = useNavigate();
  const __URL__ = "http://localhost:1337";

  const [inputs, setInputs] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setInputs((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setErr(null);

      const res = await fetch(`${__URL__}/api/v1/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(inputs),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Registration successful");
        navigate("/login");
      } else {
        setErr(data.msg || "Registration failed");
      }

    } catch (error) {
      console.error(error);
      setErr("Something went wrong");
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
          Register
        </h1>

        <div className="flex flex-col space-y-4">

          <input
            type="text"
            placeholder="Full Name"
            name="fullName"
            value={inputs.fullName}
            onChange={handleChange}
            className="border p-2 rounded outline-none"
            required
          />

          <input
            type="email"
            placeholder="Email"
            name="email"
            value={inputs.email}
            onChange={handleChange}
            className="border p-2 rounded outline-none"
            required
          />

          <input
            type="password"
            placeholder="Password"
            name="password"
            value={inputs.password}
            onChange={handleChange}
            className="border p-2 rounded outline-none"
            required
          />

          {err && <p className="text-red-500 text-sm">{err}</p>}

          <button
            type="submit"
            disabled={loading}
            className="bg-purple-800 text-white py-2 rounded hover:bg-purple-900 transition"
          >
            {loading ? "Registering..." : "Register"}
          </button>

          <div className="text-sm text-center">
            Already have an account?{" "}
            <Link to="/login" className="text-purple-700">
              Login
            </Link>
          </div>

        </div>
      </form>
    </div>
  );
};

export default Register;