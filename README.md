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

## Reglas de torneos

Abre `/tournaments/new` o pulsa **Crear torneo** en el inicio. El formulario mantiene
el borrador al volver entre pasos; salir o recargar descarta ese borrador. Al
confirmar, guarda el torneo en estado `scheduled`. Los partidos se capturan desde
la página del torneo y los resultados alimentan la clasificación.

- Americano: de 4 a 20 jugadores; entre 1 y `min(4, floor(N/4))` pistas. Los
  tamaños 4, 8 y 12 conservan la rotación cíclica existente: cada pareja de
  jugadores es compañera exactamente una vez y rival exactamente dos veces. Con
  otros tamaños, el calendario completa N rotaciones en lotes de hasta C pistas:
  `N × ceil(floor(N/4)/C)` turnos. Cada jugador juega exactamente `4 × floor(N/4)`
  partidos y descansa el mismo número de turnos; ningún grupo de cuatro se repite.
  El generador favorece parejas y rivales distintos, pero no garantiza una
  rotación perfecta de parejas u oponentes para tamaños no clásicos. Con una pista,
  el máximo de 20 jugadores produce 100 turnos.
- Los descansos se guardan como IDs de participantes y se muestran en cada ronda.
  Un descanso no es un partido, no se puede puntuar y no suma puntos a la
  clasificación. Los descansos son opcionales en el formato persistido para que
  los torneos v2 guardados antes de este cambio sigan siendo compatibles.
- Mexicano: cuatro jugadores por pista, entre 1 y 4 pistas; tamaños de 4, 8, 12
  o 16 jugadores. El organizador elige entre 1 y 100 rondas.
- Jugadores: Americano admite de 4 a 20 jugadores; Mexicano requiere grupos exactos
  de cuatro y admite hasta 16.
- Puntuación: suma fija por partido, entre 1 y 100, incluidos empates cuando proceda.
  Las opciones son 8, 16, 24 y 32. Los puntos no determinan las rondas.

### Dónde trabajar

- `src/features/tournaments/components/TournamentWizard/TournamentWizard.tsx`: borrador y pasos.
- `src/features/tournaments/lib/rules.ts`: reglas y validación del dominio.
- `src/features/tournaments/components/TournamentProvider.tsx`: Context + reducer,
  montado en el layout común. Expone `useTournaments()`.
- `src/features/tournaments/lib/storage.ts`: almacenamiento versionado y validación
  de datos externos. Clave: `padeliza.tournaments.v2`.

Los torneos se guardan únicamente en localStorage, sin API ni base de datos remota.
En el listado se pueden eliminar torneos (con confirmación).
La escritura sucede antes de confirmar el éxito. Si falla, el formulario permanece;
si los datos guardados están dañados o usan otra versión, no se sobrescriben.
Las pestañas reciben cambios mediante el evento `storage`; escrituras simultáneas
no son transaccionales. No hay sincronización entre dispositivos, copia de seguridad
ni garantía de conservar los datos si el navegador los borra. Esta persistencia no
implica que el sitio completo funcione sin conexión.

### Verificación

Con Node 24 (`nvm use`):

```bash
npm test
npm run lint
node_modules/.bin/tsc --noEmit
npm run build
```

Prueba manual: crear un Americano de cuatro jugadores, retroceder entre pasos,
confirmar tres rondas, crear y recargar el listado. Repetir con Mexicano, verificando
cuatro jugadores por pista y número de rondas editable. Comprobar nombres duplicados,
valores vacíos y puntuaciones inválidas. Si el almacenamiento está bloqueado o lleno,
no debe aparecer una confirmación de guardado ni perderse lo escrito.
