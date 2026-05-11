import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { createApi } from "@/api/client";
import { updateProfile } from "@/api/profile";
import { gsap } from "gsap";
import type { Role } from "@/types";
import {
  IconUser,
  IconCheckCircle,
  IconAlertCircle,
  IconLoader,
  IconScale,
  IconShield,
  IconMessageSquare,
  IconCalendar,
  IconLogOut,
} from "@/components/ui/icons";
import Logo from "@/components/ui/Logo";

const ROLE_LABEL: Record<Role, string> = {
  JUDGE: "Magistrado/Juez",
  PLAINTIFF_LAWYER: "Abogado Demandante",
  DEFENSE_LAWYER: "Abogado Defensa",
};

const ROLE_COLOR: Record<Role, string> = {
  JUDGE: "text-foreground bg-muted ring-border",
  PLAINTIFF_LAWYER: "text-foreground bg-muted ring-border",
  DEFENSE_LAWYER: "text-foreground bg-muted ring-border",
};

function RoleIcon({ role, size = 14 }: { role: Role; size?: number }) {
  if (role === "JUDGE")            return <IconScale size={size} />;
  if (role === "PLAINTIFF_LAWYER") return <IconMessageSquare size={size} />;
  return <IconShield size={size} />;
}

export default function Profile() {
  const { user, getToken, refreshUser, signOut } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? "");
  const [fullName, setFullName]   = useState(user?.full_name ?? "");
  const [saving, setSaving]       = useState(false);
  const [message, setMessage]     = useState<"success" | "error" | null>(null);

  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAvatarUrl(user?.avatar_url ?? "");
    setFullName(user?.full_name ?? "");
  }, [user]);

  useEffect(() => {
    if (!pageRef.current) return;
    gsap.fromTo(
      pageRef.current.children,
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.1, duration: 0.5, ease: "power2.out" }
    );
  }, []);

  if (!user) return null;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const api = createApi(getToken);
    updateProfile(api, {
      avatar_url: avatarUrl.trim() || null,
      full_name:  fullName.trim()  || null,
    })
      .then(() => { setMessage("success"); refreshUser(); })
      .catch(() => setMessage("error"))
      .finally(() => setSaving(false));
  }

  const initials = (user.full_name || user.email || "?")
    .split(" ").slice(0, 2).map((s) => s[0]).join("").toUpperCase();

  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString("es-MX", { year: "numeric", month: "long" })
    : "—";

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <IconUser size={18} className="text-muted-foreground" />
            Mi perfil
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gestiona tu información personal</p>
        </div>
        <Logo variant="icon" iconSize="sm" />
      </div>

      <div ref={pageRef} className="grid gap-5">
        {/* ── Profile card ── */}
        <div className="rounded-xl border border-border/60 bg-card p-6">
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <span className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full ring-2 ring-primary/30 bg-primary/10">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="Avatar" className="size-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-primary">{initials}</span>
                )}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{user.full_name || "—"}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <span className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ${ROLE_COLOR[user.role]}`}>
                <RoleIcon role={user.role} size={11} />
                {ROLE_LABEL[user.role] ?? user.role}
              </span>
            </div>
          </div>

          <div className="mt-5 pt-5 border-t border-border/50 grid grid-cols-2 gap-4">
            <div>
              <p className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
                <IconCalendar size={10} /> Miembro desde
              </p>
              <p className="text-sm text-foreground capitalize">{memberSince}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">ID</p>
              <p className="text-xs text-muted-foreground font-mono truncate">{user.id}</p>
            </div>
          </div>
        </div>

        {/* ── Edit form ── */}
        <div className="rounded-xl border border-border/60 bg-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-1.5">
            <IconUser size={14} className="text-muted-foreground" />
            Editar información
          </h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label htmlFor="full_name_edit" className="block text-xs font-semibold text-foreground/80 uppercase tracking-wider mb-1.5">
                Nombre completo
              </label>
              <input
                id="full_name_edit"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Tu nombre completo"
                className="w-full px-4 py-2.5 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
              />
            </div>

            <div>
              <label htmlFor="avatar_url" className="block text-xs font-semibold text-foreground/80 uppercase tracking-wider mb-1.5">
                URL de foto de perfil
              </label>
              <input
                id="avatar_url"
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://tu-foto.com/imagen.jpg"
                className="w-full px-4 py-2.5 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
              />
              {avatarUrl && (
                <div className="mt-2 flex items-center gap-2">
                  <img
                    src={avatarUrl}
                    alt="Preview"
                    className="h-10 w-10 rounded-full object-cover ring-1 ring-border"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                  <span className="text-xs text-muted-foreground">Vista previa</span>
                </div>
              )}
            </div>

            {message === "success" && (
              <div className="flex items-center gap-2 rounded-lg bg-foreground/10 border border-teal-500/30 px-3 py-2.5">
                <IconCheckCircle size={14} className="text-foreground shrink-0" />
                <p className="text-sm text-foreground">Perfil actualizado correctamente</p>
              </div>
            )}
            {message === "error" && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2.5">
                <IconAlertCircle size={14} className="text-destructive shrink-0" />
                <p className="text-sm text-destructive">Error al guardar los cambios</p>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm transition-all hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? (
                <><IconLoader size={13} /> Guardando...</>
              ) : (
                <><IconCheckCircle size={13} /> Guardar cambios</>
              )}
            </button>
          </form>
        </div>

        {/* ── Account info ── */}
        <div className="rounded-xl border border-border/60 bg-card p-5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Información de cuenta
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between py-1.5 border-b border-border/50">
              <span className="text-sm text-muted-foreground">Correo electrónico</span>
              <span className="text-sm text-foreground">{user.email}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-border/50">
              <span className="text-sm text-muted-foreground">Rol</span>
              <span className={`flex items-center gap-1.5 text-sm font-medium ${ROLE_COLOR[user.role].split(" ")[0]}`}>
                <RoleIcon role={user.role} size={12} />
                {ROLE_LABEL[user.role]}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-sm text-muted-foreground">Estado</span>
              <span className="flex items-center gap-1.5 text-sm text-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
                Activo
              </span>
            </div>
          </div>
        </div>

        {/* ── Logout section ── */}
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5">
          <h3 className="text-sm font-semibold text-foreground mb-1">Cerrar sesión</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Saldrás de tu cuenta en este dispositivo.
          </p>
          <button
            onClick={() => signOut()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-destructive/30 text-destructive text-sm font-semibold hover:bg-destructive hover:text-white transition-all"
          >
            <IconLogOut size={14} />
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
