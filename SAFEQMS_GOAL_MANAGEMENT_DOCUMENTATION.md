# SafeQMS · Goal Management & Strategy Deployment — Komplett Moduldokumentation

**Version:** 5.4 (Hoshin Kanri Complete — 360° X-Matrix, SQDC/TOC, Catchball, Escalated Blockers & ISO Compliance)  
**Syfte:** Fullständig funktionell, metodologisk och teknisk dokumentation av modulen *Goal Management* i SafeQMS – avsedd för både verksamhetsägare/QMS-ansvariga och systemutvecklare (React + Django/DRF).

---

## 1. Översikt & Metodologisk Grund

Modulen förenar **Hoshin Kanri (Strategy Deployment)** enligt Elizabeth A. Cudneys *Using Hoshin Kanri to Improve the Value Stream* med **ISO-integrerat ledningssystem (ISO 9001, ISO 14001, ISO 45001)**.

### Kärnprinciper i arkitekturen
1. **En enda datakälla (Single Source of Truth):** Mål, relationer, initiativ, projekt, KPI:er, ägarskap, blockers och PDCA-beslut delas av samtliga vyer (*Overview, Goal Cascade, 360° X-Matrix, Strategy A3, Bowling Chart, PDCA Reviews, Audit Evidence Pack*). Inga dubbla strategidatabaser förekommer.
2. **Skilj på genomförande och effekt:** Ett initiativs/projekts leveransprocent (`progress %`) är **inte** samma sak som måluppfyllelse (`performance`). Målstatus beräknas alltid automatiskt från kopplad KPI:s senaste utfall mot månadsplan, riktning (`higher`/`lower`/`range`) och tolerans.
3. **Management by Exception:** Ledningens tid i *PDCA Reviews* styrs automatiskt till avvikelser – dels manuellt eskalerade hinder (*Escalated Blockers*), dels auto-detekterade signaler (röda `Off track`-KPI:er, upprepade `At risk`-trender och `At risk`-initiativ).
4. **Systemfokus före punktinsatser (SQDC + TOC):** Initiativ viktas över **S**afety, **Q**uality, **D**elivery, **C**ost och taggas mot värdeflödets primära flaskhals (*Theory of Constraints*).
5. **ISO-planeringsgrind (Planning Completeness):** Formellt godkännande blockeras om ett mål saknar obligatoriska ISO §6.2-fält (vad, resurser, ansvarig, deadline, utvärdering, KPI, ISO-krav samt föräldramål).

---

## 2. Informationsarkitektur & Navigering

Modulen är uppdelad i fem huvudområden plus översikt och administratörsinställningar:

| Huvudflik | Undersidor / Rutter | Syfte |
|---|---|---|
| **Overview** | `overview` | Rollanpassad sammanfattning, strategiska pelare, KPI-kort, *Management Attention (Exceptions)* och Strategi-till-exekveringsflöde |
| **Strategy & Goals** | `pillars`, `cascade`, `matrix`, `a3`, `goal/:id`, `newgoal` | Huvudpelare, interaktiv målhierarki (träd/tabell), 360° X-Matris, utskrivbar Strategy A3 samt målformulär |
| **Initiatives & Projects** | `projects`, `initiative/:id`, `newinitiative`, `project/:id` | SQDC- & TOC-prioriterad initiativportfölj, initiativdetaljer, Project A3 (8+1 fält) och aktivitetslista (`Tasks`) |
| **Performance** | `kpis`, `import` | Månadsvis KPI-graf (utfall vs mål), Bowling Chart med gap-beräkning och validerad CSV-import |
| **Reviews & Alignment** | `catchball`, `catchballitem/:id`, `catchballnew`, `reviews`, `review/:id`, `newreview`, `approvals` | Dubbelriktad Catchball-dialog, PDCA Exception Queue, granskningsmöten, carry-forward-beslut och formella godkännanden |
| **ISO & Evidence** | `iso`, `evidence`, `management` | ISO §6.2-efterlevnad, ISO-katalogadapter, Audit Evidence Pack (PDF/JSON) och automatiskt underlag till Ledningens genomgång (§9.3) |
| **Settings** *(endast Admin)* | `settings`, `integration` | Demohantering (JSON-export/reset/ladda synkat demo) och utvecklarblueprint för Django-API |

---

## 3. Detaljerade Arbetsflöden

### 3.1 Målhierarki & Strategiska Pelare (`pillars`, `cascade`, `goal`)
- **Nivåer:** `Organization` (långsiktiga genombrottsmål utan förälder) → `Site` (t.ex. Uppsala, Falkenberg) → `Department` (Production, Maintenance, Quality).
- **Cykelspärr:** `permittedParents()` blockerar cirkulära beroenden och ogiltiga hopp mellan nivåer vid byte av primär förälder (*Change parent*).
- **Revisionshantering:** Om ett redan godkänt (`Approved`) mål sparas med ändringar arkiveras föregående godkända version i `goalRevisions`, ny utkastrevision skapas (`revision + 1`, `approval = 'Draft'`) och ett revisionsspår loggas i `history`.

