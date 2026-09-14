# Matchday Decision Desk

A focused product concept for a World Cup audience: compare curated match
scenarios, understand prediction uncertainty, and build a three-match watchlist.

## Why this shape

The interface makes the model's inputs and counterfactors visible instead of
presenting a prediction as certainty. It uses illustrative, curated scenarios —
not live fixtures, odds, personal data, or betting advice.

## Human and agent interface

The ordinary accessible UI and eight WebMCP tools call the same deterministic
domain functions:

1. `get_matchday_overview`
2. `list_matches`
3. `get_match_details`
4. `compare_teams`
5. `explain_prediction`
6. `assess_upset_risk`
7. `set_fan_preferences`
8. `build_match_shortlist`

The first six are read-only. The final two change session-only, reversible UI
state. There are no network calls, secrets, accounts, purchases, analytics, or
cross-origin tool exposure.

WebMCP is progressive enhancement through the current `document.modelContext`
API. The human experience remains complete in browsers where it is unavailable.

## Run locally

```bash
npm test
npm run serve
```

Then open `http://localhost:4173`.

## Test scope

Tests assert the exact tool count, schema/annotation hygiene, registration,
bounded output, happy paths, malformed input, prompt-injection-shaped input,
duplicate/oversized lists, state safety, and cancellation.
