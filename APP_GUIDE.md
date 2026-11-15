# SafeQMS · Goal Management — Komplett Appguide för Alla Användare

> **Vem är den här guiden för?**  
> Den här guiden är skriven så att **vem som helst** — oavsett om du är VD, platschef, avdelningschef, kvalitetsrevisor, operatör eller helt ny i appen — ska förstå exakt hur **SafeQMS Goal Management** fungerar, vad varje sida och symbol betyder, och hur allt hänger ihop från företagsstrategi till dagligt arbete.

---

## 1. Vad gör appen? (Helhetsbilden på 1 minut)

Tänk dig att ett företag bestämmer: *"Vi ska bli bättre på säkerhet, kvalitet, miljö och leverans."*  
Problemet i många företag är att de fina orden fastnar i en PowerPoint – ingen vet vem som gör vad på golvet, eller om projekten faktiskt förbättrar siffrorna.

**SafeQMS Goal Management** löser detta genom att koppla ihop **alla steg på ett och samma ställe**:

```
  1. Koncernmål (Varför & vart ska vi?)
         │
         ▼
  2. Anläggnings- & Avdelningsmål (Vem tar vilken del?)
         │   ◄──►  Catchball ("bollande" av mål & resurser) + Formellt Godkännande
         ▼
  3. Initiativ & Projekt A3 (Vad gör vi konkret för att nå dit?)
         │   ◄──►  SQDC-prioritering & Flaskhalsfokus (TOC)
         ▼
  4. Aktiviteter / Tasks (Dagliga uppgifter i projektet)
         │
         ▼
  5. KPI & Bowling Chart (Mäter om siffrorna faktiskt blir bättre varje månad)
         │
         ▼
  6. Blockers & PDCA Reviews (Flaggar problem & fattar ledningsbeslut)
         │
         ▼
  7. ISO-efterlevnad & Revisionspaket (All dokumentation redo för revisor med ett klick)
```

### De 3 viktigaste reglerna att förstå direkt
1. **Allt hänger ihop i realtid:** Ändrar du ett mål, ett nyckeltal (KPI), en aktivitet eller ett hinder på ett ställe så uppdateras Översikten, X-Matrisen, Strategy A3, PDCA-kön och Revisionspaketet automatiskt.
2. **Att jobba hårt ≠ att ha nått målet:** Att ett projekt är **75 % klart** betyder *bara* att 75 % av aktiviteterna är gjorda. Om målet är **grönt, gult eller rött** avgörs *endast* av de verkliga mätvärdena i **KPI & Bowling Chart**.
3. **Ledningen fokuserar på det som skaver ("Management by Exception"):** Allt som går enligt plan sköter sig självt. Röda KPI:er, upprepade varningar och eskalerade hinder (`⚑`) samlas automatiskt i ledningens **PDCA Exception Queue**.

---

## 2. Så ser skärmen ut (Toppmeny, Sidomeny & Tema)

### Toppfältet (längst upp)
- **SAFEQMS Logo:** Appens namn och aktuell prototypsversion.
- **Role (Rollväxlare):** Här kan du provköra appen som **6 olika användarroller** (t.ex. VD, Avdelningschef, Revisor eller Basanvändare) för att se exakt vad varje person ser och får göra.
- **☀ Light / ☾ Dark:** Växlar mellan mörkt tema (standard) och ljust tema. Ditt val sparas automatiskt i webbläsaren. *(Tips: När du skriver ut eller sparar som PDF blir sidorna alltid rena och vita på papperet automatiskt!)*

### Sidomenyn (till vänster)
Appen är uppdelad i 6 tydliga huvudområden:
1. **▦ Overview** – Din startpanel med det viktigaste just nu.
2. **⑂ Strategy & Goals** – Huvudmål, Målträd, 360° X-Matris och Strategy A3.
3. **▤ Initiatives & Projects** – Förbättringsinitiativ, SQDC-prioritering, Projekt A3 och aktiviteter.
4. **▥ Performance** – Månadsgrafer, Bowling Chart och CSV/Excel-import.
5. **⟳ Reviews & Alignment** – Catchball-dialog, PDCA-möten med avvikelsekö och Formella godkännanden.
6. **▣ ISO & Evidence** – ISO-kravuppfyllelse, Audit Evidence Pack och underlag till Ledningens genomgång.
7. **⚙ Admin / Demo Settings** *(visas endast för Administratör)* – Återställ demo, ladda synkat demo, exportera all data som JSON eller se teknisk API-ritning.

