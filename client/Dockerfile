# Etapa 1: Construcción (Build)
# Usamos Node 20 para evitar el bug de dependencias de Node 18
FROM node:20-slim AS build
WORKDIR /app

# Copiamos SOLO el package.json
COPY package.json ./

# Instalamos dependencias (Node 20 descargará el binario correcto para Linux)
RUN npm install

# Copiamos el resto del código
COPY . .

# Construimos la aplicación
RUN npm run build 

# Etapa 2: Servidor Web (Nginx)
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# ---> LÍNEA NUEVA: Copiamos la configuración que acabas de crear
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]