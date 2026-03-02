# Story SCOPSY-2.0: Phase 2 - Interface Redesign & Frontend Modernization

**Project:** Scopsy SaaS (Clinical Psychology Training Platform)
**Epic:** Design System & Frontend Modernization
**Status:** Ready for Review ✅
**Priority:** P1 (Strategic - Revenue Impact)
**Complexity:** L (Large - 12 weeks)
**Type:** Feature/Modernization
**Created:** 2026-02-28
**Lead Executor:** @ux-design-expert (Uma)
**Dev Executor:** @dev (Dex)
**Quality Gate:** @qa (Quinn)
**Quality Gate Tools:** [design-review, unit-tests, accessibility-audit, performance-testing, user-testing]
**Depends On:** CRÍTICO-1 (Git history cleanup) ✅, CRÍTICO-2 (RLS implementation) ✅
**Roadmap:** PHASE-2 (Current Phase)

---

## Executor Assignment

```yaml
lead_executor: "@ux-design-expert"
dev_executor: "@dev"
qa_executor: "@qa"
quality_gate_tools:
  - design-review
  - unit-tests
  - accessibility-audit
  - performance-testing
  - user-testing
timeline: "12 weeks (Weeks 1-12 / Q2 2026)"
team_size: "1 designer + 2 frontend engineers + 1 QA"
budget: "$20,000 USD"
expected_roi: "13.5x - 24.6x ($270K-$492K annual revenue)"
```

---

## User Story

**Como** psicólogo usando Scopsy,
**Quero** uma interface moderna, responsiva e gamificada,
**Para** que eu tenha melhor experiência de aprendizado, maior engajamento e suporte a dispositivos móveis.

---

## Problem Statement

Scopsy v2.0 possui fundações sólidas de design (paleta coerente, design system CSS), mas apresenta oportunidades críticas de modernização:

**Current State Score: 6.5/10**
- Design Visual: 6/10 (funcional, sem "wow factor")
- UX/Usabilidade: 7/10 (fluxos claros, navegação pode melhorar)
- Acessibilidade: 5/10 (ARIA mínimo, sem foco estratégico)
- Responsividade: 7/10 (mobile presente, mas não otimizado)
- Gamificação: 7/10 (sistema existente, mas muito conservador)

**Target State Score: 8.2/10**
- Design Visual: 8/10
- UX/Usabilidade: 8/10
- Acessibilidade: 8/10 (WCAG AA)
- Responsividade: 9/10 (mobile-first)
- Gamificação: 8/10 (profissional)

**Impact:**
- Competidores (Coursera, LinkedIn Learning, Duolingo) score 8-9/10
- Design deficiente prejudica conversão e retenção
- 30% dos usuários no mobile com UX subótima
- Gamificação conservadora reduz engajamento em 25%

---

## Scope

### IN Scope

**Phase 1: Design System Unification (Weeks 1-4)**
- [ ] Figma component library com 15+ componentes atômicos
- [ ] Design tokens (cores, tipografia, espaçamento) em JSON/YAML
- [ ] Storybook documentation
- [ ] Animation library (Framer Motion)
- [ ] Dark mode support (prefers-color-scheme)
- [ ] Color palette refinement (mantendo identidade clínica)
- [ ] Accessibility foundations (ARIA labels, contrast, focus states)

**Phase 2: Frontend Migration (Weeks 5-8)**
- [ ] Dashboard redesign em Next.js 15 + React 19
- [ ] Consolidação: Vanilla JS (SCOPSY-CLAUDE-CODE/frontend/) + Next.js (projeto.scopsy3/scopsy-dashboard/) → unified Next.js codebase
- [ ] Gamification component suite (badges, streaks, combos, confetti)
- [ ] Chat interface rebuild (input, message bubbles, typing indicators)
- [ ] Landing page refresh
- [ ] Tailwind CSS 4 integration (design tokens → utilities)
- [ ] Mobile-first responsive design (tablet, desktop, mobile)