### 3.2 360° Visual X-Matrix (`matrix`)
X-matrisen läses **medsols 360°** runt det centrala navet:
1. **Syd (S) — Corporate Goals:** Långsiktiga organisationsmål (`C1–Cn`).
2. **Sydväst (SW) — Hierarki (Blå punkter):** Direkt föräldralänk till organisation (`●` = 2) eller indirekt via Site-mål (`◐` = 1). Härleds dynamiskt via `goal.parent`, lagras ej dubbelt.
3. **Väst (W) — Annual / Site / Department Goals:** Års- och avdelningsmål (`A1–An`).
4. **Nordväst (NW) — Mål × Initiativ (Turkos):** Kausal påverkan (`●` Strong = 2, `◐` Medium = 1, `○` Weak = 0.5). Om ett initiativ tilldelats ett primärt mål (`i.goal`) utan graderad styrka visas `↗` utan att fabricera betyg.
5. **Nord (N) — Initiatives & Projects:** Visar initiativ, ägare, kompakta **`S Q D C`**-brickor, **`TOC`**-flaskhalstagg samt ev. blocker-flagga `⚑`.
6. **Nordöst (NE) — Initiativ × KPI (Turkos):** Styrka i hur initiativet driver KPI:et.
7. **Öst (E) — KPIs:** Mätetal (`K1–Kn`) med statusflaggor (`! Off`, `! Risk`, `⚑ N`).
8. **Sydöst (SE) — Cross-Functional Ownership (Lila):** **KPI × Tvärfunktionell ledare (`W1–Wn`)**.
   - `●` (**Primary Owner**, strength = 2) — huvudansvarig för KPI-utfallet.
   - `○` (**Support**, strength = 1) — tvärfunktionell medverkande funktion.
   - Klick på valfri **ledare**, **mål**, **initiativ**, **KPI** eller **matrispunkt** markerar hela den anslutna värdekedjan i samtliga kvadranter och öppnar inspektorn längst ned (där auktoriserade roller kan ändra styrka, ägarskap och motivering).

### 3.3 SQDC-prioritering & Value Stream Bottleneck (`projects`, `initiative`)
Baserat på Cudneys värdeflödesprinciper och Theory of Constraints:
- Varje initiativ poängsätts per dimension (**S**afety, **Q**uality, **D**elivery, **C**ost): `0 = None`, `1 = Support ○`, `2 = Primary ●`.
- **Leverage-signaler & anti-"whack-a-mole"-skydd:**
  - `TOC Bottleneck` — Initiativet åtgärdar en utpekad systemflaskhals (`isBottleneck: true`).
  - `Safety Priority` — `S = Primary (2)` har alltid absolut företräde oavsett övrig poäng.
  - `3/4` eller `4/4 SQDC` — Hög systemhävstång över flera pelare.
  - `Narrow Focus` — Varning för punktinsats (≤ 1 SQDC-pelare, ej Safety Priority och ej TOC-flaskhals) som bör verifieras mot värdeflödet.
- Portföljen innehåller 4 KPI-sammanfattningskort, snabbfilter (`All`, `TOC Bottleneck`, `High SQDC Leverage`, `Safety Priority`, `Narrow / Verify`) och direkta länkar till Project A3 och blockers.

### 3.4 Dubbelriktad Catchball & Formella Godkännanden (`catchball`, `approvals`)
Catchball hanterar **förhandling innan formellt godkännande**:
- **Båda riktningarna stöds:** *Top-down* (General director / QMS auditor bjuder in Department director på ett Site-/Koncernmål utan att ge redigeringsrätt på själva målet) och *Bottom-up* (Department director föreslår mål/resurser för sin avdelning).
- **Tillståndsmaskin:** `Draft` → `Awaiting director` / `Awaiting department` ↔ `Changes requested` → `Aligned` → `Pending approval` → `Approved`.
- **Inbyggt skydd:** Föreslaget målvärde och resurser sparas separat i Catchball-tråden och skriver inte över målets fastställda värden förrän ett formellt godkännande (`cbFinalDecision`) genomförs och ISO-planeringskontrollen (`goalPlanCheck`) är grön.
- **QMS-substitution & Notifiering:** Både *General director* och *QMS auditor* är likvärdiga formella godkännare. När *QMS auditor* godkänner skapas automatiskt en obligatorisk informationsnotis (`directorDecisionNotifications`) till *General director* utan att kräva dubbel signering.

### 3.5 Escalated Blockers & PDCA Exception Queue (`reviews`, `review`, `management`)
Slutet Management-by-Exception-flöde för genomförandeproblem:
1. **Eskalering:** Från *Initiatives*, *Project A3*, *KPI Bowling Chart* eller *X-Matrix Inspector* kan användaren klicka **`⚑ Escalate blocker`** och ange kategori (*Resource, Budget, Decision, Cross-functional, Technical, Prioritization*), allvarlighetsgrad (*Critical, High, Medium*), problembeskrivning och önskat ledningsbeslut.
2. **Automatiska signaler (`detectAutoSignals`):** Systemet lyfter även fram *Auto Exceptions* utan manuell registrering om:
   - en KPI är `Off track`,
   - en KPI varit `At risk` i **2 eller fler månader i rad**, eller
   - ett initiativ står som `At risk` utan aktiv blocker.
