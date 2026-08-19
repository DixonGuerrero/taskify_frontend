# Taskify

Taskify es una aplicación de gestión de proyectos y tareas al estilo Trello/Jira: organiza el trabajo en **proyectos**, cada proyecto contiene **tareas** que se mueven entre estados, y el equipo puede verlas también en una **vista de calendario**. Incluye autenticación propia y social (Google/GitHub), notificaciones en tiempo real por WebSocket, comentarios/editor enriquecido en las tareas y un catálogo de imágenes para avatares y portadas de proyecto.

Este repositorio es **solo el frontend**, construido con [Angular](https://angular.dev) 19 y [PrimeNG](https://primeng.org) + [Tailwind CSS](https://tailwindcss.com). Necesita el backend corriendo para funcionar (ver siguiente sección).

## Backend

Taskify depende de una API REST + WebSocket separada:

👉 **[taskify_backend](https://github.com/DixonGuerrero/taskify_backend)** (Spring Boot)

Por defecto este frontend espera la API en `http://localhost:8080/api` (ver `src/environments/environment.ts` y `environment.development.ts`). Antes de levantar el frontend, sigue el README del backend para:

1. Configurar y arrancar la base de datos y el servicio Spring Boot.
2. Elegir el tipo de almacenamiento de archivos (`STORAGE_TYPE=local` es lo recomendado para desarrollo).
3. Revisar la sección de datos semilla (siguiente punto), ya que este frontend **no trae usuarios ni imágenes propias**.

## Requisitos previos

- [Node.js](https://nodejs.org/) 18 o superior (recomendado LTS) y npm.
- [Angular CLI](https://angular.dev/tools/cli) 19 (`npm install -g @angular/cli`), opcional si usas los scripts de `npm`.
- El backend de Taskify corriendo (ver arriba) y accesible en la URL configurada en `src/environments/`.

## Cómo levantar el proyecto

1. Clona el repositorio e instala las dependencias:

   ```bash
   npm install
   ```

2. Levanta primero el [backend](https://github.com/DixonGuerrero/taskify_backend) (siguiendo su propio README) y confirma que responde en `http://localhost:8080`.

3. Si tu backend corre en otra URL o puerto, ajusta `API_URL` en `src/environments/environment.ts` y/o `environment.development.ts`.

4. Inicia el servidor de desarrollo del frontend:

   ```bash
   npm start
   # equivalente a: ng serve
   ```

5. Abre `http://localhost:4200/` en el navegador. La aplicación recarga automáticamente al modificar los archivos fuente.

## Imágenes y datos de arranque

Este frontend no trae usuarios ni imágenes "de fábrica" propias: todo lo que ves por defecto (usuario admin, avatar y foto de proyecto por defecto) lo siembra el **backend** al arrancar. La fuente de verdad para esto es el README del [backend](https://github.com/DixonGuerrero/taskify_backend), secciones **"Cómo ejecutar el proyecto" → "Primer arranque: datos semilla"** y **"Configurar el almacenamiento de archivos"**. Resumen para no tener que saltar de repo:

- **Usuario admin de arranque:** `admin` / `Admin123!` (credenciales fijas en el `DataSeeder` del backend, no configurables por variable de entorno). Se crea automáticamente solo si el backend corre con `SPRING_PROFILES_ACTIVE=dev` **y** la base de datos está vacía (sin roles previos) — es un seed idempotente, no se repite en arranques posteriores. En `prod` no corre.
- **Login social (Google/GitHub):** opcional, requiere sumar el perfil `oauth2` (`SPRING_PROFILES_ACTIVE=dev,oauth2`) y las credenciales OAuth correspondientes en el `.env` del backend. Sin ese perfil, el login por usuario/contraseña funciona igual.
- **Imagen de avatar y de proyecto por defecto:** el seeder crea los *registros* en base de datos (tipo `USER` y `PROJECT`), pero **no sube el archivo físico**. Con `STORAGE_TYPE=local` (recomendado para desarrollo), si esos dos archivos no existen en `storage-data/seed/` del backend, la imagen por defecto no carga (404) — hay que colocarlos ahí manualmente antes del primer arranque, o pedirle a quien tenga el entorno de desarrollo compartido que los pase. No es un paso automatizado todavía; si el backend lo automatiza más adelante (copiarlos en el seeder), esta nota debería actualizarse.

### ¿Se pueden subir imágenes desde este frontend?

Depende del rol, y es una decisión de diseño del backend, no una limitación temporal:

- **Usuario normal:** no puede subir una imagen propia. Solo puede *elegir* una de las ya disponibles en el catálogo (`GET /api/images/v1/type/{USER|PROJECT}`) al editar su perfil o un proyecto — así es como funciona el selector de avatar en `/dashboard/profile` y el selector de imagen al crear/editar un proyecto.
- **Admin:** es el único rol que puede subir imágenes nuevas al catálogo (`POST /api/images/v1`, requiere rol `ADMIN` en el backend). Puede hacerlo directamente desde `/dashboard/profile` en esta app, que ya cuenta con la pantalla de administración del catálogo.

Si algún ícono de avatar o de proyecto se ve roto o como un cuadro negro sólido, casi siempre es por el punto anterior (archivo seed faltante o de tamaño incorrecto en el backend), no un bug de este repositorio — antes de investigar en el frontend, confirma que `GET http://localhost:8080/uploads/seed/<archivo>` responde 200 con un archivo de tamaño razonable.

## Funcionalidades principales

- **Autenticación:** login y registro propios, más login social (Google/GitHub) cuando el backend tiene el perfil `oauth2` activo.
- **Proyectos:** creación, edición y listado de proyectos, cada uno con su propia imagen de portada.
- **Tareas:** creación, edición y detalle de tareas dentro de un proyecto, con editor de texto enriquecido ([Quill](https://quilljs.com/)) para descripciones/comentarios.
- **Calendario:** vista de tareas organizadas por fecha.
- **Notificaciones en tiempo real:** vía WebSocket (SockJS + STOMP) para mantener la UI sincronizada con cambios del backend.
- **Perfil y catálogo de imágenes:** gestión de avatar propio; los administradores pueden además subir nuevas imágenes al catálogo compartido.

## Stack técnico

- [Angular](https://angular.dev) 19 (standalone components)
- [PrimeNG](https://primeng.org) + [PrimeIcons](https://primeng.org/icons) para componentes de UI
- [Tailwind CSS](https://tailwindcss.com) (vía `@tailwindcss/postcss`) para estilos utilitarios
- [RxJS](https://rxjs.dev) para manejo de estado reactivo
- [SockJS](https://github.com/sockjs/sockjs-client) + [StompJS](https://stomp-js.github.io/) para WebSockets
- [Quill](https://quilljs.com/) como editor de texto enriquecido
- [Karma](https://karma-runner.github.io) + [Jasmine](https://jasmine.github.io/) para pruebas unitarias

## Code scaffolding

Angular CLI incluye herramientas de scaffolding. Para generar un nuevo componente:

```bash
ng generate component component-name
```

Para ver el listado completo de schematics disponibles (`components`, `directives`, `pipes`, etc.):

```bash
ng generate --help
```

## Build

Para compilar el proyecto:

```bash
npm run build
# equivalente a: ng build
```

Los artefactos de build quedan en el directorio `dist/`. Por defecto, el build de producción optimiza la aplicación para rendimiento y velocidad.

También existe `npm run watch` para recompilar en modo desarrollo cada vez que cambien los archivos.

## Tests

Para ejecutar las pruebas unitarias con [Karma](https://karma-runner.github.io):

```bash
npm test
# equivalente a: ng test
```

Angular CLI no incluye un framework de e2e por defecto; puedes elegir el que prefieras (Cypress, Playwright, etc.) si necesitas agregar pruebas end-to-end.

## Recursos adicionales

- [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli)
- [Backend de Taskify](https://github.com/DixonGuerrero/taskify_backend)