### Scope- och Årslisten (på flera sidor)
Högst upp på sidor som *Overview, Goal Cascade, X-Matrix, Strategy A3, PDCA Reviews* och *ISO/Evidence* finns två filter:
- **Organizational scope:** Välj att se hela **Organization**, en anläggning (**Site: Uppsala** / **Site: Falkenberg**) eller en avdelning (**Department: Production / Maintenance / Quality**). Alla siffror, kort, matriser, blockeringar och möten filtreras direkt efter ditt val!
- **Strategy period:** Välj målår (**2027, 2028, 2029**).

---

## 3. Rollerna i appen (Vem får göra vad?)

Appen använder SafeQMS **6 verkliga roller**. Använd rollväxlaren för att testa hur appen anpassar sig:

| Roll | Vem det motsvarar | Vad ser personen? | Vad kan personen göra? |
|---|---|---|---|
| **General director** | VD / Högsta ledning | Hela organisationen | Skapa/ändra alla mål, svara i Catchball, **formellt godkänna mål**, hantera X-Matris, initiativ, KPI:er och PDCA-beslut. Ser även en särskild *General director decision feed*. |
| **QMS auditor** | Kvalitets- / ISO-ansvarig | Hela organisationen | Samma strategi- och **godkännanderätt** som VD (kan vikariera för VD). När QMS auditor godkänner ett mål skickas automatiskt en informationsnotis till General director. |
| **Department director** | Avdelningschef *(demo: Uppsala / Production)* | Organization + Uppsala + Production | Skapa/ändra mål & initiativ **inom sin egen avdelning**, förhandla framåt/tillbaka i Catchball, eskalera hinder (`⚑`), uppdatera tilldelad KPI (`K-002`) och delta i PDCA-möten. Kan *inte* själv godkänna mål formellt. |
| **Administratör** | Systemadministratör | Hela organisationen | Konfigurera allt, redigera mål/initiativ/KPI:er, importera ISO-kataloger och använda **Admin / Demo Settings** (reset/export). *Får inte* formellt godkänna affärsmål (ansvarsfördelning). |
| **Auditor** | Intern/Extern Revisor | Tilldelad enhet (Uppsala / Production) | **Endast läsläge** på mål, X-Matris, KPI:er, Catchball, PDCA-möten och **Audit Evidence Pack** för att granska bevis och spårbarhet. Kan inte ändra något. |
| **Basic user** | Medarbetare / Team Leader | Endast **godkända** mål i sin enhet | Ser översikten, målen och sin tilldelade lista **"My Assigned Actions"**. Kan markera **sina egna aktiviteter** som klara (`Done`), vilket automatiskt räknar upp projektets framsteg. |

---

## 4. Detaljerad genomgång – Sida för sida

### 4.1 Overview (Startsidan)
Startsidan ger dig lägesbilden på 5 sekunder:
- **Organization · Strategic Pillars (4 färgade kort):**
  - *Blå rand (⚙):* Operational Excellence (Produktivitet / OEE).
  - *Turkos/Teal rand (◆):* Quality Excellence & Customer Trust.
  - *Grön rand (♻):* Environmental Sustainability (ISO 14001).
  - *Amber/Orange rand (✚):* Safety & Wellbeing First (ISO 45001).
- **4 Nyckelkort:** Visar antal mål i valt scope, hur många som är *On Track*, antal aktiva initiativ samt **Escalated Blockers** (eller *My Actions* för Basic user).
- **Strategic Priorities:** Tabell med de viktigaste målen och deras live-status.
- **Management Attention · Exceptions:** Visar röda KPI-signaler (`⚠`), eskalerade hinder (`⚑`) och mål som väntar på godkännande (`◷`).
- **Strategy-to-execution flow:** Visuell kedja som påminner om hela flödet.
- **Catchball & General director decision feed:** Snabbgenväg till pågående målförhandlingar samt beslutshistorik för VD.

---

### 4.2 Strategy & Goals (Strategi & Mål)

Denna flik har fyra undersidor plus formuläret för att redigera/skapa mål:

