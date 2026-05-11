import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { gsap } from "gsap";
import axios from "axios";
import type { Role } from "@/types";
import {
  IconChevronLeft,
  IconCheckCircle,
  IconLoader,
  IconArrowRight,
  IconScale,
  IconShield,
  IconMessageSquare,
  IconAlertCircle,
} from "@/components/ui/icons";
import Logo from "@/components/ui/Logo";

const ROLES: { value: Role; label: string; desc: string; Icon: React.FC<any> }[] = [
  { value: "JUDGE",            label: "Magistrado/Juez",    desc: "Presidir y administrar casos civiles",    Icon: IconScale },
  { value: "PLAINTIFF_LAWYER", label: "Abogado Demandante", desc: "Representar a la parte actora",           Icon: IconMessageSquare },
  { value: "DEFENSE_LAWYER",   label: "Abogado Defensa",    desc: "Representar a la parte demandada",        Icon: IconShield },
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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 py-12">
      <div className="w-full max-w-lg">
        {/* Back link */}
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <IconChevronLeft size={14} />
          Volver al inicio de sesión
        </Link>

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Logo variant="stacked" iconSize="md" />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">Crear cuenta</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Acceso a la Plataforma de Gestión Procesal Civil
          </p>
        </div>

        <div ref={cardRef}>
          {success ? (
            <div className="rounded-xl border border-border bg-muted p-8 text-center">
              <IconCheckCircle size={40} className="text-foreground mx-auto mb-3" />
              <h3 className="font-semibold text-foreground">Registro exitoso</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Tu cuenta ha sido creada correctamente.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all"
              >
                <IconArrowRight size={14} />
                Ir al inicio de sesión
              </Link>
            </div>
          ) : (
            <div className="rounded-xl border border-border/60 bg-card p-6 space-y-5">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Full name */}
                <div>
                  <label htmlFor="full_name" className="block text-xs font-semibold text-foreground/80 uppercase tracking-wider mb-1.5">
                    Nombre completo
                  </label>
                  <input
                    id="full_name"
                    type="text"
                    value={full_name}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="Lic. Tu Nombre Apellido"
                    className="w-full px-4 py-2.5 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-foreground/80 uppercase tracking-wider mb-1.5">
                    Correo electrónico
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="tu@correo.com"
                    className="w-full px-4 py-2.5 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                  />
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-xs font-semibold text-foreground/80 uppercase tracking-wider mb-1.5">
                    Contraseña
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-4 py-2.5 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                  />
                </div>

                {/* Role selector */}
                <div>
                  <label className="block text-xs font-semibold text-foreground/80 uppercase tracking-wider mb-2">
                    Rol
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {ROLES.map(({ value, label, desc, Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setRole(value)}
                        className={`role-card flex items-center gap-3 px-4 py-3 rounded-lg border transition-all text-left ${
                          role === value
                            ? "border-primary/60 bg-primary/10"
                            : "border-border/60 bg-muted hover:border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          role === value ? "bg-primary/15 text-primary" : "bg-muted-foreground/10 text-muted-foreground"
                        }`}>
                          <Icon size={16} />
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${role === value ? "text-foreground" : ""}`}>{label}</p>
                          <p className="text-xs text-muted-foreground">{desc}</p>
                        </div>
                        {role === value && (
                          <IconCheckCircle size={16} className="text-primary shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2.5">
                    <IconAlertCircle size={14} className="text-destructive shrink-0 mt-0.5" />
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm transition-all hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-primary/20"
                >
                  {loading ? (
                    <><IconLoader size={14} /> Creando cuenta...</>
                  ) : (
                    <>Crear cuenta <IconArrowRight size={14} /></>
                  )}
                </button>
              </form>

              <p className="text-center text-sm text-muted-foreground">
                ¿Ya tienes cuenta?{" "}
                <Link to="/login" className="text-primary font-medium hover:text-primary/80 transition-colors">
                  Iniciar sesión
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
