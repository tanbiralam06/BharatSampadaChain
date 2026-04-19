# docs/

All documentation that is not a top-level project file.

## Structure

```
docs/
├── api/            — OpenAPI specification and auto-generated API reference
│   └── api.yaml    — Full OpenAPI 3.0 spec for all BSC endpoints
├── architecture/   — Architecture Decision Records (ADRs)
│   ├── ADR-001-hyperledger-fabric-over-public-chain.md
│   ├── ADR-002-zkp-off-chain-proof-generation.md
│   ├── ADR-003-postgresql-off-chain-index.md
│   └── ADR-004-four-separate-frontend-apps.md
├── diagrams/       — System diagrams
│   ├── system-overview.md          — Full system ASCII diagram
│   ├── zkp-proof-flow.md           — Sequence diagram: ZKP query lifecycle
│   ├── officer-investigation-flow.md — Sequence: officer opens a case
│   └── data-ingestion-flow.md      — Sequence: agency data → ledger → index
└── legal/
    ├── dpdpa-compliance.md         — DPDPA 2023 compliance analysis
    ├── pmla-alignment.md           — PMLA 2002 alignment notes
    └── evidence-act-admissibility.md — Section 65B admissibility research
```

## Architecture Decision Records

Every significant design decision is documented as an ADR. Format:

```markdown
# ADR-XXX: Title

**Status:** Accepted / Proposed / Deprecated
**Date:** YYYY-MM-DD

## Context
What problem were we solving?

## Decision
What did we decide?

## Consequences
What are the trade-offs?
```

ADRs are never deleted. If a decision is reversed, the old ADR is marked Deprecated and a new ADR explains the change.

## Diagrams

All diagrams are written in Mermaid or ASCII — no binary image files. This means diagrams are readable in any text editor, diffable in git, and reviewable in pull requests.

## Legal Notes

These are research notes, not legal advice. Any institution deploying BSC with real citizen data must obtain independent legal review before going live.