3. **PDCA Exception Queue:** Samtliga öppna blockers och autosignaler sorteras efter allvarlighetsgrad (Critical → High → Medium) i **PDCA Reviews** och visas i **Overview → Management Attention** samt **Management Review Inputs**.
4. **Konvertering till PDCA-beslut:** Med ett klick (`→ Convert to PDCA Decision` eller `→ Add to Decisions` inne i ett möte) skapas ett spårbart åtgärdsbeslut i ett befintligt eller nytt PDCA-möte, och blockern övergår till `In review`.
5. **Automatisk återkoppling (`syncBlockerLifecycle` / `toggleDecision`):** När PDCA-beslutet bockas av som `Done` stängs kopplad blocker automatiskt till `Resolved` (och återöppnas om beslutet sätts tillbaka till `Open`). När en KPI återgår till `On track` visas en grön rekommendationsbricka att blockern kan stängas.

### 3.6 KPI Performance & CSV Import (`kpis`, `import`)
- **Statuslogik (`computeKpiStatus`):** Jämför senaste ifyllda månadsvärde mot samma månads mål:
  - `higher`: `gap = actual - target`
  - `lower`: `gap = target - actual`
  - `range`: `gap = -Math.abs(actual - target)`
  - Klassificering: `gap >= 0` → **On track**, `gap >= -tolerance` → **At risk**, annars → **Off track**.
- **CSV-import (`csvRead` / `commitCsv`):** Stöder både `,` och `;` (inkl. kommadecimaler), kräver `kpi_id,month,actual` (+ valfri `target`), validerar hela batchen atomärt innan värden sparas och räknar direkt om länkade måls `performance`.

### 3.7 ISO Goal Compliance, Evidence Pack & Management Review (`iso`, `evidence`, `management`)
- **ISO-katalogadapter:** Refererar krav via stabila ID:n (`req-9001-6.2`, `req-14001-6.2`, `req-45001-6.2` m.fl.) och kan ersättas via JSON-import från SafeQMS befintliga ISO Standards-modul.
- **Audit Evidence Pack:** Sammanställer filtrerade mål, ISO-krav, planeringsstatus, risk-/process-/dokumentlänkar, KPI-serier, godkännandehistorik och PDCA-beslut – redo för PDF-utskrift eller JSON-export.
- **Management Review (§9.3):** Aggregerar måluppfyllelse, öppna blockers, planeringsluckor och föreslagna agendapunkter, och låter ledningen generera ett färdigt PDCA-mötesutkast med ett klick (`prepareManagementReview`).

---

## 4. Rollbaserad Åtkomstkontroll (RBAC — SafeQMS 6 Roller)

Modulen använder exakt SafeQMS sex befintliga roller (inga egna roller har uppfunnits):

| Roll | Synlighet (Scope) | Skapa/Ändra Mål & X-Matris | Ändra SE-ägarskap | Catchball | Formellt Godkännande | Eskalera & PDCA |
|---|---|---|---|---|---|---|
| **Administratör** | Hela organisationen | Ja (allt) | Ja | Läser + skapar vid behov | **Nej** (konfig/systemroll) | Ja (+ Settings/Blueprint) |
| **General director** | Hela organisationen | Ja (allt) | Ja | Ja (båda riktningar) | **Ja** | Ja |
| **QMS auditor** | Hela organisationen | Ja (allt) | Ja | Ja (båda riktningar) | **Ja** (meddelar GD) | Ja |
| **Department director** | Org + Uppsala + Production | Endast `Department: Production` | Ja | Egna mål + inbjuden top-down | Nej | Ja inom tilldelad enhet |
| **Auditor** | Org + Uppsala + Production | Nej (skrivskyddad) | Nej | Läsning | Nej | Nej (läsning) |
| **Basic user** | Publicerade (`Approved`) mål i enhet | Nej | Nej | Nej (dold meny) | Nej | Endast markera egna `Tasks` (`Team Leader`) |

*Viktig säkerhetsprincip:* Knappfiltrering (`roleButtonAllowed`), formulärlåsning (`rolePostRender`) och funktionskontroller (`roleCan`) i gränssnittet är endast **UI-demonstration**. I produktion måste Django/DRF genomdriva tenant-, scope- och rollbehörighet server-side.

---

## 5. Affärsregler, Tillståndsmaskiner & Beräkningsalgoritmer

En utvecklare som bygger modulen från grunden måste implementera följande exakta regler:

