import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { gsap } from "gsap";
import axios from "axios";
import type { Role } from "@/types";
import { User, Lock, ArrowRight, AlertCircle, Mail, IdCard } from "lucide-react";
import {
  IconCheckCircle,
  IconLoader,
  IconScale,
  IconShield,
  IconMessageSquare,
} from "@/components/ui/icons";
import { SmokeyBackground } from "./Login";

const ROLES: { value: Role; label: string; desc: string; Icon: React.FC<any> }[] = [
  { value: "JUDGE",            label: "Magistrado/Juez",    desc: "Administrar casos",    Icon: IconScale },
  { value: "PLAINTIFF_LAWYER", label: "Ab. Demandante",     desc: "Representar al actor", Icon: IconMessageSquare },
  { value: "DEFENSE_LAWYER",   label: "Ab. Defensa",        desc: "Representar al ddo.",  Icon: IconShield },
];

export default function Register() {
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [full_name, setFullName]  = useState("");
  const [role, setRole]           = useState<Role>("PLAINTIFF_LAWYER");
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const navigate  = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && user) navigate("/dashboard", { replace: true });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (authLoading || user || !cardRef.current) return;
    gsap.fromTo(
      cardRef.current,
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }
    );
    const roleCards = cardRef.current.querySelectorAll(".role-card");
    gsap.fromTo(
      roleCards,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.1, duration: 0.4, delay: 0.3, ease: "power2.out" }
    );
  }, [authLoading, user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await axios.post(`${baseURL}/api/users/register`, { email, password, full_name, role });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Error al registrarse");
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || user) return null;

  return (
    <div className="relative w-[100dvw] min-h-[100dvh] flex items-center justify-center bg-zinc-950 font-sans py-12">
      <SmokeyBackground color="#ffffff" backdropBlurAmount="xl" className="opacity-40 fixed" />
      
      <div ref={cardRef} className="relative z-10 w-full max-w-sm p-8 space-y-6 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">Registro</h2>
          <p className="mt-2 text-sm text-gray-300">Crea tu cuenta procesal</p>
        </div>

        {success ? (
          <div className="text-center py-6 space-y-4">
            <IconCheckCircle size={48} className="text-white mx-auto" />
            <h3 className="text-xl font-bold text-white">Registro exitoso</h3>
            <p className="text-sm text-gray-300">Tu cuenta ha sido creada correctamente.</p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center w-full py-3 px-4 mt-4 bg-white/20 hover:bg-white/30 border border-white/30 rounded-lg text-white font-semibold transition-all"
            >
              Ir al inicio de sesión <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="relative z-0">
              <input
                type="text"
                id="floating_fullname"
                className="block py-2.5 px-0 w-full text-sm text-white bg-transparent border-0 border-b-2 border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-white peer"
                placeholder=" "
                required
                value={full_name}
                onChange={(e) => setFullName(e.target.value)}
              />
              <label
                htmlFor="floating_fullname"
                className="absolute text-sm text-gray-300 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-white peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
              >
                <IdCard className="inline-block mr-2 -mt-1" size={16} />
                Nombre completo
              </label>
            </div>

            <div className="relative z-0">
              <input
                type="email"
                id="floating_email"
                className="block py-2.5 px-0 w-full text-sm text-white bg-transparent border-0 border-b-2 border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-white peer"
                placeholder=" "
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <label
                htmlFor="floating_email"
                className="absolute text-sm text-gray-300 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-white peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
              >
                <Mail className="inline-block mr-2 -mt-1" size={16} />
                Correo electrónico
              </label>
            </div>
            
            <div className="relative z-0">
              <input
                type="password"
                id="floating_password"
                className="block py-2.5 px-0 w-full text-sm text-white bg-transparent border-0 border-b-2 border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-white peer"
                placeholder=" "
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <label
                htmlFor="floating_password"
                className="absolute text-sm text-gray-300 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-white peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
              >
                <Lock className="inline-block mr-2 -mt-1" size={16} />
                Contraseña
              </label>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3">
                Selecciona tu rol
              </label>
              <div className="grid grid-cols-1 gap-2">
                {ROLES.map(({ value, label, desc, Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRole(value)}
                    className={`role-card flex items-center gap-3 px-3 py-2 rounded-lg border transition-all text-left ${
                      role === value
                        ? "border-white bg-white/20"
                        : "border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white"
                    }`}
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      role === value ? "bg-white/20 text-white" : "bg-white/5 text-gray-400"
                    }`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${role === value ? "text-white" : "text-gray-300"}`}>{label}</p>
                      <p className={`text-[10px] ${role === value ? "text-gray-200" : "text-gray-400"}`}>{desc}</p>
                    </div>
                    {role === value && (
                      <IconCheckCircle size={16} className="text-white shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2">
                <AlertCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="group w-full flex items-center justify-center py-3 px-4 bg-white/20 hover:bg-white/30 border border-white/30 rounded-lg text-white font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-white transition-all duration-300 disabled:opacity-60"
            >
              {loading ? <IconLoader size={20} className="animate-spin" /> : "Crear cuenta"}
              {!loading && <ArrowRight className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>
        )}
        
        {!success && (
          <p className="text-center text-xs text-gray-400">
            ¿Ya tienes cuenta? <Link to="/login" className="font-semibold text-white hover:text-gray-200 transition">Iniciar sesión</Link>
          </p>
        )}
      </div>
    </div>
  );
}
