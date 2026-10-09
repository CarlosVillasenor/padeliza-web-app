# padeliza-web-app
A Next.js web app to create "americano" style tournaments for a game of Padel.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Creación y gestión de torneos

Abre `/tournaments/new` o pulsa **Crear torneo** en el inicio. El formulario mantiene
el borrador al volver entre pasos; salir o recargar descarta ese borrador. Al
confirmar, guarda un torneo en estado `scheduled` y abre su página. Desde allí se
pueden capturar resultados, generar rondas y consultar la clasificación.

### Organización del código

- `src/app/`: rutas, composición de páginas, layout global y estilos globales.
- `src/features/tournaments/`: interfaz, estado, reglas, tipos y cálculos propios de torneos.
- `src/shared/`: localización común y tokens globales de estilo.

- Americano: 4, 8, 12 o 16 jugadores; de 1 a N/4 pistas. Una rotación contiene N/4
  partidos y cada jugador tendrá N−1 parejas distintas. Para calcular los turnos,
  se completa cada rotación en lotes de hasta C pistas antes de pasar a la siguiente:
  `(N−1) × ceil((N/4)/C)`. No se promete el calendario más corto posible; por ejemplo,
  12 jugadores y 2 pistas dan 22 turnos, con el último lote de cada rotación parcial.
- Mexicano: cuatro jugadores por pista, entre 1 y 4 pistas. Rondas elegidas por el
  organizador (1–100). La primera ronda es aleatoria; las siguientes agrupan la
  clasificación de cuatro en cuatro (1+4 contra 2+3). La clasificación desempata por
  puntos, victorias y nombre.
- Puntuación: suma fija por partido, entre 1 y 100, incluidos empates cuando proceda.
  Las opciones son 8, 16, 24 y 32. Los puntos no determinan las rondas.

### Módulos principales

- `src/features/tournaments/components/TournamentWizard/TournamentWizard.tsx`: borrador y pasos.
- `src/features/tournaments/lib/rules.ts`: reglas y validación del dominio.
- `src/features/tournaments/hooks/TournamentProvider.tsx`: Context + reducer,
  montado en el layout común. Expone `useTournaments()`.
- `src/features/tournaments/lib/storage.ts`: almacenamiento versionado y validación
  de datos externos. Clave: `padeliza.tournaments.v2`.

Los torneos se guardan únicamente en localStorage, sin API ni base de datos remota.
La escritura sucede antes de confirmar el éxito. Si falla, el formulario permanece;
si los datos guardados están dañados o usan otra versión, no se sobrescriben.
Las pestañas reciben cambios mediante el evento `storage`; escrituras simultáneas
no son transaccionales. No hay sincronización entre dispositivos, copia de seguridad
ni garantía de conservar los datos si el navegador los borra. Esta persistencia no
implica que el sitio completo funcione sin conexión.

### Verificación

Con Node 26 (`nvm use`):

```bash
node --test src/features/tournaments/lib/rules.test.ts
npm run lint
npm run build
```

Prueba manual: crear un Americano de cuatro jugadores, retroceder entre pasos,
confirmar tres rondas, crear y recargar el listado. Repetir con Mexicano, verificando
cuatro jugadores por pista y número de rondas editable. Comprobar nombres duplicados,
valores vacíos y puntuaciones inválidas. Si el almacenamiento está bloqueado o lleno,
no debe aparecer una confirmación de guardado ni perderse lo escrito.