### 5.1 Målhierarki & Föräldravalidering (`permittedParents`)
- **Level-regler:**
  - `Organization` får **inte** ha någon förälder (`parent = null`).
  - `Site:*` måste ha en förälder med `level = 'Organization'`.
  - `Department:*` måste ha en förälder med `level.startsWith('Site:')`.
- **Cykelspärr:** Innan `parent` sparas traverseras alla ättlingar (`descendants`) till målet via BFS/DFS; ingen ättling (och inte målet självt) får väljas som förälder.
- **Nivåändring:** Ett mål får inte byta `level` om det har befintliga barnmål som därmed bryter nivåregeln ovan.

### 5.2 Godkännande- & Revisions-tillståndsmaskin (`Goal` & `Approval`)
```
[Draft] ──(goalPlanCheck OK + Catchball Aligned för icke-Org)──▶ [Pending] ──(GD / QMS approves)──▶ [Approved]
   ▲                                                                  │                                  │
   └──────────────(Request changes / Redigering av målfält)───────────┴──────────────────────────────────┘
                   (Vid redigering av Approved: arkivera snapshot i GoalRevision, bumpa revision +1)
```
- **ISO Planning Completeness (`goalPlanCheck`):** Returnerar `ready = true` först när **samtliga** är ifyllda:
  1. `title` (icke-tom)
  2. `owner` (icke-tom)
  3. `kpi` (giltig KPI-FK)
  4. `isoRefs` (minst 1 ISO-krav-FK)
  5. `planWhat` (vad ska göras)
  6. `resources` (resurser)
  7. `planDue` (slutdatum)
  8. `evaluation` (hur resultat utvärderas)
  9. `parent` (**krävs endast** om `level !== 'Organization'`)
- **Catchball-spärr före inskick (`submitGoal`):** Om `level !== 'Organization'` **måste** en aktiv Catchball-tråd finnas i status `Aligned` (undantag: top-level `Organization`-pelare kan skickas direkt till godkännande).

### 5.3 Catchball-tillståndsmaskin
```
[Draft] ──(cbSend)──▶ [Awaiting director] / [Awaiting department]
                             │          ▲
             (cbCounter) ────┘          │ (cbSend efter revidering)
                             ▼          │
                    [Changes requested] ┘
                             │
              (cbAlign av motpart vars tur det är)
                             ▼
                         [Aligned] ──(cbSubmit + goalPlanCheck OK)──▶ [Pending approval] ──(cbFinalDecision)──▶ [Approved]
```
- **Turordning (`turn`):** Bara den part vars `turn` det är (eller *QMS auditor* som substitut för *General director*) får köra `counter`, `align` eller `changes`.
- **Unikhet:** Max **en** aktiv (ej `Approved`/`Cancelled`) Catchball-tråd får existera per mål samtidigt.
- **Atomär överskrivning vid godkännande:** `goal.target` och `goal.resources` får **aldrig** uppdateras under `Draft`/`Awaiting`/`Aligned`. Uppdatering sker först i samma transaktion som `cbFinalDecision('Approved')`.

### 5.4 KPI-status & Trendberäkning (`computeKpiStatus` & `computeKpiStreak`)
1. Leta upp högsta månadsindex `n` (`0..11`) där både `values[n]` och `targets[n]` är ändliga tal. Saknas detta → `Not measured`.
2. Beräkna `gap`:
   - `direction === 'higher'`: `gap = actual - target`
   - `direction === 'lower'`: `gap = target - actual`
   - `direction === 'range'`: `gap = -Math.abs(actual - target)`
3. Status:
   - `gap >= 0` → **`On track`**
   - `gap >= -tolerance` → **`At risk`**
   - `gap < -tolerance` → **`Off track`**
4. **Negativ trend (`computeKpiStreak`):** Räkna baklänges från senaste ifyllda månad hur många **konsekutiva** månader som har `gap < 0` (avbryt vid första månad med `gap >= 0`).

### 5.5 Auto-detektering av PDCA-avvikelser (`detectAutoSignals`)
- **KPI-signal:** Genereras för varje KPI i roll/scope om `status === 'Off track'` (**Critical**) ELLER `status === 'At risk' && streak >= 2` (**High**). Visas även om manuell blocker redan finns (då med flagga `hasManualBlocker = true`).
- **Initiativ-signal:** Genereras för varje initiativ i roll/scope med `status === 'At risk'` (**High**), **men döljs** automatiskt om en öppen/aktiv manuell blocker (`status !== 'Resolved'`) redan finns på initiativet.
- **PDCA-kopplingsstatus:** Om det redan finns ett öppet beslut i `reviews[].decisions` med `linkedType` + `linkedId`, visas status `In review` (annars `Open`).

### 5.6 Blocker ↔ PDCA-beslut (Dubbelriktad livscykel)
- `Open` → `convertToPdcaDecision` / `quickAddReviewDecision` → skapar `Decision(status='Open', blockerId, linkedType, linkedId)` och sätter `Blocker(status='In review', reviewId, decisionIndex)`.
- När `Decision.status` växlas till `Done` → sätter automatiskt `Blocker.status = 'Resolved'`, `resolvedAt = today`.
- När `Decision.status` växlas tillbaka till `Open` → återställer `Blocker.status = 'In review'`.
- När `resolveBlocker()` körs manuellt → sätter kopplat `Decision.status = 'Done'`.