#### A. Main Goals (`pillars`)
Här ser du företagets långsiktiga huvudpelare (*Organization*-mål). Klicka **Edit Goal** för att döpa om en pelare, ändra ansvarig, koppla ISO-kapitel eller lägga till en ny huvudpelare (**+ Add Main Goal**).

#### B. Goal Cascade (`cascade`)
Visar hur mål bryts ner från **Organization → Site → Department**:
- Växla mellan **Hierarchy** (interaktivt träd med `▾`/`▸` fällknappar) och **Table** (tabellvy).
- Klicka på **Change parent** på ett anläggnings- eller avdelningsmål för att flytta det under en annan förälder. Appen förhindrar automatiskt ogiltiga hopp eller cirkulära loopar.
- Filtrerar trädet efter det organisations-scope du valt i toppen.

#### C. 360° Visual X-Matrix (`matrix`)
Appens hjärta för strategisk överblick! Du kan växla mellan **Visual X-Matrix** och **Relationship tables**.

**Så läser du X-Matrisen medsols på 60 sekunder:**
1. **Botten (S) – Corporate Goals (`C1–C4`):** Företagets långsiktiga huvudmål.
2. **Nedre vänster (SW) – Blå punkter:** Visar hierarkin mellan Corporate Goals och Annual Goals (`●` = direkt förälder, `◐` = via Site-mål).
3. **Vänster (W) – Annual Goals (`A1–An`):** Års- och avdelningsmål (roterad text).
4. **Övre vänster (NW) – Turkosa punkter:** Hur starkt varje **Årsmål** drivs av respektive **Initiativ**.
   - `●` = Strong (2) · `◐` = Medium (1) · `○` = Weak (0.5) · `↗` = Primärt tilldelat mål utan satt styrka.
5. **Toppen (N) – Initiatives (`I1–In`):** Förbättringsinitiativen! Här ser du även små färgade **`S Q D C`**-brickor, ev. **`TOC`**-flaskhalstagg och röd flagga `⚑` om det finns öppna hinder.
6. **Övre höger (NE) – Turkosa punkter:** Vilka **KPI:er** som påverkas av varje **Initiativ**.
7. **Höger (E) – KPIs (`K1–Kn`):** Mätetalen med automatiska varningsmärken (`! Off`, `! Risk`, `⚑`).
8. **Nedre höger (SE) – Cross-Functional Ownership (Lila vinge, `W1–Wn`):** Visar **VEM** (vilka roller/chefer) som delar ansvaret för varje KPI så att avdelningar inte jobbar i stuprör:
   - `●` (**Primary Owner**) = Huvudansvarig för KPI:et.
   - `○` (**Support**) = Tvärfunktionell stödroll (t.ex. Underhåll stöttar Produktionens OEE).

> **Interaktivitet:** Klicka på **vilken rad, kolumn eller prick som helst**! Då tonas resten ned och hela den anslutna kedjan från Koncernmål → Årsmål → Initiativ → KPI → Tvärfunktionella ägare tänds upp, samtidigt som inspektionspanelen längst ned låter dig öppna posten, ändra styrka, skriva motivering eller eskalera ett hinder.

#### D. Strategy A3 (`a3`)
En färdig, utskrivbar **1-sidig strategirapport (6 boxar)** som hämtar all data automatiskt – inga extra fält att fylla i:
- **01** Strategisk inriktning · **02** Årsmål & status · **03** X-Matrix-snapshot · **04** KPI-utfall vs målvärde · **05** Initiativ med SQDC/TOC & eskalerade blockeringar · **06** Senaste PDCA-beslut & revisionsnummer.
- Klicka **Print / Save PDF (A3)** för att exportera i liggande A3-format.

