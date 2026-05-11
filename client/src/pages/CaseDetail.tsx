import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { gsap } from "gsap";
import { useAuth } from "@/context/AuthContext";
import { createApi } from "@/api/client";
import { getCase, updateCaseStatus } from "@/api/cases";
import { getDocuments, uploadDocument } from "@/api/documents";
import { getEvents } from "@/api/events";
import type { CaseStatus, CaseDocument, CaseEvent, DocumentType, Case } from "@/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChatbotJuridico from "@/components/ui/ChatbotJuridico";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  IconChevronLeft,
  IconUpload,
  IconCheckCircle,
  IconClock,
  IconFolderOpen,
  IconRefreshCw,
  IconAlertCircle,
  IconLoader,
  IconExternalLink,
  IconUser,
  IconCalendar,
  IconFileText,
  IconFilePlus,
  IconClipboardList,
  IconSearch,
  IconScale,
  IconSentence,
  IconEventCreated,
  IconEventDocument,
  IconEventStatus,
  IconEventHearing,
  IconEventDefault,
  IconPlus,
} from "@/components/ui/icons";

// ── Icon helpers ──────────────────────────────────────────────────────────────
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

const DOC_TYPES: { value: DocumentType; label: string }[] = [
  { value: "DEMAND",   label: "Demanda" },
  { value: "RESPONSE", label: "Contestación" },
  { value: "MOTION",   label: "Moción" },
  { value: "EVIDENCE", label: "Prueba" },
  { value: "ORDER",    label: "Auto" },
  { value: "SENTENCE", label: "Sentencia" },
];

function DocIcon({ type, size = 18 }: { type: string; size?: number }) {
  const props = { size, className: "text-muted-foreground" };
  switch (type) {
    case "DEMAND":   return <IconFileText {...props} />;
    case "RESPONSE": return <IconFilePlus {...props} />;
    case "MOTION":   return <IconClipboardList {...props} />;
    case "EVIDENCE": return <IconSearch {...props} />;
    case "ORDER":    return <IconScale {...props} />;
    case "SENTENCE": return <IconSentence {...props} />;
    default:         return <IconFileText {...props} />;
  }
}

function EventIcon({ type, size = 14 }: { type: string; size?: number }) {
  const props = { size, className: "text-primary" };
  switch (type) {
    case "CASE_CREATED":       return <IconEventCreated {...props} />;
    case "DOCUMENT_UPLOADED":  return <IconEventDocument {...props} />;
    case "STATUS_CHANGED":     return <IconEventStatus {...props} />;
    case "HEARING_SCHEDULED":  return <IconEventHearing {...props} />;
    default:                   return <IconEventDefault {...props} />;
  }
}