### 5.7 SQDC-poäng & TOC-prioritering (`sqdcScore`)
- Varje pelare `{S, Q, D, C}` har värde `0` (None), `1` (Support ○) eller `2` (Primary ●).
- `pillars` = antal pelare med värde `> 0` (`0..4`).
- `weighted` = `S + Q + D + C` (`0..8`).
- **Klassificeringsregler:**
  - `isBottleneck === true` → **`TOC Bottleneck`**
  - `S === 2` → **`Safety Priority`** (alltid prioriterad)
  - `pillars >= 3` → **`3/4` / `4/4 SQDC`** (hög systemhävstång)
  - `S < 2 && !isBottleneck && pillars <= 1` → **`Narrow Focus`** (varning mot suboptimering / "whack-a-mole")

### 5.8 360° X-Matrix Kedjepropagering (`xm3Influence`)
När användaren väljer en nod i X-matrisen markeras hela den kausala kedjan:
- **Hierarkisk styrka (`xm4HierarchyStrength`):** `2` (blå hel fylld punkt) om `g.parent === corp.id`; `1` (blå halvfylld punkt) om `corp.id` är farförälder via ett Site-mål; annars `0`.
- **Klick på `corp` eller `annual`:** Samlar alla underordnade `annual`-mål → deras kopplade `initiatives` (via `i.goal` ELLER `relations > 0`) → `corp`-föräldrar → länkade `kpis` (via `goal.kpi` ELLER `relations[initiative→kpi] > 0`) → `owners` med `kpiOwners > 0`.
- **Klick på `initiative`:** Samlar stödjande `annual`-mål → deras `corp`-föräldrar → `kpis` kopplade till initiativet/målen → `owners`.
- **Klick på `kpi`:** Samlar `annual`-mål med `g.kpi === kpi` + `initiatives` med `relations[i→kpi] > 0` → `annual` som stöds av dessa initiativ → `corp` → `owners`.
- **Klick på `owner` (SE-vinge):** Samlar `kpis` med `kpiOwners[k, owner] > 0` → `initiatives` där `i.owner === owner` eller som driver markerad KPI → `annual` där `g.owner === owner` eller som delar markerad KPI/initiativ → `corp`-föräldrar.

---

## 6. Databasdesign (PostgreSQL / Django ORM)

Nedan är rekommenderad normaliserad relationsmodell för produktion i SafeQMS (samtliga tabeller har `company_id` / `tenant_id` för strikt tenant-isolering):