#### E. Skapa / Redigera Mål (`goal` / `newgoal`)
Delad i 5 tydliga steg:
1. **Define strategic goal:** Titel, nivå (*Organization / Site / Department*), primär förälder, ansvarig, period och livscykelstatus.
2. **Measure performance:** Välj länkat KPI, baslinje, **Target** och enhet. *(Obs: När du sparar ett uppdaterat Target eller godkänner det i Catchball uppdateras det länkade KPI:ets framtida månadsmål automatiskt!)*
3. **ISO Standards & Requirements:** Bocka för vilka ISO-krav (t.ex. `ISO 9001 · 6.2`, `ISO 14001 · 6.2`, `ISO 45001 · 6.2`) som målet uppfyller.
4. **Implementation planning:** ISO §6.2 kräver att du fyller i **What will be done**, **Required resources**, **When completed**, och **How results will be evaluated** (samt valfria ID:n för Risker, Processer och Dokument).
5. **Alignment & governance:** Visar live-checklistan **Goal Planning Completeness**. Om något saknas kan målet inte skickas till formellt godkännande.
- **Revisionsskydd:** Om du redigerar ett redan godkänt (`Approved`) mål skapas en ny utkastversion (`v2 Draft`), och den gamla godkända versionen arkiveras tryggt i historiken.
- **Målblockeringar:** Längst ned på befintliga mål kan du även eskalera och följa upp hinder specifikt för det målet (`⚑ Escalate blocker`).

---

### 4.3 Initiatives & Projects (Genomförande, SQDC & Flaskhalsar)

#### A. Portfolio & Projects (`projects`)
Här prioriterar och följer du upp själva arbetet som ska förändra siffrorna:
- **SQDC-prioritering:** Varje initiativ poängsätts på **S**afety, **Q**uality, **D**elivery och **C**ost (`–` Ingen, `○` Support, `●` Primary).
- **TOC Bottleneck (Theory of Constraints):** Markerar om initiativet direkt lättar på värdeflödets största flaskhals.
- **Smarta prioriteringstaggar:**
  - `TOC Bottleneck` (Turkos) – Löser en systemflaskhals.
  - `Safety Priority` (Grön) – `S = Primary` går alltid före allt annat.
  - `3/4` eller `4/4 SQDC` (Teal) – Hög hävstång över flera dimensioner samtidigt.
  - `Narrow Focus` (Gul varning) – Ensidig punktinsats ("whack-a-mole") som bör granskas innan man lägger tid på den.
- Använd filterknapparna (`All`, `TOC Bottleneck`, `High SQDC Leverage`, `Safety Priority`, `Narrow / Verify`) för att sortera portföljen direkt.

#### B. Initiativdetalj (`initiative/:id`)
Här ser du beskrivning, budget, ägare, länkade Projekt A3 och ett formulär för att uppdatera:
- **Progress %** och **Execution Status** (`Planned`, `On track`, `At risk`, `Completed`).
- **Value Stream / Bottleneck Target**, **TOC-flagga** och **S/Q/D/C-betyg**.
- **Escalated Blockers:** Eskalera hinder (`⚑ Escalate blocker`) om budget, resurser eller teknik stoppar initiativet.

#### C. Project A3 (`project/:id`)
En klassisk Lean/A3-problemlösningsmall uppbyggd i 9 rutor:
- **01 Problem** · **02 Current Condition** · **03 Target Condition** · **04 Root Cause** · **05 Countermeasures** · **06 Standardize & Learn**.
- **07 Implementation Plan & Milestones (Aktiviteter):**
  - Lägg till aktiviteter via **Add activity**.
  - **Klicka direkt på statusbrickan** (`Open` → `In progress` → `Done`) på en aktivitet för att uppdatera den!
  - **Automatisk uppräkning:** Varje gång en aktivitet läggs till eller ändrar status räknas projektets **Progress %** om automatiskt (`Done` = 100 %, `In progress` = 50 %, `Open` = 0 %), och snittet rullas upp till det överordnade **Initiativets Progress %**! (Når allt 100 % markeras projektet/initiativet automatiskt som `Completed`).
- **08 Check Results & Active Blockers:** Visar projektprocent och ev. varningar från moderinitiativet.
- **09 Escalated Project Blockers:** Projektets egna eskalerade hinder.

---

### 4.4 Performance (KPI:er, Bowling Chart & CSV-import)

#### A. KPIs & Bowling Chart (`kpis`)
Välj KPI i rullistan för att se:
- **4 Sammanfattningskort:** Senaste utfall, Planerat målvärde, Automatisk status och Förbättringsriktning (`↑ Higher` eller `↓ Lower`).
- **Linjediagram:** Utfall (teal linje) mot Plan (orange linje) månad för månad.
- **Bowling Chart (Jan–Dec):**
  - Visar Target, Actual, Gynnsamt/Ogynnsamt Gap och Status för varje månad.
  - **Så räknas färgen ut:**
    - **On track (Grön):** Utfallet är lika bra som eller bättre än Target (`gap >= 0`). Att slå målet bestraffas aldrig.
    - **At risk (Gul):** Utfallet missar Target men ryms inom KPI:ets tolerans (`gap >= -tolerance`).
    - **Off track (Röd):** Utfallet är sämre än Target + tolerans (`gap < -tolerance`).
