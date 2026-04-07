# Imagen base
FROM node:18

# Carpeta de trabajo dentro del contenedor
WORKDIR /app

# Copiar archivos
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar todo el código
COPY . .

# Exponer puerto
EXPOSE 3000

# Comando para correr la app
CMD ["node", "index.js"]

#Backend Dockerfile