| Tabell / Modell | Nyckelfält & Datatyper | Constraints & Index |
|---|---|---|
| `StrategyPlan` | `id (UUID/PK)`, `company_id (FK)`, `org_unit_id (FK)`, `period (Char)`, `name (Char)`, `status (Enum)`, `revision (Int)`, `owner_id (FK User)` | `UNIQUE(company_id, org_unit_id, period, revision)` |
| `StrategicGoal` | `id (PK)`, `company_id (FK)`, `code (G-001)`, `title`, `description`, `level (Organization\|Site\|Department)`, `org_unit_id (FK)`, `parent_id (FK self, null=True)`, `owner_id (FK User)`, `period`, `kpi_id (FK KpiDefinition)`, `baseline (Decimal)`, `target (Decimal)`, `unit`, `lifecycle_status`, `approval_status`, `plan_what`, `resources`, `plan_due (Date)`, `evaluation`, `risk_refs (JSON/M2M)`, `process_refs (JSON/M2M)`, `evidence_refs (JSON/M2M)`, `revision (Int)` | `INDEX(company_id, parent_id)`, `CHECK(parent_id != id)` |
| `GoalIsoRequirement` | `goal_id (FK)`, `iso_requirement_id (FK befintlig SafeQMS ISO-tabell)` | `UNIQUE(goal_id, iso_requirement_id)` |
| `GoalRevisionSnapshot` | `id`, `goal_id (FK)`, `revision (Int)`, `snapshot_json (JSONB)`, `archived_at (DateTime)`, `archived_by (FK)` | Oföränderlig (`immutable`) |
| `KpiDefinition` | `id`, `company_id (FK)`, `code (K-001)`, `name`, `unit`, `direction (higher\|lower\|range)`, `tolerance (Decimal)`, `source (Char)`, `source_updated_at` | `UNIQUE(company_id, code)` |
| `KpiMonthlyObservation` | `id`, `kpi_id (FK)`, `year (Int)`, `month (1..12)`, `target_value (Decimal, null)`, `actual_value (Decimal, null)`, `updated_by (FK)`, `import_batch_id (FK, null)` | `UNIQUE(kpi_id, year, month)` |
| `KpiCrossFunctionalOwner` | `id`, `kpi_id (FK)`, `user_or_role_id (FK)`, `strength (1=Support \| 2=Primary)`, `note (Text)` | `UNIQUE(kpi_id, user_or_role_id)` |
| `Initiative` | `id`, `company_id (FK)`, `code (I-001)`, `title`, `description`, `owner_id (FK)`, `primary_goal_id (FK StrategicGoal)`, `status`, `progress (0..100)`, `budget`, `sqdc_s (0..2)`, `sqdc_q (0..2)`, `sqdc_d (0..2)`, `sqdc_c (0..2)`, `value_stream (Char)`, `is_bottleneck (Bool)` | `CHECK(progress BETWEEN 0 AND 100)` |
| `GoalRelationship` | `id`, `company_id`, `source_type (goal\|initiative)`, `source_id`, `target_type (initiative\|kpi)`, `target_id`, `strength (0.5\|1\|2)`, `note` | `UNIQUE(source_type, source_id, target_type, target_id)` |
| `ProjectA3` | `id`, `initiative_id (FK)`, `code`, `title`, `owner_id`, `status`, `progress`, `problem`, `current_condition`, `target_condition`, `root_cause`, `countermeasures`, `learning` | — |
| `ProjectTask` | `id`, `project_id (FK)`, `title`, `owner_id (FK)`, `due_date`, `status (Open\|In progress\|Done)` | — |
| `CatchballThread` | `id`, `goal_id (FK)`, `status`, `origin_user_id (FK)`, `recipient_scope_id (FK)`, `recipient_role`, `current_turn_role`, `proposed_target (Decimal)`, `proposed_resources`, `proposed_due`, `rationale`, `version (Int)` | Partial unique index för max 1 aktiv tråd per `goal_id` |
| `CatchballEvent` | `id`, `thread_id (FK)`, `actor_id (FK)`, `kind`, `message`, `target_snapshot`, `resources_snapshot`, `created_at` | Append-only audit log |
| `GoalApprovalRequest` | `id`, `goal_id (FK)`, `catchball_id (FK, null)`, `requester_id`, `approver_id (null)`, `status`, `comment`, `previous_snapshot (JSONB)`, `created_at`, `resolved_at` | Transaktionell godkännandepost |
| `DirectorDecisionNotice` | `id`, `approval_id (FK)`, `recipient_user_id (FK)`, `is_read (Bool)`, `read_at` | Skapas alltid då `QMS auditor` godkänner |
| `ImplementationBlocker` | `id`, `company_id`, `target_type (goal\|initiative\|project\|kpi)`, `target_id`, `org_unit_id`, `category`, `severity (Critical\|High\|Medium)`, `summary`, `needed_action`, `owner_id`, `raised_by_id`, `raised_at`, `status (Open\|In review\|Resolved)`, `resolved_at`, `resolution_note` | Polymorf referens + scope-index |
| `PdcaReview` & `PdcaDecision` | `Review(id, company_id, title, date, org_unit_id, notes)` · `Decision(id, review_id, text, owner_id, due_date, status, blocker_id FK null, linked_type, linked_id)` | `Decision` uppdaterar `Blocker.status` via signal/service |

---

## 7. REST API-kontrakt (Django REST Framework)

Alla endpoints kräver JWT/Session-autentisering, filtrerar automatiskt på `request.user.company_id` + tilldelat scope och validerar rollbehörighet server-side.