- **Record next month actual:** Lägg in nästa månads siffra manuellt – alla länkade måls status uppdateras direkt.

#### B. CSV Import (`import`)
Importera många KPI-siffror samtidigt från Excel/ERP:
1. Klistra in CSV-text eller ladda upp en `.csv`-fil (kolumner: `kpi_id,month,actual` + valfritt `target`).
2. Stöder både komma (`,`) och semikolon (`;`, inkl. svenska kommadecimaler som `74,5`).
3. Accepterar månader som `2027-08`, `Aug` eller `8`.
4. Klicka **Validate import** för att se rad-för-rad-kontroll, och sedan **Import valid rows** för att spara allt atomärt och räkna om målstatus direkt.

---

### 4.5 Reviews & Alignment (Catchball, PDCA & Godkännanden)

#### A. Catchball & Alignment (`catchball`)
Innan ett mål blir officiellt spikat behöver chefer och avdelningar komma överens om **vad som är realistiskt med vilka resurser**. Det kallas *Catchball* ("kasta boll fram och tillbaka"):
- **Två vägar:**
  - *Top-down:* VD / QMS auditor föreslår ett mål för en avdelning.
  - *Bottom-up:* Avdelningschefen föreslår ett avdelningsmål och resurser till ledningen.
- **Stegen i en Catchball-tråd:**
  1. `Draft` → klicka **Send proposal** för att skicka till motparten (`Awaiting director` eller `Awaiting department`).
  2. Motparten vars tur det är kan **Send Counterproposal** (justera föreslaget Target/resurser + motivering), **Request Changes**, kommentera eller klicka **Agree & Align**.
  3. När båda är överens (`Aligned`) och ISO-planeringsfälten är klara klickar man **Submit for Formal Approval**.
  4. **Skydd:** Målets skarpa Target och Resurser skrivs *aldrig* över under förhandlingen – de uppdateras först i samma sekund som det formella godkännandet sker!

#### B. Formal Approvals (`approvals`)
- Visar godkännandekön för mål i din roll/ditt scope, om ISO-planen är **Ready** eller **Incomplete**, samt knappar för **Approve** / **Request changes**.
- Både **General director** och **QMS auditor** kan godkänna (QMS-godkännande skickar automatiskt en läsnotis till VD).
- Visar även **Strategy plans & version control**, **Archived approved goal snapshots** (tidigare versioner av redigerade mål) och **Audit trail**.

#### C. PDCA Reviews · Implementation Exceptions (`reviews` / `review/:id`)
Här arbetar ledningen med **avvikelser och åtgärdsbeslut (Plan–Do–Check–Act)**:
- **Exception Queue (4 snabbfilter):**
  - *Active Queue:* Alla öppna hinder och röda/riskfyllda auto-signaler sorterade efter allvar (`Critical → High → Medium`).
  - *Escalated Blockers:* Manuellt flaggade hinder (`⚑`).
  - *Red KPIs & At-Risk Signals:* Automatiskt upptäckta avvikelser (KPI `Off track`, KPI `At risk` 2+ månader i rad, eller initiativ `At risk` utan manuell blocker).
  - *Resolved History:* Lösta hinder med stängningsnotering.
- **Sluten återkoppling:**
  1. Klicka **→ Convert to PDCA Decision** på ett hinder eller en auto-signal för att lägga in det som en formell beslutspunkt i ett PDCA-möte (`In review`).
  2. När ansvarig senare klickar på beslutets status inne i PDCA-mötet och sätter det till **`Done`**, stängs den kopplade blockern **automatiskt till `Resolved`**! (Och återöppnas till `In review` om beslutet sätts tillbaka till `Open`).

---

### 4.6 ISO & Evidence (Efterlevnad, Bevis & Ledningens genomgång)