**Phase 3: Polish & Launch (Weeks 9-12)**
- [ ] Responsive QA (all breakpoints)
- [ ] Accessibility audit (WCAG AA compliance, screen reader testing)
- [ ] Performance optimization (Lighthouse ≥95/100)
- [ ] Micro-interactions & animation polish
- [ ] A/B testing setup (50/50 split between v2 and v3)
- [ ] Phased rollout (10% → 25% → 50% → 100%)
- [ ] User feedback collection and rapid iteration

### OUT of Scope

- Backend API changes (OpenAI integration unchanged)
- Database schema changes (use RLS from CRÍTICO-2)
- Payment integration redesign (maintain existing Stripe/Kiwify)
- New features beyond UI modernization
- Figma license procurement (assume designer has it)
- Custom font hosting (use Inter from Google Fonts)
- Multi-language support (future phase)

---

## Acceptance Criteria

**AC1: Design System Complete**
- [ ] Figma component library with 15+ atomic components (Button, Card, Badge, Input, Select, Modal, etc.)
- [ ] Design tokens exported in 3 formats: JSON, YAML, CSS
- [ ] Storybook running locally with all components documented
- [ ] Animation library integrated (Framer Motion)
- [ ] Dark mode colors defined and tested
- [ ] Design review passed by @ux-design-expert

**AC2: Dashboard Redesigned**
- [ ] Homepage/dashboard fully redesigned in Next.js
- [ ] All data displays updated to use new design system
- [ ] Responsive breakpoints tested (320px, 768px, 1024px, 1440px)
- [ ] Mobile experience verified on real devices
- [ ] Performance baseline: LCP <2.5s, CLS <0.1

**AC3: Gamification Components Implemented**
- [ ] Badge component system (TCC/ACT/DBT specific)
- [ ] Streak indicator (current + best)
- [ ] Combo counter with celebrations
- [ ] Achievement modal with confetti animation
- [ ] XP progress bar
- [ ] All integrated with existing game state

