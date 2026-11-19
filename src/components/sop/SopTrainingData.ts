import { AppRoute, SafeQmsRole } from '../../types/safeqms';

export interface SopChecklistItem {
  id: string;
  label: string;
}

export interface SopPracticalExample {
  heading: string;
  summary: string;
  rows: Array<{ label: string; value: string }>;
}

export interface SopChapter {
  id: number;
  code: string;
  levelLabel: string;
  title: string;
  shortTitle: string;
  route: AppRoute;
  routeLabel: string;
  secondaryRoute?: { route: AppRoute; label: string; requiresNonBasic?: boolean };
  requiresNonBasic?: boolean;
  requiresGoalCreate?: boolean;
  purpose: string;
  whenToDo: string;
  prerequisites: string[];
  responsibleRoles: SafeQmsRole[];
  roleSummary: string;
  navigationPath: string;
  instructions: string[];
  practicalExample: SopPracticalExample;
  keyDistinction?: {
    title: string;
    body: string;
  };
  expectedResult: string;
  nextStep: string;
  commonMistakes: string[];
  checklist: SopChecklistItem[];
  sandboxId?: 'cascade' | 'xmatrix' | 'catchball' | 'a3' | 'daily' | 'kpi-pdca';
  proposedNote?: string;
}

export interface RoleTrainingProfile {
  role: SafeQmsRole;
  tagline: string;
  visibility: string;
  recommendedChapters: number[];
  routines: string[];
  permissions: string[];
  restrictions: string[];
}

