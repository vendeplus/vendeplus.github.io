# Sistema de Ventas a Crédito

Este repositorio contiene el código fuente y los archivos resultantes para el sitio web de **Sistema de Ventas a Crédito**. La aplicación está desarrollada con [React](https://react.dev/) y [Vite](https://vitejs.dev/), utilizando Firebase como backend.

La carpeta [`frontend/`](frontend/) incluye el código de la aplicación; el contenido de la raíz es la versión compilada que se publica mediante GitHub Pages.

## Uso local

1. Instalar las dependencias dentro de `frontend`:
   ```bash
   cd frontend
   npm install
   ```
2. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```
3. Ejecutar el linter para verificar la calidad del código:
   ```bash
   npm run lint
   ```

Para generar la versión estática utilizada en producción ejecute `npm run build` y copie los archivos de la carpeta `dist` en la raíz del proyecto.

## Roles de usuario

La aplicación maneja permisos mediante un campo `role` guardado en la colección `users` de Firestore. Al iniciar sesión por primera vez se asigna automáticamente el rol **Vendedor**. Para cambiarlo debe editarse dicho documento desde la consola de Firebase y establecer el valor deseado, por ejemplo **Administrador**.

Los permisos se definen así:

- **Vendedor**: sólo puede acceder a las secciones de *Ventas* y *Clientes* y utilizar las funciones relacionadas, pero **no** puede editar ni eliminar registros de clientes ni de ventas.
- **Administrador**: tiene acceso completo al sitio, incluido el panel de *Finanzas*.

## Licencia

Este proyecto se distribuye bajo los términos de la licencia MIT. Consulte el archivo [LICENSE](LICENSE) para más información.

<!-- trigger deploy -->