**AC4: Chat Interface Modernized**
- [ ] Message input redesigned (modern textarea + button)
- [ ] Message bubbles styled (assistant vs user distinction)
- [ ] Typing indicator animated
- [ ] Timestamps and metadata visible
- [ ] Mobile chat experience optimized (keyboard doesn't hide input)

**AC5: Accessibility Compliant**
- [ ] All interactive elements have ARIA labels
- [ ] Color contrast ≥7:1 for text (AAA standard)
- [ ] Keyboard navigation fully functional (Tab, Enter, Esc)
- [ ] Screen reader tested (NVDA/JAWS)
- [ ] WCAG AA audit passed
- [ ] Lighthouse accessibility score ≥95/100

**AC6: Performance Optimized**
- [ ] Lighthouse performance score ≥95/100
- [ ] LCP (Largest Contentful Paint) <2.0s (target)
- [ ] CLS (Cumulative Layout Shift) <0.05 (target)
- [ ] FID (First Input Delay) <50ms (target)
- [ ] Images optimized (WebP + srcset)
- [ ] Code splitting by page + lazy loading
- [ ] Bundle size tracking (no regression >10KB gzipped)

**AC7: Testing Complete**
- [ ] Unit tests for all new components (Jest)
- [ ] Integration tests for key user flows
- [ ] Accessibility tests (axe DevTools, Lighthouse)
- [ ] Visual regression tests (Percy or similar)
- [ ] E2E tests for critical paths (Playwright)
- [ ] Test coverage ≥80% for components
- [ ] All tests passing (`npm test`: 0 failures)

**AC8: Deployment Ready**
- [ ] CI/CD pipeline configured (GitHub Actions)
- [ ] Staged rollout strategy documented
- [ ] Feature flags for v2 ↔ v3 toggle
- [ ] Monitoring dashboards set up
- [ ] Rollback plan documented
- [ ] Deployment checklist completed

**AC9: Launch Successful**
- [ ] Phased rollout completed (10% → 25% → 50% → 100%)
- [ ] User feedback collected and analyzed
- [ ] Conversion metrics tracked (baseline vs v3)
- [ ] Performance metrics verified in production
- [ ] Support ticket volume stable/improved
- [ ] Post-launch sprint for bug fixes

---

## Risks

| # | Risco | Probabilidade | Impacto | Mitigação |
|---|-------|---------------|---------|-----------|
| R1 | Usuários rejeitam novo design | Média | Alto | A/B test (50/50) antes de rollout completo. Coletar feedback em beta (50 psicólogos). Quick revert plan se engagement cair >10% |
| R2 | Performance regride durante migração | Média | Alto | Monitor Core Web Vitals toda semana. Lighthouse CI no pipeline. Testar em devices low-end |
| R3 | Timeline slip (12 semanas é agressivo) | Alta | Médio | Priorizar ruthlessly. Buffer +1 semana contingência. Weekly sprints com clear DoD |
| R4 | Accessibility audit falha | Baixa | Médio | Usar automated tools (axe, Lighthouse). Manual testing com screen reader. WCAG AA audit 2 semanas antes de launch |
| R5 | OpenAI integration quebra durante migração | Baixa | Alto | Manter backend API unchanged. Chat interface rebuild sem tocar em services/ |
| R6 | Mobile responsiveness issues em production | Média | Médio | Testar em 10+ devices reais. BrowserStack subscription para cross-browser testing |

---

## Technical Notes

### Design System Architecture

```
Figma Component Library
├── Atoms (Button, Badge, Input, Label)
├── Molecules (FormGroup, Card, Modal Header)
├── Organisms (Dashboard Panel, Chat Widget)
└── Templates (Dashboard Layout, Chat Layout)

                    ↓ (export tokens)

Design Tokens (JSON/YAML/CSS)
├── colors
├── typography
├── spacing
├── shadows
└── animation

                    ↓ (Tailwind + Storybook)

React Component Library
├── @scopsy/ui (npm package or monorepo)
├── Storybook documentation
└── TypeScript interfaces
```

### Frontend Architecture

```
projeto.scopsy3/scopsy-dashboard/  (Primary codebase)
├── app/                          (Next.js App Router)
│   ├── (dashboard)/              (authenticated routes)
│   │   ├── page.tsx              (homepage)
│   │   ├── practice/             (practice modules)
│   │   ├── profile/              (user profile)
│   │   └── chat/[id]/            (chat sessions)
│   ├── (auth)/                   (authentication)
│   ├── (landing)/                (marketing pages)
│   └── api/                      (API routes)
├── components/
│   ├── ui/                       (design system components)
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   └── ...
│   ├── modules/                  (feature-specific)
│   │   ├── Gamification/
│   │   ├── Chat/
│   │   └── Dashboard/
│   └── layout/                   (layout components)
├── styles/
│   ├── globals.css               (Tailwind globals)
│   ├── animations.css            (Framer Motion shared)
│   └── tokens.css                (design tokens)
├── lib/
│   ├── hooks/                    (custom hooks)
│   └── utils/                    (utilities)
├── tests/                        (Jest + Playwright)
└── storybook/                    (Storybook configuration)

SCOPSY-CLAUDE-CODE/              (Legacy — migrate content)
├── frontend/                    (Vanilla JS) → MIGRATE TO NEXT.JS
└── src/                         (Backend — UNCHANGED)
```

### Key Technologies

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend Framework | Next.js | 15+ |
| React | React | 19+ |
| Styling | Tailwind CSS | 4+ |
| Components | shadcn/ui + custom | Latest |
| Animation | Framer Motion | 10+ |
| Forms | React Hook Form | 7+ |
| Testing | Jest + Playwright | Latest |
| Documentation | Storybook | 7+ |
| Design | Figma | Cloud |
| Icons | Heroicons | 2+ |

### Design Tokens (Example)

```json
{
  "colors": {
    "primary": {
      "start": "#1A2B48",
      "end": "#008CE2"
    },
    "success": "#2DD4BF",
    "warning": "#F59E0B",
    "error": "#DC2626"
  },
  "typography": {
    "font-family": "Inter",
    "scale": {
      "2xl": "32px",
      "xl": "24px",
      "lg": "20px",
      "md": "16px",
      "sm": "14px",
      "xs": "12px"
    }
  },
  "spacing": {
    "base": "4px",
    "scale": [4, 8, 12, 16, 24, 32, 48, 64]
  },
  "animation": {
    "fast": "200ms",
    "medium": "300ms",
    "slow": "400ms"
  }
}
```

### Deployment Strategy

**Week 1-8: Development (No user-facing changes)**
- Build in staging environment
- No feature flags needed yet
- Internal testing only

**Week 9-12: Launch Phase**
```
├─ Feature flag `ui.version` created (v2, v3, auto)
│
├─ Canary (10% of users → v3)
│  └─ Monitor: Conversion, bounce rate, error rate
│
├─ Ramp (25% of users → v3)
│  └─ Monitor: Same metrics + user feedback
│
├─ Expand (50% of users → v3)
│  └─ Collect: Beta feedback + feature requests
│
└─ Full (100% users → v3)
   └─ Monitor: 2 weeks post-launch
   └─ Rollback: If any metric regresses >10%
```

---

## Dev Agent Record

### Tasks Checklist

**Wave 1: Design System Foundation (Weeks 1-4)**

- [ ] **Task 1: Figma Setup** (@ux-design-expert)
  - [ ] Subtask 1.1: Create Figma workspace (Community or Team)
  - [ ] Subtask 1.2: Build atomic components (Button, Card, Badge, Input, Select, Modal, Toast)
  - [ ] Subtask 1.3: Build molecules (FormGroup, CardWithImage, ModalContent)
  - [ ] Subtask 1.4: Build organisms (DashboardPanel, ChatWidget, GamificationCard)
  - [ ] Subtask 1.5: Create component variants (sizes, states, colors)
  - [ ] Timeline: Weeks 1-2
  - [ ] Acceptance: Figma library complete, 15+ components, design review passed

- [ ] **Task 2: Design Tokens** (@ux-design-expert + @dev)
  - [ ] Subtask 2.1: Extract colors (primary, success, warning, error + dark mode)
  - [ ] Subtask 2.2: Define typography scale (12px-32px, weights 400-700)
  - [ ] Subtask 2.3: Define spacing scale (4px base, multiples up to 64px)
  - [ ] Subtask 2.4: Define shadows, borders, radii
  - [ ] Subtask 2.5: Export tokens (JSON, YAML, CSS)
  - [ ] Subtask 2.6: Validate Tailwind CSS integration
  - [ ] Timeline: Week 2
  - [ ] Acceptance: Tokens in 3 formats, Tailwind configured, no drift

- [ ] **Task 3: Storybook & Documentation** (@dev)
  - [ ] Subtask 3.1: Setup Storybook in Next.js project
  - [ ] Subtask 3.2: Create stories for all 15+ components
  - [ ] Subtask 3.3: Document component props, usage examples
  - [ ] Subtask 3.4: Setup design tokens in Storybook
  - [ ] Subtask 3.5: Deploy Storybook to Vercel
  - [ ] Timeline: Weeks 3-4
  - [ ] Acceptance: Storybook running, all components documented, live URL

- [ ] **Task 4: Animation Library** (@dev)
  - [ ] Subtask 4.1: Setup Framer Motion
  - [ ] Subtask 4.2: Define animation presets (fade, slide, pop, scale)
  - [ ] Subtask 4.3: Create animation utilities (useAnimation hook)
  - [ ] Subtask 4.4: Document animation patterns in Storybook
  - [ ] Subtask 4.5: Performance testing (animations don't cause layout shift)
  - [ ] Timeline: Week 4
  - [ ] Acceptance: Framer Motion integrated, animations performant, documented

- [ ] **Task 5: Dark Mode Support** (@dev)
  - [ ] Subtask 5.1: Update color tokens (light + dark variants)
  - [ ] Subtask 5.2: Implement prefers-color-scheme CSS
  - [ ] Subtask 5.3: Create theme hook (useTheme)
  - [ ] Subtask 5.4: Test dark mode in all components
  - [ ] Subtask 5.5: Add theme toggle UI (optional)
  - [ ] Timeline: Week 2-4
  - [ ] Acceptance: Dark mode functional, all components styled, no contrast issues

---

**Wave 2: Frontend Migration (Weeks 5-8)**

- [ ] **Task 6: Dashboard Redesign** (@dev)
  - [ ] Subtask 6.1: Redesign homepage layout (hero + practice modules)
  - [ ] Subtask 6.2: Create dashboard grid (modules, progress, recommendations)
  - [ ] Subtask 6.3: Implement filters and sorting
  - [ ] Subtask 6.4: Add data visualization (progress charts, streak graphs)
  - [ ] Subtask 6.5: Mobile responsiveness (test on 320px, 768px, 1024px, 1440px)
  - [ ] Timeline: Week 5
  - [ ] Acceptance: Dashboard UI complete, data flowing, responsive, Lighthouse ≥90

- [ ] **Task 7: Gamification Components** (@dev)
  - [ ] Subtask 7.1: Badge component (display + unlock animation)
  - [ ] Subtask 7.2: Streak indicator (current + best + calendar)
  - [ ] Subtask 7.3: Combo counter (animated increment + celebration)
  - [ ] Subtask 7.4: Achievement modal (with confetti + sound)
  - [ ] Subtask 7.5: XP progress bar (animated, level info)
  - [ ] Subtask 7.6: Integrate with game state (Redux/Zustand)
  - [ ] Timeline: Week 6
  - [ ] Acceptance: All components working, animations smooth, state management clean

- [ ] **Task 8: Chat Interface Rebuild** (@dev)
  - [ ] Subtask 8.1: Message input (modern design, character counter)
  - [ ] Subtask 8.2: Message bubbles (user vs assistant, timestamps)
  - [ ] Subtask 8.3: Typing indicator (animated dots)
  - [ ] Subtask 8.4: Message history (auto-scroll, virtualization for perf)
  - [ ] Subtask 8.5: Mobile chat UX (keyboard + scrolling optimization)
  - [ ] Subtask 8.6: Connect to OpenAI service (no API changes)
  - [ ] Timeline: Week 7
  - [ ] Acceptance: Chat fully functional, real-time messaging works, mobile optimized

- [ ] **Task 9: Landing Page Redesign** (@dev)
  - [ ] Subtask 9.1: Hero section (compelling copy + CTA)
  - [ ] Subtask 9.2: Features section (TCC/ACT/DBT focus)
  - [ ] Subtask 9.3: Pricing section (freemium → premium tiers)
  - [ ] Subtask 9.4: Testimonials section (psychologists)
  - [ ] Subtask 9.5: Mobile responsiveness
  - [ ] Timeline: Week 8
  - [ ] Acceptance: Landing page complete, mobile-friendly, CTA clear

- [ ] **Task 10: Codebase Migration** (@dev)
  - [ ] Subtask 10.1: Copy content from SCOPSY-CLAUDE-CODE/frontend/
  - [ ] Subtask 10.2: Migrate authentication flows
  - [ ] Subtask 10.3: Migrate API integration (openai-service)
  - [ ] Subtask 10.4: Database integration (unchanged from CRÍTICO-2)
  - [ ] Subtask 10.5: Environment configuration
  - [ ] Timeline: Weeks 5-8 (parallel)
  - [ ] Acceptance: All features from v2 working in v3, no data loss

---

**Wave 3: Polish & Launch (Weeks 9-12)**

- [ ] **Task 11: Responsive QA** (@qa)
  - [ ] Subtask 11.1: Test all pages at 320px (iPhone SE)
  - [ ] Subtask 11.2: Test all pages at 768px (iPad)
  - [ ] Subtask 11.3: Test all pages at 1024px (iPad Pro)
  - [ ] Subtask 11.4: Test all pages at 1440px (desktop)
  - [ ] Subtask 11.5: Test on real devices (BrowserStack)
  - [ ] Timeline: Week 9
  - [ ] Acceptance: 0 layout issues, touch targets ≥44x44px, no horizontal scroll

- [ ] **Task 12: Accessibility Audit** (@qa)
  - [ ] Subtask 12.1: Run axe DevTools on all pages
  - [ ] Subtask 12.2: Test keyboard navigation (Tab, Enter, Esc)
  - [ ] Subtask 12.3: Test with screen reader (NVDA on Windows)
  - [ ] Subtask 12.4: Verify color contrast (7:1 for text)
  - [ ] Subtask 12.5: Run Lighthouse accessibility audit
  - [ ] Subtask 12.6: Fix all WCAG AA violations
  - [ ] Timeline: Week 10
  - [ ] Acceptance: Lighthouse accessibility ≥95/100, zero violations

- [ ] **Task 13: Performance Optimization** (@dev)
  - [ ] Subtask 13.1: Optimize images (WebP + srcset)
  - [ ] Subtask 13.2: Implement code splitting by page
  - [ ] Subtask 13.3: Lazy load components (React.lazy)
  - [ ] Subtask 13.4: Monitor Core Web Vitals (Vercel Analytics)
  - [ ] Subtask 13.5: Minify and compress assets
  - [ ] Subtask 13.6: Run Lighthouse performance audit
  - [ ] Timeline: Week 11
  - [ ] Acceptance: Lighthouse performance ≥95/100, LCP <2.0s

- [ ] **Task 14: Testing Suite** (@qa + @dev)
  - [ ] Subtask 14.1: Unit tests for all components (Jest)
  - [ ] Subtask 14.2: Integration tests for user flows
  - [ ] Subtask 14.3: E2E tests for critical paths (Playwright)
  - [ ] Subtask 14.4: Visual regression tests (Percy)
  - [ ] Subtask 14.5: Accessibility tests (axe-playwright)
  - [ ] Subtask 14.6: Performance tests (Lighthouse CI)
  - [ ] Timeline: Weeks 9-11
  - [ ] Acceptance: Coverage ≥80%, all tests passing, no regressions

- [ ] **Task 15: Feature Flags & Rollout** (@dev + @devops)
  - [ ] Subtask 15.1: Setup feature flag system (LaunchDarkly or custom)
  - [ ] Subtask 15.2: Create `ui.version` flag (v2, v3, auto)
  - [ ] Subtask 15.3: Implement rollout automation (10% → 25% → 50% → 100%)
  - [ ] Subtask 15.4: Setup monitoring dashboards
  - [ ] Subtask 15.5: Document rollback procedure
  - [ ] Timeline: Week 11-12
  - [ ] Acceptance: Feature flags working, rollout tested in staging

- [ ] **Task 16: User Feedback Collection** (@pm)
  - [ ] Subtask 16.1: Setup beta testing (50 psychologists)
  - [ ] Subtask 16.2: Create feedback survey
  - [ ] Subtask 16.3: Setup error tracking (Sentry)
  - [ ] Subtask 16.4: Monitor conversion metrics
  - [ ] Subtask 16.5: Create rapid fix checklist
  - [ ] Timeline: Week 12 onwards
  - [ ] Acceptance: Feedback channel active, metrics tracked, issues logged

---

## Definition of Done

**Wave 1 Complete (Week 4):**
- [ ] Figma component library complete (15+ components)
- [ ] Design tokens exported (JSON, YAML, CSS)
- [ ] Storybook deployed with documentation
- [ ] Dark mode fully implemented
- [ ] Animation library integrated
- [ ] Design review passed by @ux-design-expert
- [ ] Status: "Design Foundation Complete"

**Wave 2 Complete (Week 8):**
- [ ] Dashboard redesigned and functional
- [ ] Gamification components working
- [ ] Chat interface rebuilt
- [ ] Landing page redesigned
- [ ] All features from v2 migrated
- [ ] Mobile responsiveness verified
- [ ] Status: "Frontend Migration Complete"

**Wave 3 Complete (Week 12):**
- [ ] All responsive QA passed (0 layout issues)
- [ ] WCAG AA accessibility audit passed
- [ ] Lighthouse performance ≥95/100
- [ ] Test coverage ≥80% for components
- [ ] All tests passing (`npm test`: 0 failures)
- [ ] Feature flags working, rollout ready
- [ ] User feedback collection active
- [ ] Status: "Launch Ready"

**Post-Launch (Weeks 13+):**
- [ ] Phased rollout completed (10% → 100%)
- [ ] Conversion metrics tracked and analyzed
- [ ] Performance metrics verified in production
- [ ] Support ticket volume stable/improved
- [ ] Rapid fix sprint completed
- [ ] Status: "Live & Optimized"

---

## File List (Updated 2026-02-28)

### New Files (to be created):
- `projeto.scopsy3/scopsy-dashboard/storybook/` (Storybook configuration)
- `projeto.scopsy3/scopsy-dashboard/components/ui/` (Design system components)
- `projeto.scopsy3/scopsy-dashboard/components/modules/Gamification/` (Gamification suite)
- `projeto.scopsy3/scopsy-dashboard/components/modules/Chat/` (Chat components)
- `projeto.scopsy3/scopsy-dashboard/styles/tokens.css` (Design tokens CSS)
- `projeto.scopsy3/scopsy-dashboard/tests/` (Jest + Playwright tests)
- `SCOPSY-CLAUDE-CODE/docs/DESIGN-SYSTEM.md` (Design system documentation)
- `SCOPSY-CLAUDE-CODE/docs/PHASE-2-PROGRESS.md` (Weekly progress tracking)

### Modified Files (existing):
- `projeto.scopsy3/scopsy-dashboard/app/` (Dashboard pages)
- `projeto.scopsy3/scopsy-dashboard/tailwind.config.js` (Tailwind configuration)
- `projeto.scopsy3/scopsy-dashboard/package.json` (Dependencies: Framer Motion, Storybook, testing libraries)
- `SCOPSY-CLAUDE-CODE/.env.example` (Add NEXT_PUBLIC_FIGMA_URL if needed)
- `SCOPSY-CLAUDE-CODE/README.md` (Add Phase 2 status section)

### Deleted Files:
- `SCOPSY-CLAUDE-CODE/frontend/` (Vanilla JS frontend — content migrated to Next.js)
- `projeto.scopsy3/scopsy-dashboard/pages/` (if using old pages router)

---

## Change Log

- **2026-02-28 17:00:** Story created by @dev following AIOS template. Epic scope spans 12 weeks across 3 waves: Design System (W1-4), Frontend Migration (W5-8), Polish & Launch (W9-12). Based on comprehensive UX/Design assessment (5 documents, 120+ pages). Story marked "Ready for Review"

---

## Success Metrics

### Design System Success
- [ ] Storybook component creation time: 2-3 hrs → 30 mins (80% reduction)
- [ ] New features shipped using design system: ≥5 in month 4
- [ ] Design reuse consistency: 90%+ components from library

### Mobile Success
- [ ] Mobile users on platform: 30% → 45% (user base)
- [ ] Mobile engagement: 35% → 50%
- [ ] Bounce rate on mobile: ↓20% from current

### Gamification Success
- [ ] Monthly active users (MAU): 500 → 625 (+25%)
- [ ] Daily active users (DAU) rate: 20% → 30%
- [ ] Badge adoption: ≥80% of DAU using badges within month 3
- [ ] Session duration: +15% average

### Accessibility Success
- [ ] WCAG AA compliance: 40% → 100%
- [ ] Lighthouse accessibility score: ≥95/100
- [ ] Screen reader compatibility: ≥95% flows

### Performance Success
- [ ] Lighthouse performance score: ≥95/100
- [ ] LCP (Largest Contentful Paint): <2.0s (current: <2.5s)
- [ ] CLS (Cumulative Layout Shift): <0.05 (current: <0.1)
- [ ] FID (First Input Delay): <50ms
- [ ] Time to Interactive: <3.0s

### Conversion & Revenue Success
- [ ] Conversion rate: +15% (conservative estimate)
- [ ] Monthly revenue: $50K → $57.5K (conservative)
- [ ] Optimistic: $50K → $72.5K (40% improvement)

---

## Financial Projection

### Investment Summary

| Component | Effort | Cost | Timeline |
|-----------|--------|------|----------|
| Design System (Figma + Storybook) | 160 hrs | $5,000 | Weeks 1-4 |
| Frontend Migration (Dashboard + Components) | 192 hrs | $10,000 | Weeks 5-8 |
| Gamification Integration | 80 hrs | $3,000 | Concurrent |
| Accessibility + QA | 64 hrs | $2,000 | Weeks 9-12 |
| **Total** | **576 hrs** | **$20,000** | **12 weeks** |

**Hourly Rate:** $125/hour (mid-level engineers)
**Team Size:** 1 designer + 2 frontend engineers + 1 QA
**Contingency:** +1 week buffer included

### Expected ROI

**Conservative Scenario (25% improvement):**
- Current: 500 MAU, 10% conversion, $50K/month revenue
- After redesign: 625 MAU (+25%), 11.5% conversion (+15%), $72.5K/month
- **Net gain:** +$22.5K/month = **$270K/year**
- **ROI:** **13.5x** on $20K investment
- **Break-even:** 2 weeks

**Optimistic Scenario (40% improvement):**
- After redesign: 700 MAU (+40%), 13% conversion (+30%), $91K/month
- **Net gain:** +$41K/month = **$492K/year**
- **ROI:** **24.6x** on $20K investment
- **Break-even:** 2 weeks

---

## References

### Design Documents
- [UX_DESIGN_ASSESSMENT.md](../../../UX_DESIGN_ASSESSMENT.md) — Complete audit (50 KB)
- [DESIGN_VISUAL_DIRECTION.md](../../../DESIGN_VISUAL_DIRECTION.md) — Visual specs (26 KB)
- [IMPLEMENTATION_CHECKLIST.md](../../../IMPLEMENTATION_CHECKLIST.md) — Week-by-week tasks (20 KB)
- [DESIGN_SUMMARY.md](../../../DESIGN_SUMMARY.md) — Executive summary (13 KB)
- [COMPONENT_SPECS.md](../../../COMPONENT_SPECS.md) — Component specs (12 KB)

### Dependencies & Previous Work
- CRÍTICO-1 (Git history cleanup) ✅ COMPLETED
- CRÍTICO-2 (RLS implementation) ✅ COMPLETED
- CRÍTICO-3 (Kiwify webhook) ⏳ PENDING

### Technology Stack
- **Frontend:** Next.js 15+, React 19+, Tailwind CSS 4+
- **Design:** Figma (cloud)
- **Documentation:** Storybook 7+
- **Animation:** Framer Motion 10+
- **Testing:** Jest 29+, Playwright 1.40+
- **Styling:** shadcn/ui + custom components

### Competitive Analysis Referenced
- Coursera: 7/10 design, 5/10 gamification
- LinkedIn Learning: 8/10 design, 7/10 gamification
- Duolingo: 9/10 design, 10/10 gamification
- **Target:** Scopsy 8/10 design, 8/10 gamification (professional focus)

---

## Next Steps

### Immediate (This Week)
1. [ ] Review story with @ux-design-expert and @dev
2. [ ] Approve timeline and budget
3. [ ] Allocate team resources
4. [ ] Schedule kickoff meeting

### Week 1
1. [ ] Kickoff meeting (team + stakeholders)
2. [ ] Setup Figma workspace
3. [ ] Begin design system in Figma
4. [ ] Create GitHub project for tracking

### Ongoing
1. [ ] Weekly sprints (12 weeks)
2. [ ] Bi-weekly design reviews
3. [ ] Monthly stakeholder updates
4. [ ] Daily standup (team sync)

---

## Messaging for Stakeholders

### For Internal Team
> "We're rebuilding Scopsy's design to compete with 2025-2026 standards. Our focus: mobile-first responsiveness, professional gamification, and clinical specificity. This 12-week effort will position us as the #1 psychology training platform by design quality."

### For Users
> "Fresh design, sharper training. Scopsy v3.0 features a beautiful new interface, gamification that respects your professionalism, and powerful new badges to showcase your clinical mastery."

### For Press/Marketing
> "Scopsy introduces next-generation UX for clinical psychology training. Combining modern design principles with evidence-based gamification, Scopsy sets new standards for professional healthcare e-learning."

---

**Status:** Ready for Dev Assignment ✅

Próximo passo: @ux-design-expert inicia Wave 1 (Design System Foundation).