export const SOP_CHAPTERS: SopChapter[] = [
  {
    id: 1,
    code: 'Kapitel 1',
    levelLabel: 'Grund · Arbetsytan',
    title: 'Förstå arbetsytan, roller och navigering',
    shortTitle: 'Förstå arbetsytan',
    route: 'overview',
    routeLabel: 'Öppna Overview',
    secondaryRoute: { route: 'myfocus', label: 'Öppna My Focus (Obeya)' },
    purpose:
      'Ge varje ny användare full kontroll över hur SafeQMS Goal Management är uppbyggt, hur teamet samarbetar i realtid och hur man hittar rätt på några sekunder.',
    whenToDo: 'Första gången du loggar in samt när nya kollegor bjuds in till arbetsytan.',
    prerequisites: [
      'Ett Google-konto som används vid Sign in with Google.',
      'För delad arbetsyta: en Administratör har lagt till ditt Firebase UID under Administration.',
    ],
    responsibleRoles: [
      'Administratör',
      'General director',
      'Department director',
      'QMS auditor',
      'Auditor',
      'Basic user',
    ],
    roleSummary: 'Alla 6 roller (Administratör ansvarar för användarinbjudan och rolltilldelning).',
    navigationPath: 'Sidomenyn till vänster (hopfällbar) · Toppmenyn (Search... ⌘K, + New Goal, Kontomeny) · Scope & Horizon-raden.',
    instructions: [
      'Logga in med Sign in with Google. All data synkas i realtid via Firebase Firestore så hela teamet ser samma siffror.',
      'Klicka på rubrikerna i sidomenyn (Workspace, Daily Operations, Strategy Deployment, Execution & KPIs, Governance, ISO Assurance) för att fälla ut dem. Appen sparar vilka sektioner du lämnar öppna.',
      'Använd Search... ⌘K (Ctrl+K på Windows) för att direkt söka på vyer, mål-ID (t.ex. G-001), KPI-ID (K-002), initiativ eller Project A3.',
      'Kontrollera alltid Scope (Organization, Site eller Department) och Horizon (år) överst på skärmen — de filtrerar allt du ser.',
      'Öppna kontomenyn uppe till höger för att se din aktiva roll. Som Administratör öppnar du Administration för att bjuda in kollegor via Firebase UID eller växla Admin Role Preview.',
      'Använd Overview som gemensam lägesbild och My Focus (Obeya) för dina egna mål, projektuppgifter, Pulse Cards och PDCA-beslut.',
    ],
    practicalExample: {
      heading: 'Exempel: Ny avdelningschef börjar sin vecka',
      summary: 'Anna loggar in som Department director för Department: Production i Site: Uppsala.',
      rows: [
        { label: 'Scope & Horizon', value: 'Scope = Department: Production · Horizon = 2027' },
        { label: 'Snabbhopp (⌘K)', value: 'Skriver "K-002" + Enter och hamnar direkt på KPI-grafen' },
        { label: 'Personlig lista', value: 'Öppnar My Focus (Obeya) → Owner = Production Manager' },
        { label: 'Inbjudan (Admin)', value: 'Admin lägger till kollegans UID i Administration → Shared Workspace Team' },
      ],
    },
    keyDistinction: {
      title: 'Arbetsflödet är både strukturerat och iterativt',
      body: 'Hoshin Kanri följer riktningen Strategi → Kaskad → X-Matrix → Catchball → Godkännande → Genomförande → Daglig styrning → KPI → PDCA → Management Review. I praktiken pågår Daily Management, KPI-uppföljning och Project A3 parallellt varje dag/månad och matar tillbaka nya insikter till taktik och strategi.',
    },
    expectedResult:
      'Du vet vilken roll du har, hur du styr Scope/Horizon, hur du hoppar snabbt med ⌘K och var du hittar både Overview, My Focus och SOP & User Guide.',
    nextStep: 'Gå vidare till Kapitel 2 för att se hur ledningen sätter organisationens övergripande strategi.',
    commonMistakes: [
      'Att tro att mål försvunnit när Scope i själva verket står filtrerat på en annan avdelning.',
      'Att glömma skicka sitt Firebase UID till Administratören (då hamnar man i en egen, separat arbetsyta).',
      'Att lämna Admin Role Preview påslaget som en annan roll och undra varför redigeringsknappar saknas.',
    ],
    checklist: [
      { id: 'c1-1', label: 'Öppnat minst en sektion i sidomenyn och testat snabbsökningen (Ctrl+K / ⌘K)' },
      { id: 'c1-2', label: 'Kontrollerat aktiv roll samt Scope- och Horizon-väljaren' },
      { id: 'c1-3', label: 'Besökt Overview och My Focus (Obeya)' },
    ],
  },
  {
    id: 2,
    code: 'Kapitel 2',
    levelLabel: 'Nivå 1 · Strategisk styrning',
    title: 'Definiera organisationens strategi (Organization Pillars)',
    shortTitle: 'Organisationsstrategi',
    route: 'pillars',
    routeLabel: 'Öppna Strategic Pillars',
    secondaryRoute: { route: 'newgoal', label: 'Skapa nytt mål (New Goal)' },
    requiresGoalCreate: true,
    purpose:
      'Skapa en gemensam långsiktig riktning (3–5 år) så att alla anläggningar, avdelningar och förbättringsprojekt drar åt samma håll istället för att suboptimera.',
    whenToDo: 'Årligen i strategicykeln samt vid större strategiska kursändringar efter Management Review.',
    prerequisites: [
      'Övergripande affärsplan, nulägesanalys (baslinje) och relevanta ISO-krav (9001, 14001, 45001).',
      'Behörighet som General director, QMS auditor eller Administratör.',
    ],
    responsibleRoles: ['General director', 'QMS auditor', 'Administratör'],
    roleSummary: 'Ledning (General director), QMS auditor eller Administratör skapar pelare på Organization-nivå.',
    navigationPath: 'Strategy Deployment → Strategic Pillars → knappen + New Breakthrough Pillar (eller + New Goal uppe till höger).',
    instructions: [
      'Öppna Strategic Pillars under Strategy Deployment och granska befintliga 3–5-åriga genombrottsmål.',
      'Klicka på New Breakthrough Pillar (eller + New Goal) och välj Organizational Level = Organization (Primary Parent Goal blir automatiskt Root).',
      'Fyll i en tydlig Goal Title, Accountable Owner och Horizon / Year (t.ex. 2027–2029).',
      'Koppla en mätbar Linked KPI samt ange Baseline (utgångsläge), Target (långsiktig ambition) och Unit.',
      'Beskriv strategisk inriktning under ISO Clause 6.2 Planning (Description / Intent, What will be done, Resources Required, Target Completion Date, How results will be evaluated).',
      'Kryssa i tillämpliga ISO-krav under Linked ISO Standard Clauses och spara målet som Draft.',
    ],
    practicalExample: {
      heading: 'Exempel: Strategiskt genombrottsmål för Operational Excellence',
      summary: 'Ledningen etablerar en flerårig pelare på Organization-nivå som grund för produktion och underhåll.',
      rows: [
        { label: 'Strategiskt mål', value: 'Operational Excellence — världsklass utrustningseffektivitet' },
        { label: 'Level & Parent', value: 'Organization · Root (Multi-Year Strategic Pillar)' },
        { label: 'Baslinje → Målbild', value: 'Höja OEE från 55 % (Baseline) till 75 % (Target) över 3 år' },
        { label: 'Ägare & ISO-koppling', value: 'Executive Management · ISO 9001 §6.2 & §10.3' },
      ],
    },
    keyDistinction: {
      title: 'Skillnaden mellan Strategiskt mål, Årsmål, Initiativ och KPI',
      body: 'Strategiskt mål (Organization) = vart vi ska på 3–5 år (OEE 75 %). Årsmål (Site/Department) = delmål i år (OEE 68 % under 2027). Initiativ = förbättringsprogrammet vi driver (SMED-program). KPI = mätetalet som visar verkligt utfall månad för månad (OEE %).',
    },
    expectedResult:
      'Ett nytt Organization-mål visas under Strategic Pillars, syns i Goal Cascade och utgör rötterna längst ner i Hoshin X-Matrix.',
    nextStep: 'Gå vidare till Kapitel 3 för att kaskadera (bryta ner) pelaren till Site- och Department-mål.',
    commonMistakes: [
      'Att blanda ihop strategiskt mål med en enskild aktivitet (t.ex. skriva "Köp ny maskin" istället för mätbart resultat).',
      'Att lämna Baseline, Target eller ISO 6.2-fälten tomma — då markeras målet som Incomplete.',
      'Att glömma att Organization-målet inte styr det dagliga arbetet förrän det brutits ner till Site och Department.',
    ],
    checklist: [
      { id: 'c2-1', label: 'Förstått skillnaden mellan Strategiskt mål, Årsmål, Initiativ och KPI' },
      { id: 'c2-2', label: 'Granskat befintliga Organization-pelare i Strategic Pillars' },
      { id: 'c2-3', label: 'Sett hur Baseline, Target, Horizon och ISO-krav fylls i på ett mål' },
    ],
  },
  {
    id: 3,
    code: 'Kapitel 3',
    levelLabel: 'Nivå 1 · Strategisk styrning',
    title: 'Kaskadera mål (Organization → Site → Department)',
    shortTitle: 'Kaskadera mål',
    route: 'cascade',
    routeLabel: 'Öppna Goal Cascade',
    secondaryRoute: { route: 'newgoal', label: 'Skapa kaskaderat mål' },
    purpose:
      'Översätta koncernens långsiktiga ambition till konkreta, påverkbara årsmål på fabriksnivå (Site) och avdelningsnivå (Department) med full spårbarhet.',
    whenToDo: 'Direkt efter att övergripande Organization-pelare lagts fast inför kommande planeringsår.',
    prerequisites: [
      'Minst ett Organization-mål måste finnas för att kunna skapa ett Site-mål.',
      'Minst ett Site-mål måste finnas för att kunna skapa ett Department-mål.',
    ],
    responsibleRoles: ['General director', 'Department director', 'QMS auditor', 'Administratör'],
    roleSummary: 'Ledning/Admin skapar Site-mål; Department director skapar och förvaltar mål i sin tilldelade avdelning (Department: Production).',
    navigationPath: 'Strategy Deployment → Goal Cascade → växla mellan Tree och Table → + New Goal eller klicka Inspect / Edit.',
    instructions: [
      'Öppna Goal Cascade och växla till Tree för att se den kompletta tre-nivåstrukturen: Organization → Site → Department.',
      'Klicka på + New Goal och välj Organizational Level (t.ex. Site: Uppsala eller Department: Production).',
      'Välj rätt Primary Parent Goal i rullistan. Systemet filtrerar automatiskt fram tillåtna föräldrar (Site kan bara peka på Organization; Department kan bara peka på Site).',
      'Sätt ett tydligt årsmål (Target) och ägare som faktiskt har rådighet över processen.',
      'Fyll i samtliga obligatoriska ISO 6.2-fält tills ISO Readiness Checklist till höger visar Ready.',
      'Spara målet. Det kopplas nu automatiskt in i trädstrukturen och i den sydvästra (SW) sektorn i X-Matrix.',
    ],
    practicalExample: {
      heading: 'Exempel: Tre-nivåkaskad för OEE 75 %',
      summary: 'Samma övergripande mål bryts ner så att varje nivå äger sin del av förlusterna.',
      rows: [
        { label: 'Organization (3–5 år)', value: 'Höja OEE från 55 % till 75 %' },
        { label: 'Site: Uppsala (2027)', value: 'Nå OEE 68 % under 2027 (Parent = Organization OEE)' },
        { label: 'Department: Production', value: 'Minska omställningsförluster med 30 % (Parent = Site OEE 68 %)' },
        { label: 'Department: Maintenance', value: 'Minska oplanerade stopp med 20 % (Parent = Site OEE 68 %)' },
      ],
    },
    keyDistinction: {
      title: 'Hierarki (Goal Cascade) ≠ Påverkansstyrka (X-Matrix)',
      body: 'Primary Parent Goal i Goal Cascade styr den formella ägarskaps- och rapporteringskedjan (ett mål har exakt en primär förälder). X-Matrix visar däremot hur starkt olika mål, initiativ och KPI:er påverkar varandra på tvärsen (● Strong, ◐ Medium, ○ Weak).',
    },
    expectedResult:
      'Målet visas indraget under sin primära förälder i Goal Cascade med full spårbarhet från avdelning ända upp till koncernpelare.',
    nextStep: 'Gå vidare till Kapitel 4 för att kontrollera och redigera kopplingarna i Hoshin X-Matrix.',
    commonMistakes: [
      'Att försöka koppla ett Department-mål direkt till ett Organization-mål utan mellanliggande Site-mål (blockeras av hierarkivalideringen).',
      'Att glömma fylla i Primary Parent Goal innan man sparar ett Site- eller Department-mål.',
      'Att blanda ihop föräldrakopplingen i Goal Cascade med styrkesymbolerna i X-Matrix.',
    ],
    checklist: [
      { id: 'c3-1', label: 'Granskat 3-nivåträdet (Organization → Site → Department) i Goal Cascade' },
      { id: 'c3-2', label: 'Förstått hur Primary Parent Goal säkerställer spårbarhet' },
      { id: 'c3-3', label: 'Testat Kaskad-övningen i den säkra sandboxen nedan' },
    ],
    sandboxId: 'cascade',
  },
  {
    id: 4,
    code: 'Kapitel 4',
    levelLabel: 'Nivå 1 · Strategisk styrning',
    title: 'Bygg och verifiera strategin i X-Matrix & Strategy A3',
    shortTitle: 'Hoshin X-Matrix',
    route: 'matrix',
    routeLabel: 'Öppna X-Matrix',
    secondaryRoute: { route: 'a3', label: 'Öppna Strategy A3' },
    purpose:
      'Verifiera på en enda skärm att hela strategin hänger ihop 360° — att varje mål har tillräckliga initiativ, varje initiativ mäts med rätt KPI och varje KPI har en utpekad ansvarig ägare.',
    whenToDo: 'Under strategisk planering, inför Catchball-förhandling och vid kvartalsvis/årlig översyn.',
    prerequisites: [
      'Strategiska pelare (Organization), årsmål (Site/Department), initiativ och KPI:er finns i arbetsytan.',
    ],
    responsibleRoles: ['General director', 'Department director', 'QMS auditor', 'Administratör'],
    roleSummary: 'Ledning, QMS auditor och Administratör redigerar hela matrisen; Department director redigerar kopplingar inom sin avdelning; Auditor/Basic user läser.',
    navigationPath: 'Strategy Deployment → X-Matrix (samt Strategy Deployment → Strategy A3 för utskriftsvänlig sammanfattning).',
    instructions: [
      'Läs de fyra huvudaxlarna runt mittkompassen: Botten = Multi-Year Breakthrough Pillars (Organization), Vänster = Annual Goals (Site/Department), Toppen = Initiatives (How), Höger = KPIs (Metrics) samt sydöstra vingen = Cross-Functional Owners.',
      'Klicka på valfritt mål, initiativ, KPI eller ägare på axlarna. Alla relaterade kopplingar lyses upp medan övriga tonas ner så du direkt ser eventuella glapp.',
      'Klicka på en ruta i rutnätet (NW = Årsmål × Initiativ, NE = Initiativ × KPI, SE = KPI × Ägare). Inspektörspanelen öppnas under matrisen.',
      'Välj påverkansstyrka direkt med ett klick: ● Strong (2), ◐ Medium (1), ○ Weak (0.5) eller – None (0) och lägg till en kort motivering vid behov.',
      'Använd kryssrutan Strong / Primary Only eller Relationship Tables för djupgranskning. Öppna sedan Strategy A3 som presenterar samma verkliga data på ett utskrivbart A3-blad (inga dubblerade register).',
    ],
    practicalExample: {
      heading: 'Exempel: Verifiera OEE-kedjan i X-Matrix',
      summary: 'En chef klickar på Production-målet för omställningsförluster och kontrollerar hela kedjan.',
      rows: [
        { label: 'SW (Hierarki)', value: '● (blå) kopplar Department-målet till Site OEE och Organization OEE' },
        { label: 'NW (Mål × Initiativ)', value: '● Strong mellan "Minska omställning 30 %" och "SMED-program"' },
        { label: 'NE (Initiativ × KPI)', value: '● Strong mellan "SMED-program" och KPI "OEE / Omställningstid"' },
        { label: 'SE (KPI × Ägare)', value: '● Primary Owner = Production Manager · ◐ Support = Maintenance Manager' },
      ],
    },
    keyDistinction: {
      title: 'En enda sanningskälla (X-Matrix ↔ Strategy A3)',
      body: 'X-Matrix och Strategy A3 läser exakt samma mål, initiativ, KPI:er och kopplingar. Du ska aldrig skapa dubbla mål för att visa dem i A3 — ändringar i X-Matrix slår igenom direkt.',
    },
    expectedResult:
      'Inga "föräldralösa" mål utan initiativ och inga initiativ utan mätbar KPI-koppling eller ägare.',
    nextStep: 'Gå vidare till Kapitel 5 för att förhandla målnivå och resurser i Catchball och få formellt godkännande.',
    commonMistakes: [
      'Att sätta ● Strong på allt i matrisen — då förlorar man prioriteringen och ser inte vad som verkligen driver effekten.',
      'Att glömma granska sydöstra (SE) ägarvingen så att ett KPI saknar tydlig primärägare.',
      'Att tro att SW-kvadranten (hierarki) redigeras i matrisen — den styrs av Primary Parent Goal inne på målet.',
    ],
    checklist: [
      { id: 'c4-1', label: 'Klickat på ett mål i X-Matrix för att korsmarkera kopplade initiativ och KPI:er' },
      { id: 'c4-2', label: 'Förstått symbolerna ● Strong, ◐ Medium, ○ Weak och – Ingen koppling' },
      { id: 'c4-3', label: 'Testat interaktiva X-Matrix-övningen i sandboxen och öppnat Strategy A3' },
    ],
    sandboxId: 'xmatrix',
  },
  {
    id: 5,
    code: 'Kapitel 5',
    levelLabel: 'Nivå 1 · Strategisk styrning',
    title: 'Catchball-förhandling & Formellt godkännande',
    shortTitle: 'Catchball & Approval',
    route: 'catchball',
    routeLabel: 'Öppna Catchball Alignment',
    secondaryRoute: { route: 'approvals', label: 'Öppna Formal Approvals', requiresNonBasic: true },
    requiresNonBasic: true,
    purpose:
      'Skapa delaktighet och realism genom en strukturerad tvåvägsdialog (Catchball) innan ledningen formellt godkänner och låser revisionen för hela organisationen.',
    whenToDo: 'Efter att målförslag och X-Matrix tagits fram, innan målet släpps ut som styrande för teamen.',
    prerequisites: [
      'Målet är sparat som Draft med ifyllda ISO 6.2-fält (ISO Ready).',
      'Deltagare har roll som General director, QMS auditor eller Department director.',
    ],
    responsibleRoles: ['General director', 'Department director', 'QMS auditor'],
    roleSummary: 'Ledning och Department director förhandlar i Catchball; ENDAST General director eller QMS auditor kan formellt godkänna (Approve). Basic user har ej åtkomst.',
    navigationPath: 'Governance → Catchball Alignment (förhandling) → Governance → Formal Approvals (beslut).',
    instructions: [
      'Ledningen (eller avdelningschefen) skapar en tråd via New Catchball Thread och anger förslag på Target, resurser, datum och motivering.',
      'Skicka förslaget (Send Proposal). Tråden växlar turordning (Awaiting department / Awaiting director) så det alltid framgår vems boll det är.',
      'Avdelningschefen granskar genomförbarheten och svarar antingen med Counter-proposal (justerat mål/resursbehov) eller klickar Align när båda parter är överens.',
      'När tråden är Aligned klickar behörig roll på Submit for Approval (eller direkt på målet). Då skapas ett ärende i Formal Approvals och målet får status Pending.',
      'General director eller QMS auditor öppnar Formal Approvals och klickar Approve (eller Changes requested om ändringar krävs).',
      'Den godkända revisionen (t.ex. v1) blir styrande och nu synlig för Basic user. Behöver målet ändras senare arkiveras v1 automatiskt, revisionen räknas upp (v2) och status återgår till Draft.',
    ],
    practicalExample: {
      heading: 'Exempel: Catchball om omställningsförluster',
      summary: 'Ledning föreslår 35 % minskning; produktionschef räknar på skiftkapacitet och förhandlar fram 30 % med SMED-resurser.',
      rows: [
        { label: '1. Förslag (Ledning)', value: 'Target: -35 % omställningstid · Resurs: Befintlig bemanning' },
        { label: '2. Motförslag (Avd.chef)', value: 'Target: -30 % omställningstid · Resurs: 2 dagars SMED-workshop + underhållstekniker' },
        { label: '3. Aligned', value: 'Båda överens — men status är fortfarande INTE godkänd!' },
        { label: '4. Formal Approval', value: 'General director klickar Approve → Målet blir Approved (v1) och synligt för Basic user' },
      ],
    },
    keyDistinction: {
      title: 'Aligned betyder INTE Approved — och ändringar låser upp ny revision',
      body: 'Statusen Aligned i Catchball innebär endast att parterna enats om förslaget. Målet blir inte styrande förrän Submit for Approval följs av ett formellt Approve från General director eller QMS auditor. Om ett Approved mål senare redigeras skapas automatiskt Draft v2 medan v1 arkiveras för ISO-spårbarhet.',
    },
    expectedResult:
      'Målet har status Approved, godkännare och datum är loggade i revisionshistoriken och målet visas nu även för Basic user.',
    nextStep: 'Gå vidare till Kapitel 6 för att omvandla godkända mål till Initiativ, Project A3 och Project Tasks.',
    commonMistakes: [
      'Att stanna vid status Aligned i Catchball och tro att målet är godkänt.',
      'Att undra varför Basic user inte ser ett nytt mål (beror på att det fortfarande ligger som Draft eller Pending).',
      'Att redigera ett redan Approved mål för en stavningsändring utan att sedan skicka in v2 för nytt godkännande.',
    ],
    checklist: [
      { id: 'c5-1', label: 'Förstått skillnaden mellan Aligned i Catchball och formellt Approved' },
      { id: 'c5-2', label: 'Vet vilka roller som får delta respektive formellt godkänna (General director / QMS auditor)' },
      { id: 'c5-3', label: 'Testat Catchball- och revisionslås-simulatorn (v1 → v2) i sandboxen' },
    ],
    sandboxId: 'catchball',
  },
  {
    id: 6,
    code: 'Kapitel 6',
    levelLabel: 'Nivå 2 · Taktiskt genomförande',
    title: 'Initiativ, SQDC, Project A3, 5-Why & Tasks',
    shortTitle: 'Initiativ & Project A3',
    route: 'projects',
    routeLabel: 'Öppna Initiatives & A3',
    purpose:
      'Omvandla godkända mål till prioriterade förbättringsprogram (Initiatives), strukturerad problemlösning (Project A3 & 5-Why) och spårbara uppgifter (Project Tasks).',
    whenToDo: 'Så snart ett mål är godkänt eller när ett återkommande problem eskaleras till strukturerat förbättringsprojekt.',
    prerequisites: [
      'Ett mål i Goal Cascade som initiativet ska stödja.',
      'Behörighet som Administratör, General director, QMS auditor eller Department director (för egen avdelning).',
    ],
    responsibleRoles: ['Department director', 'General director', 'QMS auditor', 'Administratör', 'Basic user'],
    roleSummary: 'Chefer/QMS/Admin skapar och leder Initiatives och Project A3; Basic user (Team Leader) uppdaterar egna Project Tasks.',
    navigationPath: 'Execution & KPIs → Initiatives & A3 → klicka + New Initiative eller öppna ett Project A3 i nedre tabellen.',
    instructions: [
      'Skapa ett Initiative kopplat till rätt mål. Viktning sker mot SQDC (Safety, Quality, Delivery, Cost med 0/1/2 upp till 8 poäng) och flagga TOC Bottleneck om initiativet angriper systemets huvudflaskhals.',
      'Öppna kopplat Project A3 & 5-Why och välj rätt dokumentationsdjup under Escalation Tier: Direct Fix (enkla fel), 5-Why (grundorsaksanalys) eller Full A3 (komplexa projekt).',
      'Dokumentera hela A3-flödet: Background & Problem Statement → Current Condition → Target Condition → Interactive 5-Why (upp till 5 nivåer + Copy Last Why to Summary) → Countermeasures → Learning & Standardization.',
      'Bryt ner motåtgärderna i Project Tasks med tydlig Owner och Due Date.',
      'Klicka på en task för att stega status Open → In progress → Done. Systemet räknar automatiskt upp Project A3 progress (%) och förälder-initiativets Execution %.',
      'Verifiera alltid effekten i kopplat KPI — stäng inte problembilden bara för att projektet nått 100 %.',
    ],
    practicalExample: {
      heading: 'Exempel: SMED-program på Linje 3',
      summary: 'Avdelningsmålet omsätts i ett konkret SMED-initiativ och ett Project A3.',
      rows: [
        { label: 'Mål', value: 'Minska omställningsförluster med 30 % (Department: Production)' },
        { label: 'Initiative', value: 'SMED Programme · SQDC: S1 Q1 D2 C2 (Score 6/8) · TOC Bottleneck = Ja' },
        { label: 'Project A3', value: 'Line 3 Changeover Reduction (Escalation Tier: Full A3)' },
        { label: '5-Why → Motåtgärd', value: 'Saknad extern förberedelse → Shadow-boards, snabbkopplingar & standardiserad checklista' },
      ],
    },
    keyDistinction: {
      title: 'Project Execution % ≠ Uppnått KPI-mål!',
      body: 'En projekttabell på 100 % Done betyder ENDAST att de planerade aktiviteterna är utförda — det är aldrig bevis på att det strategiska KPI-målet har uppnåtts. Effekten måste alltid bekräftas av verkliga KPI-utfall i Bowling Chart.',
    },
    expectedResult:
      'Spårbar kedja från Mål → Initiative (SQDC/TOC) → Project A3 + 5-Why → Project Tasks, med utskrivbart A3-blad.',
    nextStep: 'Gå vidare till Kapitel 7 för att se hur det dagliga arbetet på golvet driver uppgifterna och fångar avvikelser.',
    commonMistakes: [
      'Att redovisa 100 % projektprogress som om målet vore uppnått trots att OEE fortfarande ligger rött.',
      'Att skriva lösningar istället för grundorsaker i 5-Why (stanna inte vid "mänskligt fel").',
      'Att glömma ange ägare och förfallodatum på Project Tasks.',
    ],
    checklist: [
      { id: 'c6-1', label: 'Förstått SQDC-poäng (0/1/2) och flaggan TOC Bottleneck' },
      { id: 'c6-2', label: 'Öppnat ett Project A3 och sett Escalation Tier (Direct Fix / 5-Why / Full A3)' },
      { id: 'c6-3', label: 'Testat sandbox-övningen som skiljer Project % från KPI-utfall' },
    ],
    sandboxId: 'a3',
    proposedNote:
      'Observera: Befintliga Project A3-blad öppnas och redigeras under Initiatives & A3. En separat 1-klicksknapp för att skapa ett helt nytt Project A3 direkt från ett Tier 1 Pulse Card är markerad som ett föreslaget framtida tillägg.',
  },
  {
    id: 7,
    code: 'Kapitel 7',
    levelLabel: 'Nivå 3 · Daglig styrning',
    title: 'Daglig styrning (Daily Board Tier 1–3) & My Focus',
    shortTitle: 'Daily Board & My Focus',
    route: 'daily',
    routeLabel: 'Öppna Daily Board',
    secondaryRoute: { route: 'myfocus', label: 'Öppna My Focus (Obeya)' },
    purpose:
      'Skapa en daglig rytm som kopplar produktionens pulsmöten direkt till de strategiska målen — så problem fångas tidigt, ägs tydligt och eskaleras i tid.',
    whenToDo: 'Dagligen vid morgonmöten (Tier 1 kl. 07:30, Tier 2 kl. 08:15, Tier 3 vid behov/vecka).',
    prerequisites: [
      'Godkända mål och aktiva KPI:er i aktuellt Scope.',
      'Användaren har valt rätt Scope (t.ex. Department: Production eller Site: Uppsala).',
    ],
    responsibleRoles: ['Basic user', 'Department director', 'General director', 'QMS auditor', 'Administratör'],
    roleSummary: 'Basic user (Team Leader) driver Tier 1 & My Focus; Department director leder Tier 2; General director hanterar Tier 3-eskaleringar.',
    navigationPath: 'Daily Operations → Daily Board (växla Tier 1 · Team Pulse / Tier 2 · Site Scorecard / Tier 3 · Obeya) samt Daily Operations → My Focus (Obeya).',
    instructions: [
      'Starta morgonmötet i Tier 1 · Team Pulse. Klicka på dagens datum i Safety & Quality Cross för att logga status (Grön = OK, Gul = Tillbud/Avvikelse, Röd = Incident/Stopp).',
      'Granska Live KPI-korten bredvid Safety Cross för att se vilka nyckeltal som behöver fokus idag.',
      'Lägg in nya avvikelser eller motåtgärder som Kanban Pulse Cards och välj rutt: Direct fix (löses direkt i teamet), A3 (kräver djupare analys) eller Escalate (behöver stöd uppåt).',
      'Dra Kanban-kort mellan kolumner (Team action / Escalated / Done), skriv kommentarer eller delegera till rätt team.',
      'I Tier 2 · Site Scorecard ser fabrikschefen alla avdelningars läge sida vid sida och koordinerar stöd (t.ex. underhåll).',
      'I Tier 3 · Obeya hanterar ledningen eskalerade blockerare, fattar resursbeslut och omvandlar olösta problem till formella PDCA-beslut.',
      'Varje medarbetare öppnar My Focus (Obeya) och väljer sin ägarroll i filtret för att checka av egna uppgifter.',
    ],
    practicalExample: {
      heading: 'Exempel: Upprepade oplanerade stopp på produktionslinje',
      summary: 'Ett konkret driftproblem eskaleras smidigt genom Tier 1 → Tier 2 → Tier 3.',
      rows: [
        { label: 'Tier 1 (Team Pulse)', value: 'Team Leader markerar gul/röd ruta i Safety Cross och skapar Pulse Card "Linje 3 givarstopp 3×/skift" med rutt Escalate' },
        { label: 'Tier 2 (Site Scorecard)', value: 'Avdelningschef ser eskaleringen och samordnar temporärt stöd med Underhåll' },
        { label: 'Tier 3 (Obeya)', value: 'Om stoppen återkommer beslutar ledning om reservdelsbudget och skapar formellt PDCA-beslut / kopplar till förbättringsinitiativ' },
        { label: 'My Focus (Obeya)', value: 'Team Leader checkar av sina delegerade tasks under Owner = Team Leader' },
      ],
    },
    keyDistinction: {
      title: 'Vad appen stöder idag (utan påhittade externa kopplingar)',
      body: 'Daily Board synkar i realtid mellan Safety Cross, Kanban Pulse Cards, eskaleringar till PDCA-kön och Project Tasks inom SafeQMS. Maskinsensorer/ERP-automatik kopplas inte direkt hit utan utfall matas in manuellt eller via CSV KPI Import.',
    },
    expectedResult:
      'Varje dag har loggad Safety Cross-status, tydlig ägare på varje avvikelsekort och snabb eskalering för hinder som teamet inte kan lösa självt.',
    nextStep: 'Gå vidare till Kapitel 8 för att följa upp de faktiska månadsutfallen i KPIs & Bowling Chart.',
    commonMistakes: [
      'Att låta Pulse Cards ligga kvar i veckor utan ägare, kommentar eller eskalering.',
      'Att som Basic user försöka bocka av en task vars Owner inte står som Team Leader (låst av rollreglerna).',
      'Att arbeta i Tier 1 utan att titta på Tier 2/3 när samma fel upprepas flera dagar i rad.',
    ],
    checklist: [
      { id: 'c7-1', label: 'Förstått ansvarsfördelningen mellan Tier 1, Tier 2 och Tier 3' },
      { id: 'c7-2', label: 'Testat eskaleringsexemplet (Linje 3 stopp) i sandboxen' },
      { id: 'c7-3', label: 'Öppnat My Focus (Obeya) och kontrollerat Owner-filtret' },
    ],
    sandboxId: 'daily',
  },
  {
    id: 8,
    code: 'Kapitel 8',
    levelLabel: 'Nivå 4 · Prestanda & förbättring',
    title: 'KPI-uppföljning, Bowling Chart & CSV-import',
    shortTitle: 'KPI & Bowling Chart',
    route: 'kpis',
    routeLabel: 'Öppna KPIs & Bowling Chart',
    secondaryRoute: { route: 'import', label: 'Öppna CSV KPI Import' },
    purpose:
      'Mäta verklig prestation månad för månad mot mål och tolerans, så att avvikelser upptäcks objektivt och triggar rätt förbättringsåtgärd.',
    whenToDo: 'Månatligen (eller direkt efter bokslut/produktionsrapport) samt vid import av serier via CSV.',
    prerequisites: [
      'Verkliga mätdata från verksamheten (aldrig uppskattade eller påhittade siffror).',
      'Behörighet att registrera KPI (Admin, General director, QMS auditor eller Department director för egna KPI:er).',
    ],
    responsibleRoles: ['Department director', 'General director', 'QMS auditor', 'Administratör'],
    roleSummary: 'Ansvariga chefer/QMS/Admin registrerar faktiska utfall; Auditor och Basic user följer utvecklingen i läsläge.',
    navigationPath: 'Execution & KPIs → KPIs & Bowling Chart (samt Execution & KPIs → CSV KPI Import för bulkuppladdning).',
    instructions: [
      'Öppna KPIs & Bowling Chart och välj nyckeltal i rullistan överst (filtreras efter ditt Scope).',
      'Granska de fyra nyckelkorten: Latest Actual, Month Target (inklusive Direction: higher/lower/range och Tolerance ±), Variance / Gap (samt Adverse streak) och Data Provenance.',
      'Klicka direkt på valfri månadscell (Jan–Dec) i Bowling Chart-tabellen för att registrera eller uppdatera både Actual och Target, eller använd knappen Record Next Month.',
      'För flera månader/KPI:er samtidigt: öppna CSV KPI Import och ladda upp en CSV med kolumnerna kpi_id, month (t.ex. Jan eller 2027-01), actual (och valfritt target).',
      'Läs av färg och statustext utifrån appens exakta beräkningsregel: gap >= 0 ger On track, gap >= -tolerance ger At risk, under -tolerance ger Off track, och saknade värden ger Not measured.',
      'Notera att länkade måls prestandastatus uppdateras automatiskt — och Off track (eller ≥2 på varandra följande månader med negativt gap) skapar en automatisk signal i PDCA-kön.',
    ],
    practicalExample: {
      heading: 'Exempel: OEE (%) i Bowling Chart (Higher-is-better, Tolerans ±2)',
      summary: 'Verkliga månadsutfall jämförs mot stegrande målkurva under Q1.',
      rows: [
        { label: 'Januari', value: 'Target: 56 % · Actual: 55 % → Gap -1,0 % (inom tolerans ±2) → At risk' },
        { label: 'Februari', value: 'Target: 58 % · Actual: 58 % → Gap 0,0 % → On track' },
        { label: 'Mars', value: 'Target: 60 % · Actual: 57 % → Gap -3,0 % (utanför tolerans ±2) → Off track → triggar KPI-signal!' },
        { label: 'Riktning (Direction)', value: 'higher = högre är bättre (OEE %) · lower = lägre är bättre (olyckor, reklamationer)' },
      ],
    },
    keyDistinction: {
      title: 'Exakta beräkningsregler i SafeQMS (ingen gissning)',
      body: 'För "higher" är gap = actual - target. För "lower" är gap = target - actual. För "range" är gap = -|actual - target|. Status: gap >= 0 → On track · gap >= -tolerance → At risk · gap < -tolerance → Off track · saknat värde → Not measured. Mata aldrig in påhittade mätvärden.',
    },
    expectedResult:
      'Linjediagram, Bowling Chart och kopplade mål uppdateras omedelbart och eventuella röda utfall skickar automatisk varning till PDCA Reviews.',
    nextStep: 'Gå vidare till Kapitel 9 för att hantera röda KPI-utfall och avvikelser i en formell PDCA Review.',
    commonMistakes: [
      'Att förväxla "higher-is-better" med "lower-is-better" (t.ex. reklamationer där ett lägre utfall är grönt).',
      'Att fylla i gissade tal i förväg istället för att lämna framtida månader tomma (Not measured).',
      'Att missa att CSV-filen kräver exakt KPI-ID (t.ex. K-001) som finns i arbetsytan.',
    ],
    checklist: [
      { id: 'c8-1', label: 'Förstått skillnaden mellan On track, At risk, Off track och Not measured' },
      { id: 'c8-2', label: 'Provat OEE-exemplet (Jan 56/55, Feb 58/58, Mar 60/57) i Bowling Chart-sandboxen' },
      { id: 'c8-3', label: 'Sett hur både manuell cellklickning och CSV KPI Import fungerar' },
    ],
    sandboxId: 'kpi-pdca',
    proposedNote:
      'Observera: Befintliga KPI-definitioner redigeras via månadsceller och CSV-import. Ett separat formulär för att skapa helt nya KPI-definitioner (inkl. valbar mätfrekvens bortom månadsvis) direkt i UI:t är noterat som föreslaget framtida tillägg.',
  },
  {
    id: 9,
    code: 'Kapitel 9',
    levelLabel: 'Nivå 4 · Prestanda & förbättring',
    title: 'PDCA Reviews & korrigerande åtgärder',
    shortTitle: 'PDCA Reviews',
    route: 'reviews',
    routeLabel: 'Öppna PDCA Reviews',
    purpose:
      'Säkerställa att röda KPI-utfall och eskalerade problem leder till strukturerad analys, beslutade motåtgärder, tydligt ägarskap och återkoppling tillbaka till taktik och strategi.',
    whenToDo: 'Månatligen efter KPI-stängning samt extra vid kritiska avvikelser eller återkommande At risk-månader.',
    prerequisites: [
      'Uppdaterade KPI-utfall i Bowling Chart och/eller eskalerade blockerare från Daily Board eller Initiatives.',
    ],
    responsibleRoles: ['General director', 'Department director', 'QMS auditor', 'Administratör'],
    roleSummary: 'Chefer, QMS auditor och Admin skapar PDCA Reviews och driver beslut; Auditor granskar i läsläge; Basic user ser relevanta beslut.',
    navigationPath: 'Governance → PDCA Reviews → granska Exception Queue → klicka + New PDCA Review eller omvandla en blockerare direkt till ett PDCA-beslut.',
    instructions: [
      'Öppna PDCA Reviews och gå igenom Exception Queue överst. Filtrera på Active, Manual Blockers och KPI/Init Signals.',
      'Skilj tydligt på automatiska KPI-varningar (AUTO-KPI / AUTO-INIT) och ett formellt öppnat PDCA Review-protokoll.',
      'Klicka + New PDCA Review (PLAN/CHECK) för att öppna månadens genomgångsmöte, dokumentera observationer och grundorsak i mötesanteckningarna.',
      'Konvertera prioriterade signaler/blockerare till formella PDCA Decisions (DO) med konkret åtgärdstext, ansvarig Owner och tydligt Due Date.',
      'Följ upp öppna beslut vid nästa genomgång, markera slutförda åtgärder som Done och verifiera i Bowling Chart att KPI-trenden vänder uppåt (CHECK).',
      'Standardisera fungerande lösningar i A3 / rutiner eller revidera planer/resurser om effekten uteblir (ACT) — det sluter återkopplingsloopen tillbaka till Nivå 1 och 2.',
    ],
    practicalExample: {
      heading: 'Exempel: PDCA-cykeln när OEE faller i mars (57 % mot mål 60 %)',
      summary: 'En automatisk röd KPI-signal omvandlas till ett formellt PDCA-beslut med tydlig uppföljning.',
      rows: [
        { label: 'PLAN', value: 'Mål OEE 60 % i mars med planerad omställningstid < 25 min' },
        { label: 'DO', value: 'SMED-utbildning genomförd, men verktygsvagnar saknades på nattskiftet' },
        { label: 'CHECK', value: 'Mars utfall 57 % (gap -3 %) → automatisk KPI-varning i Exception Queue' },
        { label: 'ACT', value: 'Formell PDCA Review öppnas → Beslut: "Standardisera nattskiftskit före 15 april" (Owner: Production Manager) → Effekt verifieras i april/maj KPI' },
      ],
    },
    keyDistinction: {
      title: 'KPI-varning ≠ Formellt öppnad PDCA Review',
      body: 'En automatisk KPI-signal i Exception Queue är endast en tidig varning (triggad av Off track eller ≥2 månader med At risk). Först när en chef skapar ett PDCA Review-protokoll och registrerar ett spårbart PDCA Decision med ägare och datum är den formella korrigerande styrningen igång.',
    },
    expectedResult:
      'Varje avvikelse i Exception Queue har antingen lösts, knutits till ett spårbart PDCA-beslut eller eskalerats till Management Review.',
    nextStep: 'Gå vidare till Kapitel 10 för ledningens genomgång (ISO 9.3) och revisionsklart ISO-bevispaket.',
    commonMistakes: [
      'Att låta röda auto-signaler ligga kvar i Exception Queue utan att omvandla dem till formella beslut.',
      'Att bocka av ett PDCA-beslut som Done innan effekten kontrollerats i nästkommande KPI-mätning.',
      'Att skriva vaga beslut utan namn på ägare eller datum.',
    ],
    checklist: [
      { id: 'c9-1', label: 'Förstått alla fyra stegen i PDCA (PLAN, DO, CHECK, ACT)' },
      { id: 'c9-2', label: 'Förstått skillnaden mellan automatisk KPI-varning och formell PDCA Review' },
      { id: 'c9-3', label: 'Öppnat PDCA Reviews och granskat Exception Queue samt PDCA Review Records' },
    ],
    sandboxId: 'kpi-pdca',
    proposedNote:
      'Observera: PDCA Decisions spårar status Open/Done, ägare, datum och mötesanteckningar. Ett separat signeringsfält för fristående effektverifiering (Effectiveness Verified Date) är markerat som föreslaget framtida tillägg.',
  },
  {
    id: 10,
    code: 'Kapitel 10',
    levelLabel: 'Nivå 4 · ISO & Ledningens genomgång',
    title: 'Management Review & ISO-revisionsbevis',
    shortTitle: 'ISO & Management Review',
    route: 'iso',
    routeLabel: 'Öppna ISO Compliance',
    secondaryRoute: { route: 'evidence', label: 'Öppna Audit Evidence Pack', requiresNonBasic: true },
    requiresNonBasic: true,
    purpose:
      'Ge ledningen ett komplett beslutsunderlag för ISO 9.3 Ledningens genomgång och samla full spårbarhet för interna och externa revisioner mot ISO 9001, ISO 14001 och ISO 45001.',
    whenToDo: 'Inför ledningens genomgång (kvartalsvis/årligen) samt inför intern och extern ISO-revision.',
    prerequisites: [
      'Mål med ifyllda ISO 6.2-fält, länkade standardkrav, uppdaterade KPI-utfall, godkännanden och PDCA-beslut.',
      'Användaren har annan roll än Basic user.',
    ],
    responsibleRoles: ['QMS auditor', 'General director', 'Auditor', 'Administratör', 'Department director'],
    roleSummary: 'QMS auditor, General director och Admin förbereder Management Review och granskar ISO; Auditor exporterar Audit Evidence Pack i läsläge. Dold för Basic user.',
    navigationPath: 'ISO Assurance → ISO Compliance · Audit Evidence Pack · Management Review.',
    instructions: [
      'Öppna ISO Compliance för att granska alla mål mot ISO 9001, 14001 och 45001: länkade paragrafer, Clause 6.2 Planning (Complete/Incomplete), Risk/Process/Doc Refs och KPI Actuals.',
      'Klicka på mål märkta Incomplete och komplettera saknade fält bland de 8 obligatoriska ISO 6.2-fälten (plus Primary Parent Goal för Site/Department).',
      'Öppna Management Review (ISO 9.3) för att gå igenom måluppfyllelse, röda KPI:er, öppna PDCA-beslut, risker/initiativ, väntande godkännanden och resursbehov. Ledning/Admin kan klicka Prepare Management Review för att skapa ett formellt granskningsprotokoll.',
      'Öppna Audit Evidence Pack, filtrera på valt Scope eller enskilt mål och granska att mål, ISO-krav, 6.2-planering, mätserier, godkännanden och revisionshistorik stämmer.',
      'Exportera bevispaketet via Export JSON (maskinläsbar spårbarhetsfil) eller Print Report (utskriftsklar PDF för revisor).',
    ],
    practicalExample: {
      heading: 'Exempel: Inför extern ISO 9001/14001/45001-revision',
      summary: 'QMS auditor och extern revisor kontrollerar spårbarheten för Site: Uppsala.',
      rows: [
        { label: 'ISO Compliance', value: 'Kontrollerar att samtliga mål har ISO-krav, 6.2-plan, risk-, process- & dokumentreferens' },
        { label: 'Management Review (9.3)', value: 'Sammanställer On track / At risk / Off track, öppna PDCA-beslut och nya resursbeslut' },
        { label: 'Audit Evidence Pack', value: 'Inkluderar godkännanden, revisionshistorik (v1 → v2), 12 månaders KPI-utfall och PDCA-beslut' },
        { label: 'Export', value: 'Export JSON + Print Report sparas som verifierat revisionsunderlag' },
      ],
    },
    keyDistinction: {
      title: 'ISO Ready visar planeringskompletthet — INTE verifierad ISO-efterlevnad',
      body: 'Statusen Ready / Complete i ISO Compliance betyder att alla obligatoriska planeringsfält i ISO 6.2 är ifyllda i systemet. Verklig ISO-efterlevnad kräver därutöver att verksamheten faktiskt följer planen, mäter utfall, stänger avvikelser i PDCA och kan uppvisa styrkande bevis vid revision.',
    },
    expectedResult:
      'Ett komplett, sammanhållet beslutsunderlag för Management Review och ett spårbart Audit Evidence Pack redo för revisor — samt eventuella nya strategiska beslut som startar nästa varv i Kapitel 2.',
    nextStep: 'Återkoppla ledningens beslut från Management Review tillbaka till Kapitel 2 (reviderad strategi & nya årsmål) för ständiga förbättringar!',
    commonMistakes: [
      'Att tro att grön ISO Ready-status ensam garanterar godkänd certifieringsrevision utan mätdata och PDCA-bevis.',
      'Att glömma koppla Risk References, Process References och Evidence Doc Refs inne på målet.',
      'Att exportera Audit Evidence Pack med fel Scope valt så att endast en avdelning kommer med.',
    ],
    checklist: [
      { id: 'c10-1', label: 'Förstått alla 8 ISO 6.2-fält samt att ISO Ready ≠ verifierad ISO-efterlevnad' },
      { id: 'c10-2', label: 'Granskat ISO Compliance och Management Review (ISO 9.3)' },
      { id: 'c10-3', label: 'Kontrollerat hur Audit Evidence Pack filtreras och exporteras som JSON/PDF' },
    ],
  },
];

