# Gestion des congés & absences

Application web interne de gestion des congés et absences, conçue pour remplacer un fichier Excel partagé par une équipe de 30–40 personnes.

---

## Fonctionnalités

- **Calendrier d'équipe** — vue mensuelle FullCalendar avec absences colorées par personne et sprints en surimpression
- **Mes absences** — CRUD personnel : congés, maladie, autre, avec note optionnelle
- **Capacité mensuelle** — tableau groupé BD6 (MOA + MOE) / DS avec jours max, absences et disponible
- **Vue Sprints** — capacité équipe calculée sur la période d'un sprint sélectionné
- **Vue PI Planning** — capacité agrégée sur la période d'un PI, avec chips des sprints inclus
- **Statistiques** — graphiques Recharts : évolution de la capacité, % disponibilité, comparaison BD6 vs DS
- **Bandeau sprint en cours** — jours restants et barre de progression
- **Gestion équipe** — membres (équipe, jours/semaine), jours fériés
- **Gestion PIs & Sprints** — CRUD PIs + CRUD Sprints avec rattachement PI optionnel

---

## Stack technique

| Technologie | Version |
|---|---|
| Next.js | 15 (App Router, `output: 'standalone'`) |
| React | 19 |
| Prisma | 5 + SQLite |
| Tailwind CSS | 3 |
| FullCalendar | 6 (`@fullcalendar/react`, locale `fr`) |
| Recharts | 2 |
| Docker | Multi-stage, `node:20-alpine` |

---

## Prérequis

- Node.js 20+
- npm

---

## Lancement en développement

```bash
npm install
npm run db:push       # crée la base SQLite locale
npm run dev           # démarre sur http://localhost:3000
```

La base de données est créée dans le chemin défini par `DATABASE_URL` (par défaut `file:./dev.db`).

Pour explorer la base :

```bash
npm run db:studio
```

---

## Déploiement Docker

```bash
docker compose up -d
```

L'application est accessible sur [http://localhost:3000](http://localhost:3000).

Les données SQLite sont persistées dans le volume nommé `holidays-data` (`/app/data/holidays.db`).

### Variables d'environnement

| Variable | Défaut | Description |
|---|---|---|
| `DATABASE_URL` | `file:/app/data/holidays.db` | Chemin vers la base SQLite |
| `PORT` | `3000` | Port d'écoute |

---

## Structure du projet

```
src/
  app/
    page.tsx                    ← page principale (onglets)
    api/
      employees/                ← GET, POST, PUT
      holidays/                 ← GET, POST, PUT, DELETE
      public-holidays/          ← GET, POST, DELETE
      sprints/                  ← GET, POST, PUT, DELETE
      pi/                       ← GET, POST, PUT, DELETE
  components/
    NameSelector.tsx
    ManageTeam.tsx
    ManageSprints.tsx
    HolidayForm.tsx
    MyHolidays.tsx
    TeamCalendar.tsx
    CurrentSprintBanner.tsx
    CapacityView.tsx            ← exporte aussi CapacityTable
    SprintView.tsx
    PIView.tsx
    StatsView.tsx
  lib/
    prisma.ts                   ← singleton PrismaClient
    capacity.ts                 ← calculs jours ouvrés et absences
    colors.ts                   ← rotation palette couleurs employés
prisma/
  schema.prisma
Dockerfile
docker-compose.yml
docker-entrypoint.sh
```

---

## Modèle de données

- **Employee** — nom, couleur, jours/semaine, équipe (`MOA` | `MOE` | `DS`)
- **Holiday** — absence d'un employé : type (`holiday` | `sick` | `other`), période, note
- **PublicHoliday** — jours fériés (date + libellé)
- **Sprint** — période nommée, rattachée optionnellement à un PI
- **ProgramIncrement** — PI avec ses sprints

Les dates sont stockées en `String` au format `YYYY-MM-DD`.

---

## Équipes

| Équipe | Groupe |
|---|---|
| MOA | BD6 |
| MOE | BD6 |
| DS | DS |

Les tableaux de capacité affichent un sous-total BD6 et un sous-total DS, puis un total général.

---

## Pas d'authentification

Application interne uniquement — pas de système d'authentification. La sélection du nom en haut de page est persistée en `localStorage`.
