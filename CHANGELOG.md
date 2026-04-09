# Changelog

Toutes les modifications notables de ce projet sont documentées dans ce fichier.

Format basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).

---

## [0.1.0] — 2026-04-09

### Ajouté

#### Application
- Page principale avec 6 onglets : Calendrier, Mes absences, Capacité, Sprints, PI Planning, Statistiques
- Sélection du nom persistée en `localStorage` via `NameSelector`
- Bandeau sprint en cours avec jours restants et barre de progression (`CurrentSprintBanner`)

#### Calendrier d'équipe (`TeamCalendar`)
- Vue mensuelle FullCalendar en français
- Affichage des absences colorées par employé
- Affichage des sprints en surimpression (fond pastel, sprint en cours mis en évidence)

#### Mes absences (`MyHolidays` + `HolidayForm`)
- Création, modification et suppression d'absences personnelles
- Types : congés, maladie, autre
- Note optionnelle

#### Capacité mensuelle (`CapacityView`)
- Navigation mois par mois
- Tableau groupé BD6 (MOA + MOE) / DS
- Colonnes : capacité max, absences, disponible
- Sous-totaux par groupe et total général

#### Vue Sprints (`SprintView`)
- Sélection d'un sprint dans la liste
- Calcul de capacité sur la période du sprint
- Réutilisation de `CapacityTable`

#### PI Planning (`PIView`)
- Liste des PIs avec statut (passé / en cours / à venir)
- Auto-sélection : PI en cours, sinon prochain, sinon dernier
- Chips des sprints rattachés
- Capacité calculée sur toute la période du PI via `CapacityTable`

#### Statistiques (`StatsView`)
- Toggle Sprints / PI Planning
- 3 cartes KPI par section
- `ComposedChart` : barres empilées (Disponible + Absences) + courbe % disponibilité (axe droit)
- `BarChart` groupé BD6 vs DS (affiché si les deux groupes existent)
- Chargement dynamique (SSR désactivé, Recharts nécessite `ResizeObserver`)

#### Gestion équipe (`ManageTeam`)
- Ajout de membres avec nom et équipe
- Modification inline de l'équipe et du nombre de jours/semaine
- CRUD jours fériés

#### Gestion PIs & Sprints (`ManageSprints`)
- CRUD PIs (nom, dates début/fin)
- CRUD Sprints avec rattachement optionnel à un PI
- Suppression d'un PI : détachement automatique des sprints associés

#### API REST
- `GET/POST /api/employees` — liste et création d'employés
- `PUT /api/employees/[id]` — modification équipe et/ou jours/semaine
- `GET/POST /api/holidays` — absences (filtres : `employeeId`, `month`, `from`/`to`, ou tout)
- `PUT/DELETE /api/holidays/[id]`
- `GET/POST /api/public-holidays` — jours fériés
- `DELETE /api/public-holidays/[id]`
- `GET/POST /api/sprints` — sprints avec relation PI incluse
- `PUT/DELETE /api/sprints/[id]`
- `GET/POST /api/pi` — PIs avec sprints inclus
- `PUT/DELETE /api/pi/[id]`

#### Infrastructure
- Base SQLite gérée par Prisma 5, dates stockées en `String` (`YYYY-MM-DD`)
- Dockerfile multi-stage (`node:20-alpine`), build standalone Next.js
- `docker-compose.yml` avec volume nommé pour la persistance SQLite
- `docker-entrypoint.sh` : `prisma db push` au démarrage puis `node server.js`
- Support Apple Silicon + Alpine Linux via `binaryTargets` Prisma

#### Calculs de capacité (`src/lib/capacity.ts`)
- `workingDaysInRange` — jours ouvrés lundi–vendredi hors jours fériés
- `absenceDaysInRange` — jours d'absence intersectant une plage, hors week-ends et fériés
- Règle : capacité max = `joursOuvrés × (joursParSemaine / 5)` ; disponible = `max − absences`

#### Équipes
- 3 équipes : MOA, MOE, DS
- MOA + MOE regroupés sous le label BD6 dans tous les tableaux
- Badges couleurs : MOA amber, MOE purple, DS teal