export const ROLE_TRAINING_PROFILES: RoleTrainingProfile[] = [
  {
    role: 'Administratör',
    tagline: 'Systemägare för arbetsyta, användare, ISO-katalog och konfiguration',
    visibility: 'Full insyn i hela organisationen (Organization, alla Sites och Departments) inklusive alla Draft-mål.',
    recommendedChapters: [1, 2, 3, 4, 6, 8, 9, 10],
    routines: [
      'Bjuder in teammedlemmar via Firebase UID under Administration och tilldelar roll, Site och Department.',
      'Använder Admin Role Preview för att testa och utbilda kollegor ur deras faktiska rollperspektiv.',
      'Förvaltar ISO-standardkatalogen (JSON-import), multi-workspace och JSON-säkerhetskopiering.',
    ],
    permissions: [
      'Skapa/redigera mål på alla nivåer, X-Matrix, Initiativ, Project A3, KPI:er, CSV-import och PDCA Reviews.',
      'Full åtkomst till Administration (Team, roles & workspace) samt ISO Catalog Management.',
    ],
    restrictions: [
      'Formella målgodkännanden (Approve i Formal Approvals) är reserverade för General director och QMS auditor för tydlig ansvarsfördelning.',
    ],
  },
  {
    role: 'General director',
    tagline: 'Högsta ledning · Strategiska pelare, Catchball, Formal Approval & Management Review',
    visibility: 'Full insyn i hela organisationen, alla fabriker, avdelningar och arbetsutkast (Draft).',
    recommendedChapters: [1, 2, 3, 4, 5, 7, 8, 9, 10],
    routines: [
      'Sätter 3–5-åriga Organization-pelare i Strategic Pillars och styr kaskadering till Sites.',
      'Förhandlar mål och resurser i Catchball Alignment och godkänner formellt i Formal Approvals.',
      'Leder Tier 3 Obeya, månatliga PDCA Reviews och ISO 9.3 Management Review.',
    ],
    permissions: [
      'Skapa/redigera mål på alla nivåer, formellt godkänna (Approve), redigera X-Matrix, KPI:er och förbereda Management Review.',
    ],
    restrictions: [
      'Ingen åtkomst till systeminställningar i Administration (om inte användaren också är arbetsytans ägare/Admin).',
    ],
  },
  {
    role: 'Department director',
    tagline: 'Avdelningschef · Kaskaderar avdelningsmål, driver initiativ/A3 och leder Tier 1–2',
    visibility: 'Ser Organization-mål, tilldelad Site (Site: Uppsala) och egen avdelning (Department: Production) inklusive Draft.',
    recommendedChapters: [1, 3, 4, 5, 6, 7, 8, 9],
    routines: [
      'Skapar avdelningsmål kopplade till Site-mål via Primary Parent Goal och fyller i ISO 6.2-planeringen.',
      'Förhandlar i Catchball (Counter-proposal / Align) och skickar överenskomna mål via Submit for Approval.',
      'Driver Initiatives (SQDC/TOC), Project A3 + 5-Why, uppdaterar avdelningens KPI:er och leder Daily Board Tier 1–2.',
    ],
    permissions: [
      'Skapa/redigera mål, X-Matrix-kopplingar, Initiativ, A3, KPI:er och PDCA-beslut inom Department: Production.',
      'Eskalera blockerare till Tier 3 / PDCA Reviews.',
    ],
    restrictions: [
      'Kan inte skapa/redigera Organization- eller Site-mål och kan inte formellt godkänna (Approve).',
      'Ser inte övriga avdelningar eller andra fabriker.',
    ],
  },
  {
    role: 'QMS auditor',
    tagline: 'Kvalitets- & ISO-ansvarig · Säkrar ISO 6.2/9.3-spårbarhet, godkänner och sammanställer bevis',
    visibility: 'Full insyn i hela organisationen, alla Sites, Departments och Draft-mål.',
    recommendedChapters: [1, 2, 3, 4, 5, 8, 9, 10],
    routines: [
      'Granskar ISO Compliance så alla mål når ISO Ready och har kopplade risk-, process- och dokumentreferenser.',
      'Deltar i Catchball och formellt godkänner kvalitetssäkrade mål i Formal Approvals.',
      'Förbereder ISO 9.3 Management Review Input och sammanställer Audit Evidence Pack.',
    ],
    permissions: [
      'Godkänna mål (Approve), redigera mål/X-Matrix/KPI:er/PDCA Reviews och förbereda Management Review.',
    ],
    restrictions: [
      'Hanterar inte användarinbjudningar eller workspace-ägarskap (kräver Administratör).',
    ],
  },
  {
    role: 'Auditor',
    tagline: 'Intern eller extern revisor · Oberoende granskning i läsläge',
    visibility: 'Läser Organization, tilldelad Site (Site: Uppsala) och Department: Production (inkl. utkast och historik).',
    recommendedChapters: [1, 3, 4, 5, 8, 9, 10],
    routines: [
      'Verifierar röd tråd i Goal Cascade och X-Matrix från strategi ner till mätbara KPI:er.',
      'Granskar godkännandestämplar, revisionshistorik (v1 → v2) och stängda PDCA-beslut.',
      'Exporterar eller skriver ut Audit Evidence Pack inför revisionsrapport.',
    ],
    permissions: [
      'Läsrättighet i samtliga synliga moduler inklusive ISO Compliance, Formal Approvals och Audit Evidence Pack.',
    ],
    restrictions: [
      'Strikt läsläge (Read-only): kan inte skapa, ändra, godkänna, flytta Kanban-kort eller radera data.',
    ],
  },
  {
    role: 'Basic user',
    tagline: 'Team Leader / Medarbetare · Daglig styrning i Tier 1 & egna uppgifter i My Focus',
    visibility: 'Ser ENDAST formellt godkända (Approved) mål inom Organization, tilldelad Site och Department.',
    recommendedChapters: [1, 6, 7, 8],
    routines: [
      'Markerar dagens ruta i Safety Cross och uppdaterar Kanban Pulse Cards på morgonmötet (Daily Board Tier 1).',
      'Följer avdelningens godkända mål, initiativ och KPI-status i läsläge.',
      'Checkar av egna uppgifter (Owner = Team Leader) i My Focus (Obeya) eller Project Tasks.',
    ],
    permissions: [
      'Uppdatera Safety Cross, skapa/flytta/kommentera Pulse Cards och markera egna tasks (Team Leader) som Done.',
    ],
    restrictions: [
      'Ser inte Draft/Pending mål och har inte tillgång till Catchball, Formal Approvals, ISO Compliance, Audit Evidence Pack eller Management Review.',
    ],
  },
];
