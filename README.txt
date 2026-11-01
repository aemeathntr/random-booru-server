RANDOM BOORU SFW - SERVIDOR INTERMEDIARIO

REQUISITOS
- Node.js 18 o superior.

EJECUTAR EN TU ORDENADOR
1. Descomprime el ZIP.
2. Abre una terminal dentro de la carpeta random-booru-server.
3. Ejecuta: npm install
4. Ejecuta: npm start
5. Abre http://localhost:3000

PUBLICAR EN INTERNET (Render)
1. Sube el contenido de esta carpeta a un repositorio GitHub.
2. En Render crea un servicio Web Service y conecta ese repositorio.
3. Build Command: npm install
4. Start Command: npm start
5. Render detectará el puerto mediante process.env.PORT.
6. Abre la URL HTTPS que Render te asigne.

La web y el servidor se sirven desde el mismo origen, por lo que el navegador ya no necesita llamar directamente a las APIs de las galerías.

NOTAS
- La app solicita publicaciones con rating:g en Danbooru y rating:safe en Gelbooru/Rule34.
- Las fuentes pueden limitar solicitudes, cambiar sus APIs o no devolver resultados.
- El servidor solo acepta las cuatro etiquetas incluidas en la lista permitida.
- No añadas claves API privadas al HTML ni publiques secretos en GitHub.
