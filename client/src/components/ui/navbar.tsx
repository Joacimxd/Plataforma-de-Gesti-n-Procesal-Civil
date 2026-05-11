import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useRef } from "react";
import { gsap } from "gsap";
import { createApi } from "@/api/client";
import { getNotifications, markRead, markAllRead } from "@/api/notifications";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  IconBell,
  IconUser,
  IconLogOut,
  IconClipboardList,
  IconCheckCircle,
  IconCircleDot,
  IconPlus,
} from "@/components/ui/icons";
import Logo from "@/components/ui/Logo";

const ROLE_LABEL: Record<string, string> = {
  JUDGE: "Magistrado/a",
  PLAINTIFF_LAWYER: "Ab. Demandante",
  DEFENSE_LAWYER: "Ab. Defensa",
};

interface Notification {
  id: string;
  message: string;
  is_read: boolean;
  case_id: string | null;
  created_at: string;
}

export default function Nav() {
  const { user, signOut, getToken } = useAuth();
  const location = useLocation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navRef = useRef<HTMLElement>(null);

  const unread = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    if (!navRef.current) return;
    gsap.fromTo(
      navRef.current,
      { y: -60, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }
    );
  }, []);

  function loadNotifications() {
    if (!user) return;
    const api = createApi(getToken);
    getNotifications(api)
      .then((data) => setNotifications(data as Notification[]))
      .catch(() => {});
  }

  useEffect(() => {
    loadNotifications();
    pollRef.current = setInterval(loadNotifications, 30000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [user]);

  function handleMarkRead(id: string) {
    const api = createApi(getToken);
    markRead(api, id).then(() =>
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
    );
  }

  function handleMarkAllRead() {
    const api = createApi(getToken);
    markAllRead(api).then(() =>
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    );
  }

  if (!user) return null;

  const navLinks = [
    { to: "/dashboard", label: "Mis Casos", icon: <IconClipboardList size={14} /> },
    ...(user.role === "JUDGE" ? [{ to: "/cases/new", label: "Nuevo Caso", icon: <IconPlus size={14} /> }] : []),
  ];

  const initials = (user.full_name || user.email || "?")
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();

  return (
    <header
      ref={navRef}
      className="sticky top-0 z-50 border-b border-border bg-background"
    >
      <nav className="container mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link to="/dashboard" className="group">
          <Logo variant="nav" iconSize="xs" />
        </Link>

        <div className="h-5 w-px bg-border mx-1 hidden sm:block" />

        <div className="flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                location.pathname === link.to
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
            <DropdownMenuTrigger asChild>
              <button
                className="relative h-9 w-9 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                aria-label="Notificaciones"
              >
                <IconBell size={17} />
                {unread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className="text-sm font-semibold flex items-center gap-1.5">
                  <IconBell size={13} className="text-muted-foreground" />
                  Notificaciones
                </span>
                {unread > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 text-xs text-foreground hover:text-muted-foreground transition-colors"
                  >
                    <IconCheckCircle size={11} />
                    Marcar todas leídas
                  </button>
                )}
              </div>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <div className="px-3 py-8 text-center">
                  <IconBell size={28} className="text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Sin notificaciones</p>
                </div>
              ) : (
                notifications.slice(0, 8).map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-accent transition-colors border-b border-border last:border-0 ${
                      !n.is_read ? "bg-muted" : ""
                    }`}
                    onClick={() => { if (!n.is_read) handleMarkRead(n.id); }}
                  >
                    <IconCircleDot
                      size={10}
                      className={`mt-1 shrink-0 ${n.is_read ? "text-muted-foreground/30" : "text-foreground"}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs leading-snug text-foreground">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(n.created_at).toLocaleString("es")}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-2 pl-1 pr-2.5 py-1 h-9 rounded-full hover:bg-accent transition-all border border-border"
                aria-label="Menú de perfil"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-semibold text-foreground">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="size-full object-cover rounded-full" />
                  ) : (
                    initials
                  )}
                </span>
                <span className="hidden flex-col items-start text-left sm:flex">
                  <span className="text-xs font-semibold leading-tight text-foreground">
                    {user.full_name?.split(" ").slice(-2).join(" ") || "Usuario"}
                  </span>
                  <span className="text-[10px] leading-tight text-muted-foreground">
                    {ROLE_LABEL[user.role] ?? user.role}
                  </span>
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <div className="px-3 py-2.5">
                <p className="text-sm font-semibold">{user.full_name || "Usuario"}</p>
                <p className="text-xs text-muted-foreground">
                  {ROLE_LABEL[user.role] ?? user.role}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                  <IconUser size={13} className="text-muted-foreground" />
                  Mi perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => signOut()} className="flex items-center gap-2 cursor-pointer text-destructive">
                <IconLogOut size={13} />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
    </header>
  );
}
