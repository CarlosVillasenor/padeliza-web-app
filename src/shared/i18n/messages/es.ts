// Source of truth for the dictionary shape: other locales must satisfy
// `Messages` (derived from this object in ../index.ts).
export const es = {
  common: {
    appName: "Padeliza",
    retry: "Volver a intentar",
  },
  metadata: {
    title: "Padeliza", // Browser/SEO title; may differ from `common.appName`.
    description: "Crea y administra tus torneos de pádel.",
  },
  home: {
    brandLabel: "Padeliza, inicio",
    logoAlt: "Padeliza logo",
    mainActionsLabel: "Acciones principales",
    viewTournaments: "Ver torneos",
    moreOptions: "Más opciones",
    title: "Torneos",
    emptyState: {
      illustrationAlt: "Raqueta y pelota de pádel",
      title: "No hay torneos",
      // One entry per line so each language controls its own line break.
      descriptionLines: ["Crea tu primer torneo para", "empezar"],
    },
  },
  tournaments: {
    formats: {
      americano: "Americano clásico",
      mexicano: "Mexicano clásico",
    },
    formatDescriptions: {
      americano:
        "Cambia de pareja hasta jugar con todos. Rondas calculadas automáticamente.",
      mexicano:
        "Las parejas se ajustan según la clasificación. Tú eliges cuántas rondas jugar.",
    },
    status: {
      scheduled: "Preparado",
    },
    // Keyed by `TournamentError` (see features/tournaments/types).
    errors: {
      name: "Escribe un nombre de hasta 80 caracteres.",
      format: "Selecciona un tipo de torneo válido.",
      playerCount: "Agrega 4, 8, 12 o 16 jugadores.",
      playerName: "Cada jugador necesita un nombre de hasta 50 caracteres.",
      duplicatePlayerName: "Los nombres de los jugadores deben ser distintos.",
      duplicatePlayerId: "Los identificadores de jugadores deben ser únicos.",
      courts: "Selecciona una cantidad válida de pistas.",
      mexicanoCourts: "Mexicano necesita cuatro jugadores por pista.",
      points: "Elige entre 1 y 100 puntos totales por partido.",
      rounds: "Elige entre 1 y 100 rondas.",
      roundsMismatch: "El número de rondas no corresponde a la configuración.",
      storageUnavailable:
        "No pudimos leer los torneos guardados. Los datos existentes no se han sobrescrito. Habilita el almacenamiento del navegador y vuelve a intentar.",
      storageNotReady: "Primero debemos recuperar los torneos guardados.",
      saveFailed:
        "No se pudo guardar el torneo. Revisa el espacio y los permisos del navegador e inténtalo de nuevo. Tu formulario se conserva.",
    },
    list: {
      loading: "Cargando tus torneos…",
      playerCount: (count: number) => `${count} jugadores`,
      courtCount: (count: number) => `${count} pistas`,
      roundCount: (count: number) => `${count} rondas`,
      pointsPerMatch: (points: number) =>
        `${points} puntos totales por partido`,
      viewPlayers: "Ver jugadores",
      create: "+ Crear torneo",
    },
    wizard: {
      title: "Nuevo torneo",
      backToTournaments: "Volver a torneos",
      backToPreviousStep: "Volver al paso anterior",
      stepProgress: (current: number, total: number) => `${current} / ${total}`,
      progressLabel: "Progreso de creación",
      stepTitles: {
        type: "Elige el tipo de torneo",
        players: "Jugadores",
        courts: "Pistas",
        points: "Puntos",
        rounds: "Rondas",
        name: "Nombre del torneo",
        review: "Verifica tu configuración",
      },
      actions: {
        next: "Siguiente",
        create: "Crear torneo",
        saving: "Guardando…",
      },
      type: {
        legend: "Modalidad",
      },
      players: {
        intro: "Agrega 4, 8, 12 o 16 jugadores. Cada nombre debe ser distinto.",
        inputLabel: "Añadir jugador",
        addButton: "Añadir jugador",
        added: (count: number) => `${count} jugadores agregados`,
        remove: (name: string) => `Eliminar a ${name}`,
      },
      courts: {
        introMexicano: (players: number, courts: number) =>
          `Para ${players} jugadores necesitas ${courts} pistas: todos juegan en cada ronda.`,
        introAmericano:
          "¿Cuántas pistas usarás? Con menos pistas habrá turnos de descanso.",
        legend: "Pistas disponibles",
      },
      points: {
        intro:
          "Puntos totales por partido. Si eliges 16, el marcador puede ser 10–6 u 8–8; no es el primero en llegar a 16.",
        customLabel: "Puntos totales (personalizable)",
      },
      rounds: {
        intro:
          "La primera ronda será aleatoria; las siguientes se organizarán según la clasificación. El número de jugadores no determina cuándo termina el torneo.",
        label: "Número de rondas",
      },
      name: {
        label: "Ingresa el nombre de tu torneo",
        randomButton: "Generar nombre aleatorio",
        randomNames: [
          "Torneo del Domingo",
          "Encuentro de Campeones",
          "Amigos de la Pista",
          "Tarde de Pádel",
        ],
      },
      review: {
        name: "Nombre",
        format: "Tipo",
        players: "Jugadores",
        courts: "Pistas",
        points: "Puntos totales por partido",
        rounds: "Rondas",
        matchesPerPlayer: "Partidos por jugador",
        americanoWithRests:
          "Una pareja distinta en cada partido. Habrá descansos: completamos cada rotación por turnos antes de la siguiente.",
        americanoNoRests:
          "Una pareja distinta en cada partido. Todos juegan en cada ronda.",
        saveNotice:
          "El torneo se guardará en este navegador. La captura de resultados estará disponible en una siguiente entrega.",
      },
      // Step-level input problems caught before the domain rules run.
      stepErrors: {
        playerNameRequired: "Escribe el nombre del jugador.",
        maxPlayers: "Puedes agregar hasta 16 jugadores.",
        duplicatePlayer:
          "Ese jugador ya está en la lista. Usa un nombre distinto para identificarlo.",
        pendingPlayerName:
          "Presiona + para agregar el nombre pendiente o borra el campo antes de continuar.",
        unsupportedPlayerCount: "Esta versión admite 4, 8, 12 o 16 jugadores.",
        pointsRange: "Escribe entre 1 y 100 puntos.",
        roundsRange: "Escribe entre 1 y 100 rondas.",
        nameRequired: "Escribe el nombre del torneo.",
      },
    },
  },
};
