# Plataforma de Gestión Procesal Civil

Plataforma web para gestión de juicios civiles por incumplimiento de contrato. Roles: Juez, Abogado demandante, Abogado de la defensa.

## Stack

- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Base de datos y auth:** PostgreSQL y Auth vía Supabase
- **Almacenamiento:** Supabase Storage (documentos)

## Requisitos

- Node.js 18+
- Cuenta en [Supabase](https://supabase.com)

## Configuración

1. Crea un proyecto en Supabase.
2. En el SQL Editor ejecuta el contenido de `supabase-schema.sql`.
3. Crea un bucket de Storage llamado `documents` (público si quieres enlaces directos a archivos).
4. En Auth → Settings puedes desactivar "Confirm email" para desarrollo.
5. Copia `server/.env.example` a `server/.env` y `client/.env.example` a `client/.env` y rellena:
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (en server)
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_BASE_URL` (en client)

## Instalación e inicio

```bash
# Backend
cd server
npm install
npm run dev

# En otra terminal: frontend
cd client
npm install
npm run dev
```

- API: http://localhost:3001
- App: http://localhost:5173 (el proxy de Vite reenvía /api al backend)

## Uso

1. Regístrate con un rol (Juez, Abogado demandante o de la defensa).
2. Como **Juez**: crea casos y asigna un abogado demandante y uno de la defensa.
3. Los **abogados** asignados pueden subir documentos al caso.
4. El **Juez** puede cambiar el estado del caso (Abierto → En curso → Cerrado).
5. No se pueden subir documentos a casos cerrados.

## Especificación

Ver `civil-case-platform-spec.md` para la especificación completa.