- **ISO Goal Compliance (`iso`):**
  - Visar hur många mål som har komplett ISO §6.2-planering, hur många som har planeringsluckor samt kopplade risk-/dokument-ID:n.
  - Innehåller **ISO Standards adapter** där administratören kan importera faktiska krav-ID:n (JSON) från ett externt ISO-system (t.ex. lägga till ISO 27001) utan att ändra affärslogiken.
- **Audit Evidence Pack (`evidence`):**
  - Ett komplett revisionspaket med ett klick! Filtrera på helt scope eller ett specifikt mål, och klicka **Print / Save PDF** eller **Export evidence JSON**.
  - Samlar mål, ISO-krav, §6.2-checklista, risk-/process-/dokumentlänkar, KPI-mätserier, godkännandehistorik och PDCA-beslut på ett ställe.
- **Management Review · Goal Inputs (`management`):**
  - Förbereder automatiskt underlag inför **ISO §9.3 Ledningens genomgång**: sammanfattar gröna/gula/röda mål, öppna hinder, planeringsluckor och förslag på mötesbeslut.
  - Klicka **Create PDCA review with this input** för att omvandla sammanställningen till ett skarpt granskningsmöte direkt.

---

### 4.7 Admin / Demo Settings (`settings` – endast Administratör)
- **Load Synchronized Strategy Demo:** Läser in ett komplett, sammanhängande demoscenario över koncern, Uppsala, Falkenberg och alla avdelningar.
- **Export / Import / Reset Demo:** Ladda ner hela din nuvarande databas som en `.json`-fil eller nollställ till originaldata.
- **Open Integration Blueprint (`integration`):** Teknisk utvecklarbeskrivning av hur frontend pratar med en produktionsdatabas i Django/REST.

---

## 5. Snabbguide till Symboler, Färger & Begrepp

| Symbol / Term | Betydelse i appen |
|---|---|
| `●` / `◐` / `○` | **Stark / Medel / Svag** påverkan i X-Matrisen (eller **Primary / Support** för SE-ägare och SQDC) |
| `↗` | Initiativet är kopplat till ett primärt mål, men styrkan är ännu inte poängsatt |
| `⚑` | **Escalated Blocker** – Manuellt flaggat hinder som kräver ledningsstöd |
| `⚠` / `! Off` / `! Risk` | **Auto Signal** – Automatiskt upptäckt avvikelse från Bowling Chart eller At-risk-initiativ |
| **Grön (`On track` / `Approved` / `Done`)** | På eller bättre än mål / Godkänt / Klart |
| **Gul/Amber (`At risk` / `Pending` / `In review`)** | Inom tolerans men efter plan / Väntar på åtgärd eller beslut |
| **Röd (`Off track` / `Critical` / `Changes requested`)** | Utanför tolerans / Akut hinder / Kräver omarbetning |
| **Hoshin Kanri** | Metod för att översätta långsiktig strategi till konkreta mål, projekt och mätning på alla nivåer |
| **X-Matrix** | 360°-karta som visar hur Mål, Initiativ, KPI:er och Ansvariga hänger ihop |
| **SQDC** | **S**afety, **Q**uality, **D**elivery, **C**ost – de 4 balanserade perspektiven för initiativ |
| **TOC (Theory of Constraints)** | Fokus på värdeflödets största flaskhals i stället för att göra småfix överallt |
| **Catchball** | Dialog fram och tillbaka mellan ledning och avdelning innan ett mål spikas |
| **Bowling Chart** | Månadstabell (Jan–Dec) som ställer varje månads utfall mot månadsplanen med färgstatus |
| **PDCA** | **P**lan – **D**o – **C**heck – **A**ct (ständiga förbättringar och ledningsbeslut) |
| **A3** | Strukturerad helsidesrapport (antingen **Strategy A3** för ledningen eller **Project A3** för problemlösning) |

---

## 6. Praktiska exempel: "Hur gör jag för att...?"