const SIDE_LABEL: Record<string, string> = {
  PLAINTIFF: "Demandante",
  DEFENSE:   "Defensa",
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, getToken } = useAuth();
  const [caseData, setCaseData]   = useState<Case | null>(null);
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [events, setEvents]       = useState<CaseEvent[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [uploading, setUploading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadType, setUploadType]   = useState<DocumentType>("EVIDENCE");
  const [uploadFile, setUploadFile]   = useState<File | null>(null);
  
  const headerRef  = useRef<HTMLDivElement>(null);

  const api         = createApi(getToken);
  const isJudge     = caseData?.judge_id === user?.id;
  const participants = caseData?.participants ?? [];
  const myParticipant = participants.find((p) => p.user_id === user?.id);
  const canUpload   = myParticipant && caseData?.status !== "CLOSED";

  // ── Data loading ────────────────────────────────────────────────────────────
  function load() {
    if (!id) return;
    setLoading(true);
    Promise.all([getCase(api, id), getDocuments(api, id), getEvents(api, id)])
      .then(([c, docs, evs]) => {
        setCaseData(c);
        setDocuments(docs);
        setEvents(evs);
      })
      .catch((e: any) => setError(e.response?.data?.error || e.message || "Error"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [id, getToken]);

  // Header entrance
  useEffect(() => {
    if (!headerRef.current || !caseData) return;
    gsap.fromTo(
      headerRef.current,
      { y: -20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" }
    );
  }, [caseData]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  function handleStatusChange(newStatus: CaseStatus) {
    if (!id) return;
    setStatusUpdating(true);
    updateCaseStatus(api, id, newStatus)
      .then((c) => setCaseData((prev) => (prev ? { ...prev, ...c } : c)))
      .catch((e: any) => setError(e.response?.data?.error || e.message || "Error"))
      .finally(() => setStatusUpdating(false));
  }

  function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !uploadFile || !uploadTitle.trim()) return;
    setUploading(true);
    const form = new FormData();
    form.append("title", uploadTitle.trim());
    form.append("type", uploadType);
    form.append("file", uploadFile);
    uploadDocument(api, id, form)
      .then(() => {
        setUploadTitle("");
        setUploadType("EVIDENCE");
        setUploadFile(null);
        load();
      })
      .catch((e: any) => setError(e.response?.data?.error || e.message || "Error"))
      .finally(() => setUploading(false));
  }

  // ── Skeleton ─────────────────────────────────────────────────────────────────
  if (loading && !caseData)
    return (
      <div className="container mx-auto max-w-4xl px-4 py-12 space-y-4">
        <div className="h-36 rounded-xl bg-card animate-pulse" />
        <div className="h-64 rounded-xl bg-card animate-pulse" />
      </div>
    );

  if (error && !caseData)
    return (
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-6">
          <IconAlertCircle size={18} className="text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-destructive">{error}</p>
            <Button variant="link" asChild className="mt-2 p-0 h-auto font-normal text-primary">
              <Link to="/dashboard">
                <IconChevronLeft size={13} className="mr-1" /> Volver al inicio
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );

  if (!caseData) return null;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Button variant="link" asChild className="mb-5 p-0 h-auto text-muted-foreground hover:text-foreground">
        <Link to="/dashboard">
          <IconChevronLeft size={14} className="mr-1" />
          Mis casos
        </Link>
      </Button>

      <div ref={headerRef}>
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-start gap-4 justify-between">
              <div className="flex-1 min-w-0">
                <Badge variant="secondary" className={`mb-3 ${STATUS_CLASS[caseData.status]}`}>
                  {caseData.status === "OPEN" && <IconFolderOpen size={11} className="mr-1.5" />}
                  {caseData.status === "IN_PROGRESS" && <IconClock size={11} className="mr-1.5" />}
                  {caseData.status === "CLOSED" && <IconCheckCircle size={11} className="mr-1.5" />}
                  {STATUS_LABEL[caseData.status]}
                </Badge>
                <CardTitle className="text-2xl">{caseData.title}</CardTitle>
                {caseData.description && (
                  <CardDescription className="mt-2 text-base">
                    {caseData.description}
                  </CardDescription>
                )}
              </div>

              {isJudge && caseData.status !== "CLOSED" && (
                <div className="flex flex-wrap gap-2 shrink-0">
                  {(["OPEN", "IN_PROGRESS", "CLOSED"] as const)
                    .filter((s) => s !== caseData.status)
                    .map((s) => (
                      <Button
                        key={s}
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(s)}
                        disabled={statusUpdating}
                      >
                        {statusUpdating ? <IconLoader size={14} className="mr-1.5 animate-spin" /> : <IconRefreshCw size={14} className="mr-1.5" />}
                        {STATUS_LABEL[s]}
                      </Button>
                    ))}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="mt-2 pt-6 border-t grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  <IconScale size={12} /> Juez
                </p>
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400/10 ring-1 ring-amber-400/30 text-xs font-bold text-foreground">
                    {caseData.judge?.full_name?.charAt(0) ?? "J"}
                  </span>
                  <span className="text-sm font-medium">
                    {caseData.judge?.full_name ?? caseData.judge_id}
                  </span>
                </div>
              </div>

              {participants.map((p) => (
                <div key={p.id}>
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    <IconUser size={12} /> {SIDE_LABEL[p.side] ?? p.side}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ring-1 ${
                      p.side === "PLAINTIFF"
                        ? "bg-muted ring-border text-foreground"
                        : "bg-muted ring-border text-foreground"
                    }`}>
                      {p.user?.full_name?.charAt(0) ?? "A"}
                    </span>
                    <span className="text-sm font-medium">{p.user?.full_name ?? p.user_id}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px] mb-6">
          <TabsTrigger value="timeline">
            <IconCalendar size={14} className="mr-2" />
            Timeline ({events.length})
          </TabsTrigger>
          <TabsTrigger value="documents">
            <IconFileText size={14} className="mr-2" />
            Documentos ({documents.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="timeline" className="mt-0">
          {events.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <IconCalendar size={48} className="text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground font-medium">Sin eventos registrados aún.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="relative pl-8 md:pl-0">
              <div className="space-y-6">
                {[...events].reverse().map((ev, i) => (
                  <Card key={ev.id} className="relative overflow-visible border-l-4 border-l-primary/60 md:border-l">
                    <CardHeader className="py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-full bg-primary/10 text-primary shrink-0">
                            <EventIcon type={ev.event_type} size={16} />
                          </div>
                          <div>
                            <CardTitle className="text-sm font-semibold tracking-wide">
                              {ev.event_type.replace(/_/g, " ")}
                            </CardTitle>
                            {ev.description && (
                              <CardDescription className="mt-1 text-sm text-foreground/90">
                                {ev.description}
                              </CardDescription>
                            )}
                          </div>
                        </div>
                        <Badge variant="secondary" className="shrink-0 text-[10px] sm:text-xs">
                          {new Date(ev.created_at).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
                        </Badge>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="documents" className="mt-0 space-y-6">
          {documents.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <IconFileText size={48} className="text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground font-medium">No hay documentos cargados.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {documents.map((d) => (
                <Card key={d.id} className="overflow-hidden transition-colors hover:bg-accent/30">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted border">
                      <DocIcon type={d.type} size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <a
                        href={d.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold hover:underline line-clamp-1"
                      >
                        {d.title}
                      </a>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                          {DOC_TYPES.find((t) => t.value === d.type)?.label ?? d.type}
                        </Badge>
                        <span>•</span>
                        <span className="truncate">{d.uploader?.full_name ?? d.uploaded_by}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 sm:ml-auto">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <IconCalendar size={12} />
                        {new Date(d.created_at).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}
                      </div>
                      <Button variant="ghost" size="icon" asChild title="Abrir documento">
                        <a href={d.file_url} target="_blank" rel="noopener noreferrer">
                          <IconExternalLink size={16} />
                        </a>
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {canUpload && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <IconUpload size={16} className="text-primary" />
                  Subir documento
                </CardTitle>
                <CardDescription>
                  Adjunta un nuevo documento al caso.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form id="upload-form" onSubmit={handleUpload} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="doc-title">Título</Label>
                      <Input
                        id="doc-title"
                        value={uploadTitle}
                        onChange={(e) => setUploadTitle(e.target.value)}
                        required
                        placeholder="Título del documento"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="doc-type">Tipo</Label>
                      <Select
                        value={uploadType}
                        onValueChange={(val) => setUploadType(val as DocumentType)}
                      >
                        <SelectTrigger id="doc-type">
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {DOC_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="doc-file">Archivo</Label>
                    <Input
                      id="doc-file"
                      type="file"
                      onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                      required
                      className="cursor-pointer"
                    />
                  </div>
                  {error && (
                    <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2 text-xs text-destructive">
                      <IconAlertCircle size={14} /> {error}
                    </div>
                  )}
                </form>
              </CardContent>
              <CardFooter className="bg-muted/30 border-t px-6 py-4">
                <Button type="submit" form="upload-form" disabled={uploading}>
                  {uploading ? (
                    <><IconLoader size={16} className="mr-2 animate-spin" /> Subiendo...</>
                  ) : (
                    <><IconPlus size={16} className="mr-2" /> Subir documento</>
                  )}
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      <ChatbotJuridico />
    </div>
  );
}
