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

## Creación y juego de torneos

Abre `/tournaments/new` o pulsa **Crear torneo** en el inicio. El formulario
mantiene el borrador al volver entre pasos; salir o recargar descarta ese borrador.
Los torneos y resultados se guardan en localStorage.

- **Americano:** de 4 a 24 jugadores y de 1 a `floor(N/4)` pistas. Las rondas se
  generan completas al crear el torneo. El número de turnos es
  `(N par ? N−1 : N) × ceil(floor(N/4)/C)`, procesando cada rotación en lotes de
  hasta C pistas. Un descanso es una ausencia, no un partido ni una victoria.
  Para 4, 5, 8 y 12 jugadores se conserva la rotación existente: todos los
  compañeros son distintos; para 4, 5, 8 y 12 cada pareja de rivales también
  se enfrenta exactamente dos veces.
- Para los demás tamaños se usa una factorización circular de parejas: ninguna
  pareja de compañeros se repite y los partidos jugados por participante difieren
  como máximo en uno. Los rivales se agrupan para minimizar repeticiones dentro
  de cada rotación, pero no se garantiza que todas las parejas de rivales se
  enfrenten un número idéntico de veces (o que todas lleguen a enfrentarse).
- **Mexicano:** conserva el límite de 4, 8 o 12 jugadores, con cuatro jugadores
  por pista. El organizador elige de 1 a 100 rondas; las rondas siguientes se
  organizan por clasificación en grupos de cuatro (1+4 contra 2+3).
- **Jugadores:** se requieren al menos 4; Americano admite hasta 24 y Mexicano
  hasta 12. Los nombres deben ser distintos.
- **Puntuación:** suma fija por partido, entre 1 y 100, incluidos empates cuando
  proceda. Las opciones son 8, 16, 24 y 32. Los descansos no suman puntos ni
  afectan la clasificación individual.

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
npx tsc --noEmit
npm run build
```

Las pruebas de `schedule.test.ts` y `play.test.ts` verifican tamaños de Americano
de 4 a 24, rotaciones, descansos, puntuaciones y clasificación. Prueba manual:
crear un Americano con un tamaño no divisible por cuatro y comprobar los descansos;
capturar resultados y verificar que nadie recibe puntos por descansar. Repetir
con Mexicano, comprobando cuatro jugadores por pista y rondas editables. Si el
almacenamiento está bloqueado o lleno, no debe aparecer una confirmación de guardado
ni perderse lo escrito.
