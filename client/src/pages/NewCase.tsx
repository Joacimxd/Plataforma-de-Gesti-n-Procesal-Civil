import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { gsap } from "gsap";
import { useAuth } from "@/context/AuthContext";
import { createApi } from "@/api/client";
import { createCase, addParticipant } from "@/api/cases";
import { searchUsers } from "@/api/users";
import type { User } from "@/types";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import {
  IconChevronLeft,
  IconSearch,
  IconX,
  IconCheck,
  IconLoader,
  IconAlertCircle,
  IconShield,
  IconMessageSquare,
  IconPlus,
  IconFileText,
  IconCheckCircle,
} from "@/components/ui/icons";
import Logo from "@/components/ui/Logo";

function LawyerSearch({
  label,
  role,
  value,
  onChange,
  api,
  placeholder,
  RoleIcon,
  color,
}: {
  label: string;
  role: "PLAINTIFF_LAWYER" | "DEFENSE_LAWYER";
  value: User | null;
  onChange: (u: User | null) => void;
  api: ReturnType<typeof createApi>;
  placeholder: string;
  RoleIcon: React.FC<any>;
  color: string;
}) {
  const [query, setQuery]     = useState("");
  const [options, setOptions] = useState<User[]>([]);
  const [open, setOpen]       = useState(false);
  const [fetching, setFetching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!query.trim()) { setOptions([]); setOpen(false); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setFetching(true);
    debounceRef.current = setTimeout(() => {
      searchUsers(api, query, role)
        .then((list) => { setOptions(list); setOpen(list.length > 0); })
        .catch(() => setOptions([]))
        .finally(() => setFetching(false));
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, role, api]);

  const displayText = value ? (value.full_name ?? value.email) : "";

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <RoleIcon size={14} className={color} />
        {label}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div className="relative">
            <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder={placeholder}
              value={query || displayText}
              onChange={(e) => { setQuery(e.target.value); if (!e.target.value) onChange(null); }}
              onFocus={() => options.length > 0 && setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 150)}
              className={cn("pl-9 pr-9", value ? "bg-primary/5 border-primary" : "")}
            />
            {fetching && (
              <IconLoader size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin" />
            )}
            {value && !fetching && (
              <button
                type="button"
                onClick={() => { onChange(null); setQuery(""); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <IconX size={14} />
              </button>
            )}
          </div>
        </PopoverAnchor>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] max-h-56 p-0"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {options.length === 0 && query.trim() ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Sin resultados para "{query}"
            </div>
          ) : (
            <div className="py-1">
              {options.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-accent",
                    value?.id === u.id && "bg-accent"
                  )}
                  onMouseDown={(e) => { e.preventDefault(); onChange(u); setQuery(""); setOpen(false); }}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted font-semibold shrink-0">
                    {(u.full_name || u.email || "?").charAt(0).toUpperCase()}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium truncate">{u.full_name ?? u.email}</span>
                    <span className="text-xs text-muted-foreground truncate">{u.email}</span>
                  </div>
                  {value?.id === u.id && <IconCheck size={16} className="ml-auto text-primary shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </PopoverContent>
      </Popover>
      {value && (
        <p className={`flex items-center gap-1.5 text-xs font-medium mt-1 ${color}`}>
          <IconCheckCircle size={12} />
          {value.full_name || value.email} asignado
        </p>
      )}
    </div>
  );
}

export default function NewCase() {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [title, setTitle]           = useState("");
  const [description, setDescription] = useState("");
  const [plaintiff, setPlaintiff]   = useState<User | null>(null);
  const [defense, setDefense]       = useState<User | null>(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");

  const cardRef = useRef<HTMLDivElement>(null);
  const api = createApi(getToken);

  useEffect(() => {
    if (!cardRef.current) return;
    gsap.fromTo(
      cardRef.current,
      { y: 32, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.55, ease: "power3.out" }
    );
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return setError("El título del caso es obligatorio");
    if (!plaintiff || !defense) return setError("Debes asignar un abogado demandante y uno de la defensa");
    setError("");
    setLoading(true);
    createCase(api, { title: title.trim(), description: description.trim() || null })
      .then(async (c) => {
        await addParticipant(api, c.id, plaintiff.id, "PLAINTIFF");
        await addParticipant(api, c.id, defense.id, "DEFENSE");
        navigate(`/cases/${c.id}`);
      })
      .catch((e: any) => setError(e.response?.data?.error || e.message || "Error"))
      .finally(() => setLoading(false));
  }

  const steps = [
    { label: "Título",      done: !!title.trim() },
    { label: "Demandante",  done: !!plaintiff },
    { label: "Defensa",     done: !!defense },
  ];
  const progress = steps.filter((s) => s.done).length;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Button variant="link" asChild className="mb-6 px-0 text-muted-foreground hover:text-foreground">
        <Link to="/dashboard">
          <IconChevronLeft size={16} className="mr-1" /> Mis casos
        </Link>
      </Button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <IconFileText size={24} className="text-primary" />
            Crear nuevo caso
          </h1>
          <p className="text-muted-foreground mt-1">
            Registra el expediente y asigna los abogados de cada parte.
          </p>
        </div>
        <div className="hidden sm:block">
          <Logo variant="icon" iconSize="md" />
        </div>
      </div>

      <div className="flex items-center gap-3 mb-8">
        {steps.map((step, i) => (
          <div key={step.label} className="flex items-center gap-3">
            <Badge variant={step.done ? "default" : "secondary"} className="h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs">
              {step.done ? <IconCheck size={12} /> : i + 1}
            </Badge>
            <span className={cn("text-sm font-medium", step.done ? "text-foreground" : "text-muted-foreground")}>
              {step.label}
            </span>
            {i < steps.length - 1 && (
              <div className={cn("h-px w-8 sm:w-16", i < progress - 1 ? "bg-primary" : "bg-border")} />
            )}
          </div>
        ))}
      </div>

      <div ref={cardRef}>
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Detalles del Expediente</CardTitle>
              <CardDescription>Completa la información inicial del caso.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Título del caso</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Ej: Disputa de Propiedad Inmobiliaria - Exp. #2026001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Descripción <span className="font-normal text-muted-foreground">(opcional)</span>
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Descripción del caso, antecedentes relevantes..."
                  className="resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t">
                <LawyerSearch
                  label="Abogado Demandante"
                  role="PLAINTIFF_LAWYER"
                  value={plaintiff}
                  onChange={setPlaintiff}
                  api={api}
                  placeholder="Buscar por nombre..."
                  RoleIcon={IconMessageSquare}
                  color="text-foreground"
                />
                <LawyerSearch
                  label="Abogado Defensa"
                  role="DEFENSE_LAWYER"
                  value={defense}
                  onChange={setDefense}
                  api={api}
                  placeholder="Buscar por nombre..."
                  RoleIcon={IconShield}
                  color="text-foreground"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3">
                  <IconAlertCircle size={16} className="text-destructive shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive font-medium">{error}</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t bg-muted/40 py-4 px-6">
              <Button variant="ghost" asChild>
                <Link to="/dashboard">Cancelar</Link>
              </Button>
              <Button type="submit" disabled={loading} className="min-w-[120px]">
                {loading ? (
                  <><IconLoader size={16} className="mr-2 animate-spin" /> Creando...</>
                ) : (
                  <><IconPlus size={16} className="mr-2" /> Crear caso</>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