| Domän | Metod & Endpoint | Payload / Ansvar & Statuskoder |
|---|---|---|
| **Mål** | `GET /api/goals/?scope=&year=` | Returnerar mål synliga för användarens roll + beräknad `performance` & `plan_completeness`. |
| **Mål** | `POST /api/goals/` / `PATCH /api/goals/{id}/` | Validerar nivå/parent-cykler (`400`). Vid ändring av `Approved`-mål arkiveras snapshot i `GoalRevisionSnapshot` och status sätts till `Draft` (`revision + 1`). Kräver `revision` för optimistisk låsning (`409 Conflict`). |
| **Mål** | `POST /api/goals/{id}/submit/` | Kontrollerar `goalPlanCheck` + Catchball `Aligned` (`400` med fältlista vid luckor). Skapar `GoalApprovalRequest`. |
| **X-Matrix** | `GET /api/goals/x-matrix/?scope=&year=` | Aggregerar `corporate_goals`, `annual_goals`, `initiatives`, `kpis`, `relations`, `kpi_owners`, `active_blockers` i ett anrop utan trunkering. |
| **X-Matrix** | `PUT /api/goals/relationships/` | `{ from_type, from_id, to_type, to_id, strength, note }`. `strength=0` raderar länken. |
| **SE Ägarskap** | `PUT /api/kpis/{id}/owners/` | `{ owner_id, strength (0|1|2), note }`. Endast `Admin / General director / QMS auditor / Department director`. |
| **Initiativ & SQDC** | `POST /api/initiatives/` / `PATCH /api/initiatives/{id}/` | Inkluderar `{ sqdc: {s,q,d,c}, value_stream, is_bottleneck, progress, status }`. |
| **KPI & CSV** | `POST /api/kpis/{id}/observations/` | Registrerar månadsutfall, räknar om måluppfyllelse och auto-signaler. |
| **KPI & CSV** | `POST /api/kpis/import-csv/` | Multipart CSV eller råtext. Atomär batch-validering (`@transaction.atomic`); hela batchen nekas (`400` med radfel) om någon rad är ogiltig. |
| **Catchball** | `POST /api/catchballs/` · `.../messages/` · `.../align/` · `.../submit/` | Kontrollerar `turn` och roll (`403` om fel motpart försöker svara). Skapar append-only `CatchballEvent` + notifieringar. |
| **Godkännande** | `POST /api/approvals/{id}/decide/` | `{ decision: 'Approved'\|'Changes requested', comment }`. Endast `General director` eller `QMS auditor` (`403` för `Administratör`). Vid `QMS auditor` skapas `DirectorDecisionNotice`. |
| **Blockers & PDCA** | `GET /api/pdca/exception-queue/?scope=` | Returnerar sammanslagna öppna `ImplementationBlocker` + beräknade `auto_signals` sorterade efter allvarlighetsgrad. |
| **Blockers & PDCA** | `POST /api/blockers/` · `POST /api/blockers/{id}/resolve/` · `.../reopen/` | Skapar/stänger blocker och synkar ev. länkat `PdcaDecision`. |
| **Blockers & PDCA** | `POST /api/reviews/{id}/decisions/` · `PATCH /api/reviews/decisions/{did}/` | Lägger till eller växlar `Open`/`Done` (auto-stänger/återöppnar kopplad `Blocker` i samma transaktion). |
| **ISO & Export** | `GET /api/goals/evidence-pack/?goal_id=` · `POST /api/iso-catalog/import/` | Returnerar komplett JSON-paket; hämtar/synkar krav från SafeQMS ISO Standards-modul. |

---

## 8. Importformat & Externa Integrationer

### 8.1 KPI CSV-import (`csvRead`)
- **Obligatoriska kolumner:** `kpi_id`, `month`, `actual` (valfri: `target`).
- **Avgränsare:** Detekterar automatiskt `,` eller `;` (vid `;` konverteras kommadecimaler `,` → `.` automatiskt).
- **Accepterade månadsformat:** `YYYY-MM` (t.ex. `2027-08`), kortnamn (`Aug`), eller siffra (`8` / `08`).
- **Valideringsregler:** KPI-ID måste finnas, inga dubbletter av `(kpi_id, month)` inom samma fil, `actual`/`target` måste vara giltiga tal, max 500 KB i klientdemo (servern styr gräns i produktion).

### 8.2 ISO Standards Katalogkontrakt (`normalizeCatalog`)
```json
{
  "standards": [
    {
      "id": "safeqms-9001",
      "code": "ISO 9001",
      "edition": "2015",
      "requirements": [
        { "id": "req-9001-6.2", "number": "6.2", "title": "Quality objectives and planning to achieve them" }
      ]
    }
  ]
}
```
- **Regel:** Krav-ID:n (`requirements[].id`) måste vara stabila över tid (`^[\w.:-]{2,100}$`) och unika globalt i katalogen så att länkade mål aldrig tappar spårbarhet.

---

## 9. UI/UX- & Layoutspecifikation (Frontend)

### 9.1 CSS Grid-arkitektur för 360° Visual X-Matrix
X-matrisen byggs som ett 4-kolumners × 3-raders CSS Grid (`.xm3-board`) med dynamiska storlekar från datamängden (inga hårdkodade maxgränser; horisontell scroll vid många poster):

| | Kolumn 1 (`--xm-left`) | Kolumn 2 (`390–415px`) | Kolumn 3 (`--xm-right`) | Kolumn 4 (`225–245px`) |
|---|---|---|---|---|
| **Rad 1 (`--xm-top`)** | **NW:** Mål × Initiativ (`.xm3-tl`) | **N:** Initiativ + SQDC + TOC (`.xm3-toplist`) | **NE:** Initiativ × KPI (`.xm3-tr`) | Symbolförklaring (`.xm3-legendpanel`) |
| **Rad 2 (`310px`)** | **W:** Annual Goals, roterad `-90deg` (`.xm3-leftaxis`) | **Kärna:** 4 kvadrant-trianglar (`.xm3-core`) | **E:** KPIs, roterad `-90deg` (`.xm3-rightaxis`) | SE-vingens rubrik (`.xm3-ownerwinghead`) |
| **Rad 3 (`--xm-bottom`)** | **SW:** Hierarki Corporate ↔ Annual (`.xm3-bl`) | **S:** Corporate Goals (`.xm3-bottomlist`) | **SE:** KPI × Ägare-matris (`.xm3-br-grid`) | **SE:** Cross-Functional Owners `W1–Wn` (`.xm3-ownerslist`) |