### Scenario 1: Jag vill skapa ett nytt avdelningsmål och få det godkänt
1. Byt roll till **Department director** (eller behåll **General director**).
2. Gå till **Strategy & Goals → Goal Cascade** och klicka **+ Create Goal**.
3. Fyll i titel, välj nivå och **Primary Parent Goal**, välj KPI, Target och bocka i ISO-krav (t.ex. `ISO 9001 · 6.2`).
4. Fyll i alla 4 obligatoriska §6.2-fälten under *Implementation planning* (*What, Resources, When, Evaluation*) och klicka **Save new draft goal**. Kontrollera att *Goal Planning Completeness* visar **Complete**.
5. Gå till **Reviews & Alignment → Catchball & Alignment**, starta en tråd på ditt nya mål (**+ New Catchball thread**) och skicka förslaget (**Send proposal**).
6. Byt till **General director** (eller **QMS auditor**), öppna tråden och klicka **Agree & Align**.
7. Klicka **Submit for Formal Approval**, gå till **Formal Approvals** och klicka **Approve**. Klart! Målet är nu `Approved` och Target är synkat till KPI:et.

### Scenario 2: Ett initiativ har kört fast på grund av saknad resurs eller budget
1. Öppna initiativet under **Initiatives & Projects** (eller via **X-Matrix**).
2. Klicka **⚑ Escalate blocker** högst upp.
3. Välj kategori (t.ex. `Resource` eller `Budget`), allvarlighet (`High` / `Critical`), beskriv problemet och vilket beslut du behöver av ledningen.
4. Gå till **Reviews & Alignment → PDCA Reviews**: hindret ligger nu överst i *Exception Queue*.
5. Klicka **→ Convert to PDCA Decision** för att lägga in det i nästa eller ett nytt PDCA-möte (`In review`).
6. När ledningen fattat beslut och åtgärden är utförd, öppna PDCA-mötet och klicka på beslutets statusbricka så den blir **Done** – blockern stängs då automatiskt som **Resolved**!

### Scenario 3: En månads KPI-siffra blir röd — vad händer?
1. Öppna **Performance → KPIs & Bowling Chart** och registrera ett utfall sämre än Target + tolerans (eller importera via **CSV Import**).
2. Omedelbart händer fyra saker i hela appen:
   - KPI:et och alla länkade mål får status **Off track**.
   - X-Matrisen tänder varningen **`! Off`** på KPI-axeln.
   - Startsidan (**Overview → Management Attention**) och **Management Review Inputs** flaggar KPI:et automatiskt.
   - **PDCA Reviews** lägger till en röd **`⚠ Auto Exception`** som ledningen kan omvandla till ett PDCA-beslut.

### Scenario 4: Vi ska ha ISO-revision nästa vecka — hur tar jag fram bevis?
1. Gå till **ISO & Evidence → ISO Goal Compliance** och kontrollera att inga mål har *Planning gaps*.
2. Gå till **ISO & Evidence → Audit Evidence Pack**.
3. Välj önskat **Scope** (eller filtrera ut ett specifikt mål) och klicka **Print / Save PDF** för en färdig revisorsrapport – eller **Export evidence JSON** för rådata med full spårbarhet.

---

## 7. Vanliga frågor (FAQ)

- **Varför står mitt projekt på 80 % klart, men det länkade målet är ändå rött (`Off track`)?**  
  För att SafeQMS medvetet skiljer på *aktivitetsleverans* (har vi gjort uppgifterna?) och *affärsresultat* (har mätetalet i Bowling Chart förbättrats?). Om uppgifterna är gjorda men KPI:et inte rör sig behöver ni ompröva motåtgärderna i Project A3 eller eskalera till PDCA Review.

- **Varför kan jag inte skicka ett avdelningsmål direkt till godkännande?**  
  Två skydd är aktiva: (1) Alla obligatoriska ISO §6.2-planeringsfält måste vara ifyllda, och (2) för alla mål under koncernnivå krävs en **Aligned** Catchball-tråd så att resurser och målvärde är förankrade innan godkännande.

- **Varför ändrades mitt godkända mål till `Draft` när jag redigerade det?**  
  För ISO-spårbarhet! När du ändrar ett redan godkänt mål skapas automatiskt en ny utkastrevision (`v2`), medan den tidigare godkända versionen arkiveras tryggt under *Formal Approvals → Archived approved goal snapshots*.

- **Sparas mina ändringar om jag laddar om sidan?**  
  Ja! I den här interaktiva prototypen sparas all data lokalt i din webbläsare (`localStorage`). Vill du börja om från början klickar du **Reset demo** eller **Load Synchronized Strategy Demo** under *Admin / Demo Settings* (eller *Sync Demo Strategy* på startsidan).
