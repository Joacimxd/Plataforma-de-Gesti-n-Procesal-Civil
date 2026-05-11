import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import { useAuth } from "@/context/AuthContext";
import { createApi } from "@/api/client";
import { getCases } from "@/api/cases";
import type { Case, CaseStatus } from "@/types";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  IconSearch,
  IconFolder,
  IconClipboardList,
  IconCheckCircle,
  IconClock,
  IconFolderOpen,
  IconPlus,
  IconAlertCircle,
  IconScale,
  IconTrendingUp,
} from "@/components/ui/icons";

const STATUS_LABEL: Record<CaseStatus, string> = {
  OPEN: "Abierto",
  IN_PROGRESS: "En curso",
  CLOSED: "Cerrado",
};

const STATUS_CLASS: Record<CaseStatus, string> = {
  OPEN: "bg-secondary text-secondary-foreground",
  IN_PROGRESS: "bg-primary text-primary-foreground",
  CLOSED: "bg-muted text-muted-foreground border",
};

const STATUS_ICON: Record<CaseStatus, React.ReactNode> = {
  OPEN: <IconFolderOpen size={14} />,
  IN_PROGRESS: <IconClock size={14} />,
  CLOSED: <IconCheckCircle size={14} />,
};

function StatCard({
  label,
  value,
  icon,
  color,
  index,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(
      ref.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, delay: 0.1 + index * 0.1, ease: "power2.out" }
    );
    const obj = { val: 0 };
    const el = ref.current.querySelector("[data-count]") as HTMLElement;
    if (el) {
      gsap.to(obj, {
        val: value,
        duration: 0.8,
        delay: 0.15 + index * 0.1,
        ease: "power2.out",
        onUpdate: () => { el.textContent = Math.round(obj.val).toString(); },
      });
    }
  }, [value, index]);

  return (
    <div ref={ref}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </CardTitle>
          <div className={`h-10 w-10 flex items-center justify-center rounded-xl bg-muted ${color}`}>
            {icon}
          </div>
        </CardHeader>
        <CardContent>
          <div className={`text-3xl font-bold ${color}`}>
            <span data-count>0</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Dashboard() {
  const { user, getToken } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CaseStatus | "ALL">("ALL");

  const headerRef = useRef<HTMLDivElement>(null);
  const casesListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const api = createApi(getToken);
    getCases(api)
      .then(setCases)
      .catch((e: any) => setError(e.response?.data?.error || e.message || "Error al cargar"))
      .finally(() => setLoading(false));
  }, [getToken]);

  useEffect(() => {
    if (!headerRef.current) return;
    gsap.fromTo(
      headerRef.current,
      { y: -20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }
    );
  }, []);

  useEffect(() => {
    if (loading || !casesListRef.current) return;
    const cards = casesListRef.current.querySelectorAll(".case-card");
    if (cards.length === 0) return;
    gsap.fromTo(
      cards,
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.06, duration: 0.45, ease: "power2.out", delay: 0.3 }
    );
  }, [loading, cases]);

  const stats = useMemo(() => ({
    total: cases.length,
    open: cases.filter((c) => c.status === "OPEN").length,
    inProgress: cases.filter((c) => c.status === "IN_PROGRESS").length,
    closed: cases.filter((c) => c.status === "CLOSED").length,
  }), [cases]);

  const filtered = useMemo(() => cases.filter((c) => {
    const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || c.status === statusFilter;
    return matchSearch && matchStatus;
  }), [cases, search, statusFilter]);

  if (loading)
    return (
      <div className="container mx-auto max-w-6xl px-4 py-12 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-card animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
        ))}
      </div>
    );

  if (error)
    return (
      <div className="container mx-auto max-w-6xl px-4 py-12">
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="flex items-start gap-3 p-6">
            <IconAlertCircle size={20} className="text-destructive shrink-0 mt-0.5" />
            <p className="text-destructive font-medium">{error}</p>
          </CardContent>
        </Card>
      </div>
    );

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div ref={headerRef} className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Bienvenido/a,{" "}
              <span className="text-primary">{user?.full_name?.split(" ")[0]}</span>
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {new Date().toLocaleDateString("es-MX", {
                weekday: "long", year: "numeric", month: "long", day: "numeric",
              })}
            </p>
          </div>
          {user?.role === "JUDGE" && (
            <Button asChild className="hidden sm:flex">
              <Link to="/cases/new">
                <IconPlus size={16} className="mr-2" />
                Nuevo Caso
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total de Casos" value={stats.total} icon={<IconClipboardList size={20} />} color="text-foreground" index={0} />
        <StatCard label="Abiertos" value={stats.open} icon={<IconFolderOpen size={20} />} color="text-foreground" index={1} />
        <StatCard label="En Curso" value={stats.inProgress} icon={<IconClock size={20} />} color="text-foreground" index={2} />
        <StatCard label="Cerrados" value={stats.closed} icon={<IconCheckCircle size={20} />} color="text-muted-foreground" index={3} />
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar casos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["ALL", "OPEN", "IN_PROGRESS", "CLOSED"] as const).map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(s)}
              className="gap-2"
            >
              {s === "ALL" ? <IconScale size={14} /> : STATUS_ICON[s]}
              {s === "ALL" ? "Todos" : STATUS_LABEL[s]}
            </Button>
          ))}
        </div>
      </div>

      {/* Cases list */}
      <div ref={casesListRef}>
        {filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <IconFolder size={48} className="text-muted-foreground/30 mb-4" />
              <p className="font-semibold text-lg">
                {search || statusFilter !== "ALL" ? "Sin resultados" : "No tienes casos asignados"}
              </p>
              <p className="text-muted-foreground mt-2">
                {user?.role === "JUDGE" && !search && statusFilter === "ALL"
                  ? "Crea tu primer caso con el botón 'Nuevo Caso'"
                  : "Intenta con otro filtro o búsqueda"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((c) => (
              <Link to={`/cases/${c.id}`} key={c.id} className="block group case-card">
                <Card className="transition-all hover:bg-accent hover:border-primary/50">
                  <div className="flex items-center gap-4 px-5 py-4">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${STATUS_CLASS[c.status]}`}>
                      {STATUS_ICON[c.status]}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base leading-tight truncate group-hover:text-primary transition-colors">
                        {c.title}
                      </h3>
                      {c.description && (
                        <p className="text-sm text-muted-foreground mt-1 truncate">{c.description}</p>
                      )}
                    </div>

                    <div className="hidden sm:flex flex-col items-end gap-1.5 shrink-0">
                      <Badge variant="secondary" className={STATUS_CLASS[c.status]}>
                        {STATUS_LABEL[c.status]}
                      </Badge>
                      <p className="text-xs text-muted-foreground font-medium">
                        {new Date(c.created_at).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <IconTrendingUp size={18} className="text-primary" />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {user?.role === "JUDGE" && (
        <div className="fixed bottom-6 right-6 sm:hidden z-40">
          <Button asChild size="icon" className="h-14 w-14 rounded-full shadow-lg">
            <Link to="/cases/new">
              <IconPlus size={24} />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