### 9.2 Övriga UI-regler
- **Icke-blockerande modaler:** Samtliga dialoger (`alert`, `confirm`, `prompt`, `counter`, `escalate`, `pdcaDecision`) använder React-komponenter i DOM:en – **aldrig** `window.alert()`, `window.confirm()`, `window.prompt()` eller `window.open()` (p.g.a. iFrame-restriktioner).
- **Utskriftsstöd (`@media print`):** Klasserna `.no-print` döljer filter/verktygsfält vid utskrift av **Strategy A3**, **Project A3**, **X-Matrix** och **Audit Evidence Pack** till PDF/A3-liggande.

---

## 10. Säkerhetskrav & Icke-funktionella Krav

1. **Zero Trust mot klientdata:** Servern får aldrig lita på `demoRole`, `scope`, `approvedBy`, `performance` eller `approval` från frontend. All auktorisering härleds från autentiserad användares session/JWT och org-tillhörighet i databasen.
2. **Separering av ansvar (SoD):** `Administratör` får konfigurera systemet men inte automatiskt godkänna affärsmål. Godkännande kräver `General director` eller `QMS auditor`.
3. **Oföränderlig revisionslogg (Audit Trail):** Alla godkännanden, Catchball-händelser, blocker-eskaleringar och PDCA-beslut ska loggas med `actor_user_id`, `tenant_id`, `timestamp` (UTC) och föregående värden.
4. **Optimistisk samtidighetskontroll:** Redigering av mål, Catchball-trådar och X-matrisrelationer ska skicka `revision`/`version` så att två samtida chefer inte skriver över varandras ändringar tyst.

---

## 11. Acceptanskriterier & Kända Synk-punkter inför Bygge

### 11.1 Testmatris som måste passera vid byggande
- **Rolltest:** Samtliga 6 roller ser rätt scope; `Department director` kan svara på inbjuden top-down Catchball (`CB-002`) utan att kunna ändra Site-målet; `QMS auditor` kan godkänna mål och skapar då en läskvittensnotis till `General director`; `Auditor` och `Basic user` kan inte mutera relationer eller PDCA-beslut.
- **ISO-grind:** Försök att skicka/godkänna ett mål utan samtliga 8 planeringsfält (eller utan `Aligned` Catchball för Site/Dept-mål) nekas med exakt lista på vad som saknas.
- **KPI → Mål → PDCA:** Import av ett rött KPI-utfall sätter länkade mål till `Off track`, tänder `! Off` i X-matrisen och lägger till en `Auto Exception` i `PDCA Reviews`.
- **Blocker-loop:** Eskalering från initiativ/KPI skapar blocker → konvertering i PDCA Review skapar beslut (`In review`) → klarmarkering av beslutet (`Done`) auto-löser blockern (`Resolved`).

### 11.2 Verifierade Synk-punkter (Implementerade i prototypen & krav för produktion)
Följande 6 end-to-end-synkroniseringsregler har verifierats och implementerats i prototypen och **måste** bevaras i produktionslagret:
1. **Goal Target ↔ KPI Monthly Targets:** `syncKpiTargetsFromGoal()` synkar `goal.target` till `kpi.targets` från senaste mätta månad och framåt vid målsparning/Catchball-godkännande och räknar direkt om målstatus (`syncGoalPerformance()`). Strategy A3 Box 04 läser samma aktiva KPI-target.
2. **Task → Project → Initiative Roll-up:** `syncExecutionProgress()` räknar automatiskt om `project.progress` från klickbara `tasks` (`Open → In progress → Done`) och rullar upp snittet till `initiative.progress` (med automatisk `Completed`-hantering vid 100 %). Initiativsidan stöder även redigering av `progress` och `status`.
3. **Enhetlig Mål ↔ Initiativ-koppling:** Hjälpfunktionen `initiativeLinkedToGoal()` används enhetligt i X-Matrisen, Strategy A3 och Audit Evidence Pack (`i.goal` + `relations`).
4. **Konsekvent Scope- & Rollfiltrering:** `Overview`-blockerräknaren, `Goal Cascade`, `●/○`-räknarna i SE-vingen, `PDCA Reviews`, `Management Review Inputs`, `Audit Evidence Pack` och `Approvals` filtreras enhetligt mot aktivt scope och användarroll.
5. **Blocker-sektion på Mål-sidan & Strikt RBAC:** Målformuläret inkluderar `⚑ Escalate blocker` och `blockerSectionHtml('goal', id)`. Formulärlåsning (`rolePostRender`) och funktionskontroller (`roleCan`) spärrar obehöriga mutationer i både UI och handlers (`toggleDecision`, `saveGoal`, `saveInitiative`, `saveProjectA3`, `addTask`, `toggleTaskStatus`, `decide`, `revisePlan`).
6. **Konsistent Startdata (Seed & Migrering):** `G-007` matchar `AP-001` (`Pending`), och `Safety Coordinator` har tilldelad SE-koppling till `K-008` så inga ledare saknar KPI-ansvar i X-Matrisen.


