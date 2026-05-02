import type { LandingCopy } from './types'

const en: LandingCopy = {
  meta: {
    title: 'DueDateHQ — See deadline risk before it becomes a penalty',
    description:
      'Glass-box deadline intelligence for US CPA practices. Every dollar at risk, every IRS rule, every state-level alert traces back to its official source.',
    ogImage: '/og/home.en.png',
  },
  nav: {
    brand: 'DueDateHQ',
    audience: 'For US CPA practices',
    links: [
      { label: 'Product', href: '/#hero' },
      { label: 'Workflow', href: '/#workflow' },
      { label: 'Evidence', href: '/#proof' },
      { label: 'Security', href: '/#security' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Resources', href: '/rules' },
    ],
    statusPill: 'Live in CA · NY · TX · FL · WA',
    cta: 'Open the workbench',
  },
  hero: {
    eyebrow: 'GLASS-BOX DEADLINE INTELLIGENCE',
    title: 'See deadline risk before it becomes a penalty.',
    description:
      'DueDateHQ is the deadline intelligence workbench for US CPA practices. Every dollar at risk, every IRS rule, every state-level alert traces back to its official source — in one keyboard-first console built for the Monday 5-minute triage.',
    primaryCta: 'Open the workbench',
    secondaryCta: 'See the workflow',
    trust: [
      { label: 'No black-box AI' },
      { label: 'Cites every number' },
      { label: 'Keyboard-first' },
      { label: '24h Pulse SLA' },
    ],
    surface: {
      breadcrumb: { workbench: 'Workbench', dashboard: 'Dashboard', week: 'This week' },
      kbdCommand: 'Command',
      brief: {
        status: 'READY',
        title: 'AI weekly brief',
        text: 'Start with Acme and Birchwood: both are inside the seven-day window, have ready exposure, and cite the current IRS source.',
        citation: '[1] IRS Pub 509',
      },
      pulse: {
        tag: 'PULSE',
        text: 'CA-FTB extends Form 540 + 540-ES to Oct 15 · Affects 12 of your clients.',
        source: 'ftb.ca.gov · 2026-04-25',
        cta: 'Review',
      },
      metric: {
        eyebrow: 'PENALTY RADAR · THIS WEEK',
        range: 'Apr 25 — May 01',
        value: '$187,420',
        delta: '+ $24,180 vs last Mon',
        stats: [
          { label: 'CRITICAL CLIENTS', value: '5' },
          { label: 'AT RISK FORMS', value: '12' },
          { label: 'PULSE EVENTS (24h)', value: '3' },
          { label: 'FILED THIS WEEK', value: '11' },
        ],
      },
      triageTabs: [
        { label: 'This Week', count: '12' },
        { label: 'This Month', count: '21' },
        { label: 'Long-term', count: '8' },
      ],
      table: {
        headers: {
          priority: 'PRIORITY',
          client: 'CLIENT',
          form: 'FORM',
          due: 'DUE',
          days: 'DAYS',
          status: 'STATUS',
          severity: 'SEVERITY',
          exposure: 'EXPOSURE',
          evidence: 'EVIDENCE',
        },
        rows: [
          {
            priority: 'P0',
            client: 'Acme LLC',
            ein: '87-1234567',
            form: '1120-S',
            due: 'Apr 28',
            daysLeft: 'in 3d',
            status: 'Review',
            severityLabel: 'critical',
            exposure: '$48,200',
            evidence: 'IRS Pub 509',
            severity: 'critical',
          },
          {
            priority: 'P0',
            client: 'Birchwood Co',
            ein: '87-9988776',
            form: '1065',
            due: 'Apr 29',
            daysLeft: 'in 4d',
            status: 'Waiting',
            severityLabel: 'critical',
            exposure: '$32,850',
            evidence: 'IRS §6072(b)',
            severity: 'critical',
          },
          {
            priority: 'P1',
            client: 'Crestmont Inc',
            ein: '88-2233445',
            form: '1120',
            due: 'May 02',
            daysLeft: 'in 7d',
            status: 'In progress',
            severityLabel: 'high',
            exposure: '$24,180',
            evidence: 'IRS Pub 509',
            severity: 'high',
          },
          {
            priority: 'P2',
            client: 'Delta Group',
            ein: '88-7654321',
            form: '540-ES',
            due: 'May 10',
            daysLeft: 'in 15d',
            status: 'Pending',
            severityLabel: 'medium',
            exposure: '$18,900',
            evidence: 'CA-FTB FR-31',
            severity: 'medium',
          },
          {
            priority: 'P2',
            client: 'Evergreen LLC',
            ein: '87-1100221',
            form: '1065',
            due: 'May 14',
            daysLeft: 'in 19d',
            status: 'Pending',
            severityLabel: 'medium',
            exposure: '$12,450',
            evidence: 'IRS §6072(b)',
            severity: 'medium',
          },
        ],
      },
      hints: [
        { keys: 'E', label: 'Evidence' },
        { keys: 'J / K', label: 'Move row' },
        { keys: '⌘K', label: 'Command' },
        { keys: '?', label: 'Shortcuts' },
      ],
      liveLabel: 'live preview · not your data',
    },
  },
  sla: {
    items: [
      {
        ruleNumber: 'RULE 00',
        ruleLabel: '01 TRIAGE',
        value: '30',
        unit: 'sec',
        description:
          'See this week’s riskiest 5 clients on the Monday console. Penalty Radar is server-pre-aggregated, so the dollar appears before the page even paints.',
      },
      {
        ruleNumber: 'RULE 00',
        ruleLabel: '02 MIGRATE',
        value: '30',
        unit: 'min',
        description:
          'Paste, map, normalize, generate. 30 clients to a verified annual calendar in one sitting — no per-client setup wizards.',
      },
      {
        ruleNumber: 'RULE 00',
        ruleLabel: '03 PULSE',
        value: '24',
        unit: 'hrs',
        description:
          'Every state filing notice and IRS update reaches Dashboard + email within 24 hours, with a source excerpt and an apply-to-12-clients button.',
      },
    ],
  },
  problem: {
    eyebrow: 'THE PROBLEM WITH TODAY’S STACK',
    index: '01',
    title: 'Excel + Outlook + 50 state websites — priced in penalties.',
    paragraph:
      '1–10-person CPA practices stitch together legacy desktop trackers, regulatory PDFs, and spreadsheet calendars. The result is foreseeable and expensive: missed deadlines, compounded penalties, and Monday triage that takes a full morning.',
    footnote: 'IRS § 6651 · failure-to-file penalty → 5%/mo, capped at 25%',
    cards: [
      {
        tag: 'STATE WATCH',
        severity: 'critical',
        cadence: 'avg / firm / yr',
        headline:
          '14 rule changes ship in a 30-day window. You need to know which 4 hit your clients.',
        body: 'Pulse condenses every IRS notice and 50-state filing change into a single dashboard banner with `source_excerpt`, `source_url`, and a one-click apply path.',
        listTitle: 'Rule changes, last 30 days',
        listSummary: '14 changes · 5 states',
        rows: [
          { pill: 'CA-FTB', text: 'Form 540 deadline change', date: 'Apr 25' },
          { pill: 'NY-DTF', text: 'MTA-305 surcharge update', date: 'Apr 22' },
          { pill: 'IRS', text: 'Pub 509 calendar revision', date: 'Apr 18' },
        ],
      },
      {
        tag: 'NOTICE TRIAGE',
        severity: 'high',
        cadence: 'avg / firm / yr',
        headline: '312 inbox items per week, 4 of which can fine your clients.',
        body: 'Email digests + dashboard banners replace inbox archeology. Owner is the only signer; no notice slips into a junior’s drafts.',
        listTitle: 'Inbox · unread',
        listSummary: '312 unread · 4 critical',
        rows: [
          { pill: 'CA-FTB', text: 'Disaster relief postponement — LA county', date: '9:42' },
          { pill: 'IRS', text: 'Quarterly publication update for tax year 2026', date: 'Wed' },
          { pill: 'Drake', text: 'Software update notice — needs your action', date: 'Mon' },
          { pill: 'QuickBooks', text: '8 client documents await classification', date: 'Sun' },
        ],
      },
      {
        tag: 'MIGRATION DRAG',
        severity: 'medium',
        cadence: 'avg / firm / yr',
        headline: '4 hours of typing to move 30 clients from File-In-Time to anywhere.',
        body: 'Migration Copilot maps, normalizes and generates the year’s calendar in 30 minutes. Every imported client carries an evidence link to its source row.',
        listTitle: 'File-In-Time export → spreadsheet',
        listSummary: '30 clients · 4 hrs typing',
        rows: [
          { pill: 'Acme LLC', text: '— missing EIN', date: 'LOW 0.62', severity: 'critical' },
          { pill: 'Birchwood Co', text: '— unclear state', date: 'LOW 0.62', severity: 'medium' },
          {
            pill: 'Crestmont Inc',
            text: '— wrong entity type',
            date: 'LOW 0.62',
            severity: 'critical',
          },
          {
            pill: 'Delta Group',
            text: '— deadline format ?',
            date: 'LOW 0.62',
            severity: 'medium',
          },
        ],
      },
    ],
  },
  workflow: {
    eyebrow: 'THE WORKFLOW',
    index: '02',
    title: 'Triage. Migrate. Verify. Three surfaces, one console.',
    paragraph:
      'DueDateHQ is built around three product rules: every action lives on the keyboard, every number is mono-tabular, every AI output cites its source. Below: three slices of the actual workbench.',
    steps: [
      {
        index: '01',
        tag: 'TRIAGE · 30 SECONDS',
        headline: 'The Monday console.',
        body: 'Owner opens the laptop, sees five at-risk clients, the dollar exposure, and the first action keystroke. Smart Priority is a pure-function sort — no LLM in the dashboard hot path.',
        hints: [
          { keys: '⌘K', label: 'Command' },
          { keys: 'E', label: 'Evidence' },
        ],
        surface: {
          kind: 'dashboard',
          header: { title: 'Dashboard · Monday triage', timestamp: '2026-04-25 08:14' },
          ranges: ['This week', 'This month', 'Long term'],
          summary: [
            { label: 'OPEN', value: '18' },
            { label: 'DUE THIS WEEK', value: '12' },
            { label: 'EXPOSURE', value: '$187k' },
          ],
          tableHeaders: {
            priority: 'PRI',
            client: 'CLIENT',
            form: 'FORM',
            due: 'DUE',
            status: 'WINDOW',
            exposure: 'EXPOSURE',
          },
          pulse: {
            tag: 'PULSE',
            text: 'IRS extends Form 1040 to Oct 15 · 18 of your clients now in the new window.',
            cta: 'Apply to 18',
          },
          rows: [
            {
              client: 'Acme LLC',
              form: '1120-S',
              due: 'Apr 28',
              daysLeft: 'in 3d',
              exposure: '$48,200',
              severity: 'critical',
            },
            {
              client: 'Birchwood Co',
              form: '1065',
              due: 'Apr 29',
              daysLeft: 'in 4d',
              exposure: '$32,850',
              severity: 'critical',
            },
            {
              client: 'Crestmont Inc',
              form: '1120',
              due: 'May 02',
              daysLeft: 'in 7d',
              exposure: '$24,180',
              severity: 'medium',
            },
          ],
        },
      },
      {
        index: '02',
        tag: 'MIGRATE · 30 MINUTES',
        headline: 'Paste, map, normalize, generate.',
        body: 'Migration Copilot maps 30 fields per client with confidence-graded suggestions. Anything below 0.80 is non-blocking; the operator nudges, doesn’t retype.',
        hints: [
          { keys: '⌘V', label: 'Paste' },
          { keys: 'Tab', label: 'Next field' },
        ],
        surface: {
          kind: 'mapping',
          step: 'Migration Copilot · Step 2 of 4',
          steps: [
            { label: 'Intake' },
            { label: 'AI Mapping' },
            { label: 'Normalize' },
            { label: 'Genesis' },
          ],
          headers: {
            source: 'FIT EXPORT COLUMN',
            target: 'DUEDATEHQ FIELD',
            sample: 'SAMPLE',
            confidence: 'CONFIDENCE',
          },
          rows: [
            {
              source: 'ClientName',
              sample: 'Acme Holdings LLC',
              target: 'client.legal_name',
              confidenceLabel: 'HIGH 0.97',
              confidence: 'HIGH',
            },
            {
              source: 'EIN_TIN',
              sample: '87-1234567',
              target: 'client.ein',
              confidenceLabel: 'HIGH 0.99',
              confidence: 'HIGH',
            },
            {
              source: 'Entity',
              sample: 'LLC (S-corp election)',
              target: 'client.entity_type · entity.s_election=true',
              confidenceLabel: 'HIGH 0.96',
              confidence: 'HIGH',
            },
            {
              source: 'Filing State',
              sample: 'CA, NY',
              target: 'client.states[]',
              confidenceLabel: 'MED 0.84',
              confidence: 'MED',
            },
            {
              source: 'Notes',
              sample: 'Quarterly review needed',
              target: 'migration.notes',
              confidenceLabel: 'LOW 0.71',
              confidence: 'LOW',
            },
          ],
          footer: { summary: '30 rows · AI mapper avg conf 0.91', cta: 'Apply mapping' },
        },
      },
      {
        index: '03',
        tag: 'VERIFY · EVERY CLAIM',
        headline: 'No provenance, no render.',
        body: 'Every AI sentence and every rule citation links back to a `source_url`, a `source_excerpt`, and a `verified_at`. If those three fields are missing, DueDateHQ shows a verification-needed state instead of a recommendation.',
        hints: [
          { keys: 'E', label: 'Open evidence' },
          { keys: 'Esc', label: 'Close' },
        ],
        surface: {
          kind: 'evidence',
          drawerTitle: 'Evidence drawer · Acme LLC · 1120-S due Apr 28',
          confidence: 'HIGH 0.97',
          closeHint: 'ESC · close',
          fields: [
            { label: 'CLIENT', value: 'Acme Holdings LLC' },
            { label: 'EIN', value: '87-1234567' },
            { label: 'FORM', value: '1120-S' },
            { label: 'DUE DATE', value: '2026-04-28' },
            { label: 'DAYS LEFT', value: '3 days' },
            { label: 'EXPOSURE', value: '$48,200.00' },
            { label: 'PENALTY RULE', value: 'IRC § 6651(a)(1)' },
          ],
          source: {
            label: 'SOURCE',
            value: 'irs.gov / pub / 509 · §3 · v17',
            verified: 'verified 2026-04-25T08:14:03Z by pulse-ingest-3.2',
            quoteLabel: 'SOURCE EXCERPT',
            quote:
              '"If an S corporation election was made and the corporation files Form 1120-S on the basis of a calendar year, the return is due on or before March 15. If the corporation operates on a fiscal year, the return is due on or before the 15th day of the third month after the close of the tax year."',
          },
          meta: {
            source: 'irs.gov · v17',
            verifiedBy: 'pulse-ingest-3.2',
            reviewed: 'sarah@firmname',
            status: 'done',
          },
        },
      },
    ],
  },
  proof: {
    eyebrow: 'THE GLASS-BOX GUARANTEE',
    index: '03',
    title: 'Every number on the dashboard clicks back to its source.',
    paragraph:
      'AI is allowed to summarize, suggest, and draft. It is never allowed to render a recommendation without a verifiable source URL, a source excerpt, and a server-side timestamp. The interface fails closed: missing provenance → verification-needed state.',
    footnote: 'Glass-Box Guard · every AI claim is validated against its source',
    stats: [
      {
        label: 'VERIFIED CITATIONS',
        value: '100',
        unit: '%',
        body: 'Every AI sentence and every rule citation carries source_url + source_excerpt + verified_at, or is suppressed.',
      },
      {
        label: 'OFFICIAL SOURCES',
        value: '48',
        unit: '+',
        body: 'IRS, FTB, DTF · 50-state filing authorities, mapped to a single rule schema.',
      },
      {
        label: 'PULSE SLA',
        value: '24',
        unit: 'h',
        body: 'From source publication to dashboard banner + email digest, with the affected client list pre-computed.',
      },
      {
        label: 'BLACK-BOX SUGGESTIONS',
        value: '0',
        unit: '',
        body: 'AI never auto-applies a rule. Apply is always a keyboard action by a human in the loop.',
      },
    ],
  },
  security: {
    title: 'WHY CPAs TRUST IT',
    items: [
      { pill: 'Per-firm', body: 'your data never crosses tenants' },
      { pill: 'Evidence', body: 'every claim · source + excerpt' },
      { pill: 'Audit log', body: 'apply · undo · revert recorded' },
      { pill: 'Email-first', body: 'no client portal vault required' },
    ],
  },
  finalCta: {
    pill: 'AVG $54k / yr / practice',
    pillCaption: 'AVOIDABLE PENALTY EXPOSURE IN A CALENDAR YEAR',
    title: 'Open the workbench. Let the dollars speak.',
    body: 'Start with Solo at no cost. No credit card. No native app. Sign in with Google and the first dollar of risk appears within ten minutes of your first paste.',
    primaryCta: 'Open the workbench',
    secondaryCta: 'Contact sales',
    trust: 'no credit card · cancel anytime',
  },
  pricing: {
    meta: {
      title: 'DueDateHQ Pricing — Deadline intelligence for CPA practices',
      description:
        'Simple plans for US CPA practices that need deadline risk, source-backed rules, and a shared operating queue.',
      ogImage: '/og/home.en.png',
    },
    navPricingHref: '/pricing',
    hero: {
      eyebrow: 'PRICING',
      title: 'Pay for the deadline risk you can actually see.',
      description:
        'Start with one practice workspace on Solo, move to Pro when that practice needs shared operations, and talk to us about Firm when multiple offices or workspaces become operational requirements.',
      note: 'No credit card required for Solo · DueDateHQ never stores card numbers',
    },
    plansHeader: {
      eyebrow: 'PLANS',
      title: 'Choose the plan that matches your practice.',
      note: 'USD PRICING · OWNER-APPROVED UPGRADES',
    },
    plans: [
      {
        name: 'Solo',
        price: '$0',
        priceKind: 'numeric',
        cadence: 'forever',
        description: 'For one owner evaluating the workbench with sample or first-party data.',
        seats: '1 PRACTICE WORKSPACE · 1 OWNER SEAT',
        cta: 'Open the workbench',
        hrefKind: 'app',
        features: [
          '1 practice workspace',
          'Migration and rules preview',
          'Source-backed evidence',
          'Sample or first-party data',
        ],
      },
      {
        name: 'Pro',
        badge: 'Recommended',
        price: '$99',
        priceKind: 'numeric',
        cadence: '/ month',
        description: 'For growing CPA practices that need shared deadline operations.',
        seats: '1 PRODUCTION PRACTICE · 5 SEATS',
        cta: 'Upgrade to Pro',
        hrefKind: 'checkout',
        features: [
          '1 production practice',
          '5 seats included',
          'Shared deadline operations',
          'Pulse and workboard access',
        ],
      },
      {
        name: 'Firm',
        price: 'Custom',
        priceKind: 'text',
        cadence: 'annual agreement',
        description:
          'For practices that need audit export workflows, priority onboarding, and coverage expansion.',
        seats: 'MULTIPLE PRACTICES/OFFICES · 10+ SEATS',
        cta: 'Contact sales',
        hrefKind: 'contact',
        features: [
          'Multiple practices or offices',
          'Priority onboarding',
          'Audit exports and coverage planning',
          'Coverage expansion review',
        ],
      },
    ],
    faqHeader: {
      eyebrow: 'FAQ',
      title: 'Common questions about plans.',
    },
    faq: [
      {
        question: 'Who can upgrade a practice?',
        answer:
          'Only the active practice owner can start or change a paid subscription. Member roles can review plan status but cannot make billing changes.',
      },
      {
        question: 'What does Pro add over Solo?',
        answer:
          'Pro adds a five-seat shared workspace, Pulse monitoring, and the workboard views a growing practice needs for deadline operations.',
      },
      {
        question: 'Can I keep using Solo?',
        answer:
          'Yes. Solo remains available for a single-owner practice while you evaluate the workbench.',
      },
      {
        question: 'Can I create multiple practices?',
        answer:
          'Solo and Pro include one active practice workspace. Additional practices, offices, or demo/production separation are available on the Firm plan.',
      },
    ],
  },
  geo: {
    structuredData: {
      organizationName: 'DueDateHQ',
      organizationDescription:
        'DueDateHQ builds glass-box deadline intelligence software for US CPA practices.',
      websiteName: 'DueDateHQ',
      productName: 'DueDateHQ',
      productDescription:
        'A source-backed deadline intelligence workbench for CPA practices managing filing risk, state updates, evidence review, and shared deadline operations.',
      audience: 'US CPA practices',
    },
    rules: {
      meta: {
        title: 'DueDateHQ Rule Library — Source-backed tax deadline coverage',
        description:
          'How DueDateHQ handles IRS and state tax deadline rules with source URLs, excerpts, verification timestamps, and human review.',
        ogImage: '/og/home.en.png',
      },
      hero: {
        eyebrow: 'RULE LIBRARY',
        title: 'Deadline rules are only useful when every claim has a source.',
        description:
          'DueDateHQ treats filing rules as evidence-backed product data. Each public-source signal is normalized into a rule workflow with official source context, a review state, and a clear boundary between software coverage and tax advice.',
        note: 'Coverage pages describe software behavior, not professional tax advice.',
      },
      sections: [
        {
          eyebrow: 'SOURCE INTAKE',
          title: 'Official sources first.',
          body: 'The rule workflow starts with public agency material instead of third-party summaries. DueDateHQ prioritizes IRS publications, state tax authority pages, filing calendars, form instructions, notices, and emergency relief announcements.',
          items: [
            {
              title: 'Canonical source URL',
              body: 'Each rule keeps the official page URL so reviewers and users can inspect the same source DueDateHQ used.',
            },
            {
              title: 'Source excerpt',
              body: 'A short excerpt is preserved for review context; the product avoids unsupported summaries in deadline workflows.',
            },
            {
              title: 'Verified timestamp',
              body: 'Rules carry a verification timestamp so CPA teams can see when a source was last reviewed.',
            },
          ],
        },
        {
          eyebrow: 'REVIEW MODEL',
          title: 'AI can assist, but it cannot become the source of truth.',
          body: 'DueDateHQ uses AI to summarize, classify, and draft operational changes only when source context is present. Human review remains the gate before deadline changes are applied to client-facing operations.',
          items: [
            {
              title: 'Human review required',
              body: 'A rule is not treated as ready for operational use until the review state is explicit.',
            },
            {
              title: 'No black-box recommendations',
              body: 'Missing source context moves work into a verification-needed state instead of producing a silent recommendation.',
            },
            {
              title: 'Audit-ready changes',
              body: 'Apply, undo, and revert workflows are designed to leave an operational record for the firm.',
            },
          ],
        },
      ],
      faqHeader: {
        eyebrow: 'FAQ',
        title: 'Rule library questions.',
      },
      faq: [
        {
          question: 'Does DueDateHQ provide tax advice?',
          answer:
            'No. DueDateHQ describes software coverage and source handling. CPA teams should verify obligations against official IRS and state authority sources and apply professional judgment.',
        },
        {
          question: 'What makes a rule evidence-backed?',
          answer:
            'An evidence-backed rule keeps an official source URL, source excerpt, verification timestamp, and review status with the product workflow.',
        },
        {
          question: 'Can AI apply a filing rule automatically?',
          answer:
            'No. AI can assist with summarization and classification, but DueDateHQ keeps deadline changes behind source-backed review and human action.',
        },
      ],
      cta: {
        title: 'See which state signals are in scope.',
        body: 'State coverage explains the first five jurisdictions DueDateHQ monitors for public filing updates.',
        primary: 'View state coverage',
        secondary: 'Open pricing',
      },
    },
    stateCoverage: {
      meta: {
        title: 'DueDateHQ State Coverage — CA, NY, TX, FL, WA filing signals',
        description:
          'Public state coverage for DueDateHQ Pulse monitoring across California, New York, Texas, Florida, and Washington filing-update signals.',
        ogImage: '/og/home.en.png',
      },
      hero: {
        eyebrow: 'STATE COVERAGE',
        title: 'Five state filing surfaces, one evidence-first monitoring model.',
        description:
          'DueDateHQ v1 public coverage focuses on CA, NY, TX, FL, and WA. Coverage means the product monitors public state filing signals and routes changes into source-backed review workflows.',
        note: 'Coverage is software monitoring scope; it is not a guarantee that every obligation applies to every firm.',
      },
      statesHeader: {
        eyebrow: 'LIVE COVERAGE',
        title: 'States in the first public coverage set.',
      },
      states: [
        {
          slug: 'california',
          name: 'California',
          abbreviation: 'CA',
          status: 'Live',
          body: 'FTB-facing filing updates, deadline notices, form-instruction changes, and relief announcements that can affect CPA deadline triage.',
          href: '/states/california',
        },
        {
          slug: 'new-york',
          name: 'New York',
          abbreviation: 'NY',
          status: 'Live',
          body: 'Department of Taxation and Finance updates, filing notices, calendar changes, and state-level signals routed into evidence review.',
          href: '/states/new-york',
        },
        {
          slug: 'texas',
          name: 'Texas',
          abbreviation: 'TX',
          status: 'Live',
          body: 'Comptroller updates, franchise-tax filing signals, public notice changes, and deadline-related announcements.',
          href: '/states/texas',
        },
        {
          slug: 'florida',
          name: 'Florida',
          abbreviation: 'FL',
          status: 'Live',
          body: 'Department of Revenue updates, public notices, relief announcements, and filing-surface changes relevant to CPA operations.',
          href: '/states/florida',
        },
        {
          slug: 'washington',
          name: 'Washington',
          abbreviation: 'WA',
          status: 'Live',
          body: 'Department of Revenue public updates, due-date notices, and official filing signals that can enter review workflows.',
          href: '/states/washington',
        },
      ],
      sourceModel: {
        eyebrow: 'SOURCE MODEL',
        title: 'What coverage means in DueDateHQ.',
        body: 'Coverage starts with public monitoring, then routes candidate changes into source-backed review. A signal becomes actionable only when the source URL, excerpt, verification metadata, and review status are present.',
        items: [
          {
            title: 'Public agency sources',
            body: 'DueDateHQ prioritizes official tax authority pages, filing calendars, form instructions, notices, and emergency relief pages.',
          },
          {
            title: 'Firm-specific applicability',
            body: 'Coverage does not mean every signal applies to every client. The workbench helps a firm review impact against its own client profile.',
          },
          {
            title: 'Operational handoff',
            body: 'Relevant changes can surface in dashboard, workboard, and email workflows after review.',
          },
        ],
      },
      faqHeader: {
        eyebrow: 'FAQ',
        title: 'State coverage questions.',
      },
      faq: [
        {
          question: 'Does state coverage include all US jurisdictions?',
          answer:
            'No. v1 public coverage is limited to CA, NY, TX, FL, and WA. Additional jurisdictions require source review and coverage planning.',
        },
        {
          question: 'Does coverage mean automatic compliance?',
          answer:
            'No. Coverage describes monitoring scope and product workflow. CPA teams remain responsible for reviewing applicability and filing decisions.',
        },
        {
          question: 'How are source changes surfaced?',
          answer:
            'Candidate changes are routed with source URL, excerpt, verification timestamp, and review status before they appear as operational work.',
        },
      ],
    },
    states: [
      {
        slug: 'california',
        name: 'California',
        abbreviation: 'CA',
        meta: {
          title: 'California Tax Deadline Monitoring — DueDateHQ State Coverage',
          description:
            'How DueDateHQ monitors public California FTB filing signals with source URLs, excerpts, timestamps, and human review.',
          ogImage: '/og/home.en.png',
        },
        hero: {
          eyebrow: 'STATE COVERAGE · CA',
          title: 'California filing signals with source-backed review.',
          description:
            'DueDateHQ monitors public California filing updates that can affect CPA deadline operations, then routes candidate changes through evidence review before they become operational work.',
          note: 'California coverage describes monitoring scope, not tax advice.',
        },
        sourceTypes: [
          {
            title: 'FTB public pages',
            body: 'Official Franchise Tax Board pages and public deadline material are preferred over summaries.',
          },
          {
            title: 'Form instructions',
            body: 'Form-specific instructions and calendar references can become source context for rule review.',
          },
          {
            title: 'Relief announcements',
            body: 'Public postponement and disaster-relief notices can trigger firm impact review.',
          },
        ],
        coveredSignals: [
          {
            title: 'Deadline changes',
            body: 'Changes to public due-date guidance that may affect entity, individual, or estimated-payment workflows.',
          },
          {
            title: 'Applicability clues',
            body: 'County, disaster, taxpayer type, form, and period references are preserved for review context.',
          },
          {
            title: 'Operational routing',
            body: 'Reviewed signals can surface as dashboard or workboard actions when firm data indicates possible impact.',
          },
        ],
        limitations: [
          'DueDateHQ does not determine whether a California rule applies without firm review.',
          'Coverage depends on public source availability and review status.',
          'Private notices and client-specific correspondence are not part of public state coverage.',
        ],
        faq: [
          {
            question: 'Is DueDateHQ a California tax authority?',
            answer:
              'No. DueDateHQ is software. CPA teams should verify California obligations against official FTB material.',
          },
          {
            question: 'Does this page list every California filing deadline?',
            answer:
              'No. It describes the product monitoring model and source categories for California coverage.',
          },
        ],
      },
      {
        slug: 'new-york',
        name: 'New York',
        abbreviation: 'NY',
        meta: {
          title: 'New York Tax Deadline Monitoring — DueDateHQ State Coverage',
          description:
            'How DueDateHQ monitors public New York tax filing signals with official-source context and human review.',
          ogImage: '/og/home.en.png',
        },
        hero: {
          eyebrow: 'STATE COVERAGE · NY',
          title: 'New York filing updates routed through evidence review.',
          description:
            'DueDateHQ monitors public New York tax authority updates and keeps source context attached when a filing signal may affect deadline operations.',
          note: 'New York coverage describes product scope, not a filing recommendation.',
        },
        sourceTypes: [
          {
            title: 'DTF public updates',
            body: 'Official Department of Taxation and Finance pages are the preferred source surface.',
          },
          {
            title: 'Filing calendars',
            body: 'Calendar and form references can become review context for deadline operations.',
          },
          {
            title: 'Official notices',
            body: 'Public notices and filing announcements are routed into review when they contain deadline impact.',
          },
        ],
        coveredSignals: [
          {
            title: 'State deadline movement',
            body: 'Candidate due-date changes are preserved with source URL, excerpt, and verification metadata.',
          },
          {
            title: 'Form-level context',
            body: 'Form, period, taxpayer type, and jurisdiction details are kept for human review.',
          },
          {
            title: 'Firm impact workflow',
            body: 'Reviewed changes can be matched against firm-managed clients before operational work is created.',
          },
        ],
        limitations: [
          'DueDateHQ does not replace New York source review by a qualified professional.',
          'Coverage is limited to public material and reviewed product workflows.',
          'Client-specific correspondence is outside public monitoring scope.',
        ],
        faq: [
          {
            question: 'Does New York coverage include every tax type?',
            answer:
              'No. Coverage describes monitored public filing signals and review workflows, not a complete legal taxonomy.',
          },
          {
            question: 'Can a New York signal change client deadlines automatically?',
            answer:
              'No. Candidate changes require source-backed review and human action before operational use.',
          },
        ],
      },
      {
        slug: 'texas',
        name: 'Texas',
        abbreviation: 'TX',
        meta: {
          title: 'Texas Filing Deadline Monitoring — DueDateHQ State Coverage',
          description:
            'How DueDateHQ monitors public Texas filing signals and franchise-tax deadline updates for CPA operations.',
          ogImage: '/og/home.en.png',
        },
        hero: {
          eyebrow: 'STATE COVERAGE · TX',
          title: 'Texas filing signals for CPA deadline operations.',
          description:
            'DueDateHQ monitors public Texas Comptroller-facing updates and keeps source evidence attached when a signal may affect deadline triage.',
          note: 'Texas coverage is product monitoring scope and should be verified against official sources.',
        },
        sourceTypes: [
          {
            title: 'Comptroller updates',
            body: 'Public Texas Comptroller pages and official filing notices are prioritized for source review.',
          },
          {
            title: 'Franchise-tax signals',
            body: 'Public franchise-tax deadline and form references can enter evidence review.',
          },
          {
            title: 'Relief notices',
            body: 'Official relief or postponement material can trigger impact review when it names affected taxpayers or periods.',
          },
        ],
        coveredSignals: [
          {
            title: 'Deadline impact',
            body: 'Due-date changes and filing-window updates are captured as candidate operational signals.',
          },
          {
            title: 'Entity context',
            body: 'Entity type, filing period, and form references are preserved when available.',
          },
          {
            title: 'Review handoff',
            body: 'Reviewed signals can become workboard actions for CPA teams managing affected clients.',
          },
        ],
        limitations: [
          'DueDateHQ does not determine Texas tax treatment.',
          'Coverage depends on public source clarity and review state.',
          'Private agency correspondence is not covered by public monitoring.',
        ],
        faq: [
          {
            question: 'Is Texas coverage only for franchise tax?',
            answer:
              'No. Franchise-tax signals are an important public surface, but coverage is defined by monitored public filing updates and review workflows.',
          },
          {
            question: 'Does DueDateHQ file with Texas agencies?',
            answer:
              'No. DueDateHQ supports deadline operations and source review; filing decisions remain with the CPA firm.',
          },
        ],
      },
      {
        slug: 'florida',
        name: 'Florida',
        abbreviation: 'FL',
        meta: {
          title: 'Florida Filing Deadline Monitoring — DueDateHQ State Coverage',
          description:
            'How DueDateHQ monitors public Florida filing notices and deadline-related state updates with evidence review.',
          ogImage: '/og/home.en.png',
        },
        hero: {
          eyebrow: 'STATE COVERAGE · FL',
          title: 'Florida public filing updates with source context.',
          description:
            'DueDateHQ monitors public Florida Department of Revenue-facing updates and relief notices that may affect CPA deadline workflows.',
          note: 'Florida coverage describes public monitoring, not compliance advice.',
        },
        sourceTypes: [
          {
            title: 'DOR public pages',
            body: 'Official Florida Department of Revenue material is preferred for source-backed review.',
          },
          {
            title: 'Public notices',
            body: 'Filing notices and updates can become candidate deadline signals when they contain clear operational impact.',
          },
          {
            title: 'Relief announcements',
            body: 'Emergency or disaster-related public announcements are tracked for possible deadline implications.',
          },
        ],
        coveredSignals: [
          {
            title: 'Filing-surface changes',
            body: 'Public changes to deadlines, instructions, or filing windows can enter the review queue.',
          },
          {
            title: 'Affected-period context',
            body: 'Dates, periods, taxpayer classes, and geographic constraints are retained when present.',
          },
          {
            title: 'Evidence drawer workflow',
            body: 'Source URL, excerpt, and verification metadata stay attached for reviewer inspection.',
          },
        ],
        limitations: [
          'DueDateHQ does not guarantee applicability to a specific Florida client.',
          'Coverage is limited to public sources and reviewed workflows.',
          'Professional verification against official state material remains required.',
        ],
        faq: [
          {
            question: 'Can Florida updates appear in Pulse?',
            answer:
              'Yes, reviewed public signals can surface through Pulse-style workflows when they may affect firm deadline operations.',
          },
          {
            question: 'Does DueDateHQ replace Florida source review?',
            answer:
              'No. It preserves source context and operationalizes review; it does not replace professional judgment.',
          },
        ],
      },
      {
        slug: 'washington',
        name: 'Washington',
        abbreviation: 'WA',
        meta: {
          title: 'Washington Filing Deadline Monitoring — DueDateHQ State Coverage',
          description:
            'How DueDateHQ monitors public Washington Department of Revenue signals with official-source evidence workflows.',
          ogImage: '/og/home.en.png',
        },
        hero: {
          eyebrow: 'STATE COVERAGE · WA',
          title: 'Washington filing signals kept tied to official sources.',
          description:
            'DueDateHQ monitors public Washington Department of Revenue-facing material for filing signals that may need source-backed CPA review.',
          note: 'Washington coverage is software scope, not tax advice.',
        },
        sourceTypes: [
          {
            title: 'DOR public updates',
            body: 'Official Department of Revenue updates are treated as primary source material.',
          },
          {
            title: 'Due-date notices',
            body: 'Public due-date and filing-window notices can enter review when they affect operational timing.',
          },
          {
            title: 'Instruction changes',
            body: 'Public instruction updates can be preserved with source excerpt and verification metadata.',
          },
        ],
        coveredSignals: [
          {
            title: 'Deadline operations',
            body: 'Signals are evaluated for operational impact before they become dashboard or workboard items.',
          },
          {
            title: 'Applicability context',
            body: 'Form, period, taxpayer type, and official language are retained when the source provides them.',
          },
          {
            title: 'Human review',
            body: 'Human review gates source-backed signals before firm workflows treat them as actionable.',
          },
        ],
        limitations: [
          'DueDateHQ is not a Washington tax authority.',
          'Coverage depends on public-source visibility and product review status.',
          'Client-specific obligations require CPA review.',
        ],
        faq: [
          {
            question: 'Does Washington coverage include private notices?',
            answer:
              'No. Public coverage is based on public agency material, not client-specific private correspondence.',
          },
          {
            question: 'What should a firm do with a Washington signal?',
            answer:
              'Review the attached official source and determine applicability before changing client work.',
          },
        ],
      },
    ],
    guides: [
      {
        slug: 'cpa-deadline-risk',
        meta: {
          title: 'CPA Deadline Risk Guide — How firms see penalties before they happen',
          description:
            'A practical guide to CPA deadline risk, penalty exposure, missing evidence, state filing changes, and Monday triage workflows.',
          ogImage: '/og/home.en.png',
        },
        hero: {
          eyebrow: 'GUIDE',
          title: 'CPA deadline risk is an operations problem before it is a penalty.',
          description:
            'Small CPA practices do not miss deadlines because they lack calendars. They miss deadlines when client facts, state changes, source evidence, and team ownership drift apart during peak season.',
          note: 'This guide explains operational risk patterns, not tax advice.',
        },
        sections: [
          {
            eyebrow: 'RISK MODEL',
            title: 'The risky deadline is the one with missing context.',
            body: 'A date on a calendar is only one part of deadline operations. CPA teams also need client entity context, filing status, jurisdiction coverage, evidence source, and owner assignment.',
            items: [
              {
                title: 'Missing client facts',
                body: 'Entity type, state footprint, fiscal year, and extension status can change whether a deadline matters.',
              },
              {
                title: 'Source uncertainty',
                body: 'A rule copied from memory or a third-party note is harder to trust than a rule tied to an official source.',
              },
              {
                title: 'Ownership gaps',
                body: 'Deadline work becomes risky when no owner is assigned to review, file, or resolve missing data.',
              },
            ],
          },
          {
            eyebrow: 'TRIAGE',
            title: 'The Monday workflow should rank risk, not just dates.',
            body: 'Deadline risk becomes manageable when the team can scan dollars at risk, days remaining, evidence completeness, state updates, and work ownership in one operational view.',
            items: [
              {
                title: 'Dollar exposure',
                body: 'A risk queue should show which missed deadlines create meaningful penalty exposure.',
              },
              {
                title: 'Evidence completeness',
                body: 'Rows with missing or stale source evidence should be reviewed before the firm trusts the deadline.',
              },
              {
                title: 'State-change impact',
                body: 'A state filing update matters most when it can be matched to the clients it may affect.',
              },
            ],
          },
        ],
        faqHeader: {
          eyebrow: 'FAQ',
          title: 'CPA deadline risk questions.',
        },
        faq: [
          {
            question: 'Is deadline risk only about due dates?',
            answer:
              'No. Due dates matter, but risk also depends on client facts, source quality, review status, ownership, and penalty exposure.',
          },
          {
            question: 'Why does source evidence matter?',
            answer:
              'Source evidence helps a CPA team verify that a deadline or state update came from official material rather than an unsupported summary.',
          },
          {
            question: 'What should software do first?',
            answer:
              'It should make the riskiest work visible, keep source evidence close to each rule, and route ambiguous items into review.',
          },
        ],
        cta: {
          title: 'See the evidence-backed product model.',
          body: 'DueDateHQ turns deadline risk into source-backed operational work.',
          primary: 'Read the evidence guide',
          secondary: 'View rule library',
        },
      },
      {
        slug: 'evidence-backed-tax-deadline-software',
        meta: {
          title: 'Evidence-backed Tax Deadline Software — DueDateHQ Guide',
          description:
            'What evidence-backed tax deadline software means for CPA teams: source URLs, excerpts, verification timestamps, human review, and audit-ready workflows.',
          ogImage: '/og/home.en.png',
        },
        hero: {
          eyebrow: 'GUIDE',
          title: 'Evidence-backed deadline software keeps the source next to the action.',
          description:
            'For CPA operations, a filing reminder is not enough. Teams need to know why the deadline exists, which official source supports it, when it was verified, and who approved the operational change.',
          note: 'Evidence-backed workflows support review; they do not replace professional judgment.',
        },
        sections: [
          {
            eyebrow: 'DEFINITION',
            title: 'Evidence-backed means every operational claim can be inspected.',
            body: 'The product should preserve enough source context for a reviewer to understand where a rule came from and why it entered the workflow.',
            items: [
              {
                title: 'Source URL',
                body: 'The official page remains attached to the rule or signal.',
              },
              {
                title: 'Source excerpt',
                body: 'The relevant passage is visible near the operational action.',
              },
              {
                title: 'Verified metadata',
                body: 'The product records when the source was reviewed and the state of that review.',
              },
            ],
          },
          {
            eyebrow: 'WORKFLOW',
            title: 'The interface should fail closed when evidence is missing.',
            body: 'If a rule lacks source context, the safer product behavior is to request verification instead of generating a confident deadline recommendation.',
            items: [
              {
                title: 'Verification-needed states',
                body: 'Ambiguous or unsupported signals should be visible as review work.',
              },
              {
                title: 'Human-in-the-loop apply',
                body: 'A person at the firm should approve operational changes before they affect client work.',
              },
              {
                title: 'Audit trail',
                body: 'Apply, undo, and revert actions should leave a record the firm can inspect later.',
              },
            ],
          },
        ],
        faqHeader: {
          eyebrow: 'FAQ',
          title: 'Evidence-backed software questions.',
        },
        faq: [
          {
            question: 'Is evidence-backed software the same as AI tax advice?',
            answer:
              'No. Evidence-backed software keeps source context attached to workflows. It does not provide professional tax advice.',
          },
          {
            question: 'Why not let AI apply rule changes automatically?',
            answer:
              'Deadline changes can affect client obligations. DueDateHQ treats AI as an assistant and keeps operational apply actions behind review.',
          },
          {
            question: 'What is the minimum evidence a reviewer should see?',
            answer:
              'A reviewer should see the official source URL, the relevant excerpt, verification metadata, and the current review state.',
          },
        ],
        cta: {
          title: 'Review the public rule model.',
          body: 'The DueDateHQ rule library explains how source-backed signals move into deadline workflows.',
          primary: 'Open rule library',
          secondary: 'View state coverage',
        },
      },
    ],
  },
  notFound: {
    meta: {
      title: 'Page not found — DueDateHQ',
      description:
        'This DueDateHQ public page is not available. Return to the homepage or review pricing.',
      ogImage: '/og/home.en.png',
    },
    eyebrow: '404 · PUBLIC PAGE NOT FOUND',
    title: 'This page is not available.',
    body: 'The public marketing site only serves published DueDateHQ pages. You can return to the homepage, review pricing, or open the app if you were trying to reach your workbench.',
    primaryCta: 'Return home',
    secondaryCta: 'View pricing',
    statusLabel: 'ROUTE STATUS',
    statusValue: 'No client data loaded',
    routesLabel: 'PUBLISHED PATHS',
    routes: [
      { label: 'Homepage', href: '/' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Open the workbench', href: 'app' },
    ],
  },
  footer: {
    brand: 'DueDateHQ',
    tagline: 'Glass-box deadline intelligence for US CPA practices.',
    audience: 'For US CPA practices · Audit-ready · 5 states live',
    columns: [
      {
        title: 'PRODUCT',
        links: [
          { label: 'Workbench', href: '/#hero' },
          { label: 'Pulse', href: '/#workflow' },
          { label: 'Migration Copilot', href: '/guides/cpa-deadline-risk' },
          { label: 'Evidence drawer', href: '/rules' },
          { label: 'Pricing', href: '/pricing' },
        ],
      },
      {
        title: 'RESOURCES',
        links: [
          { label: 'Rule library', href: '/rules' },
          { label: 'State coverage', href: '/state-coverage' },
          { label: 'CPA deadline risk', href: '/guides/cpa-deadline-risk' },
          {
            label: 'Evidence-backed software',
            href: '/guides/evidence-backed-tax-deadline-software',
          },
          { label: 'Status', href: 'mailto:support@duedatehq.com?subject=DueDateHQ%20Status' },
        ],
      },
      {
        title: 'COMPANY',
        links: [
          { label: 'About', href: '/' },
          { label: 'Security', href: '/#security' },
          { label: 'Privacy', href: 'mailto:privacy@duedatehq.com?subject=DueDateHQ%20Privacy' },
          { label: 'Terms', href: 'mailto:legal@duedatehq.com?subject=DueDateHQ%20Terms' },
          { label: 'Contact', href: 'mailto:sales@duedatehq.com?subject=DueDateHQ' },
        ],
      },
    ],
    copyright: '© 2026 DueDateHQ Inc. · duedatehq.com',
    theme: {
      label: 'Theme',
      system: 'Match system',
      light: 'Light',
      dark: 'Dark',
    },
    language: {
      label: 'Language',
      enShort: 'EN',
      zhShort: '中',
      enLong: 'English',
      zhLong: '简体中文',
    },
    status: 'all systems operational',
  },
}

export default en
