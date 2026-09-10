---
phase: 3
plan: 1
wave: 1
depends_on:
  - "2.2"
files_modified:
  - "src/economy/economyState.ts"
  - "src/economy/useEconomy.ts"
  - "src/components/BlackMarketModal.tsx"
  - "src/components/MarketItemCard.tsx"
autonomous: true
user_setup: []

must_haves:
  truths:
    - "Matches calculate and award Kinetic Points (KP) based on WPM, accuracy, streaks, parries, and victory."
    - "Player KP balance and unlocked cosmetics persist across browser refreshes via localStorage."
    - "The Black Market interface allows purchasing and equipping phosphor palettes and soundboard packs with live previews."
  artifacts:
    - "src/economy/economyState.ts defines inventory catalog, pricing, and persistence helpers"
    - "src/economy/useEconomy.ts hook manages purchases, equip states, and balance updates"
    - "src/components/BlackMarketModal.tsx renders the retro terminal shopping interface"
---

# Plan 3.1: Kinetic Points (KP) Economy & The Black Market

<objective>
Implement the progression and economy systems: calculating Kinetic Points (KP) post-match, persisting player wallet and unlocks in localStorage, and providing The Black Market terminal storefront.

Purpose: Give players a compelling progression loop where performance directly unlocks aesthetic customizability.
Output: Economy state store, economy React hook, Black Market modal dialog, and market item preview card.
</objective>

<context>
Load for context:
- .gsd/SPEC.md
- src/styles/palettes.ts
- src/audio/soundboards.ts
</context>

<tasks>

<task type="auto">
  <name>Implement Economy State Model, KP Formula & LocalStorage Persistence</name>
  <files>src/economy/economyState.ts, src/economy/useEconomy.ts</files>
  <action>
    Build `economyState.ts` and `useEconomy.ts`:
    - Define catalog of cosmetics (Palettes, Soundboards, Trails, Signatures) with item IDs, KP costs, descriptions, and default unlock flags.
    - Implement KP calculation function: `wpm * 1.5 + accuracy * 2.0 + maxStreak * 3 + parries * 15 + (isWin ? 250 : 50)`.
    - Persist user wallet state (`balance`, `unlockedItemIds`, `equippedLoadout`) into `localStorage` under key `speedtype_economy_v1` with schema validation and fallback defaults.
    - Implement `buyItem(itemId)` and `equipItem(category, itemId)` actions with balance checks.
    AVOID: Unsanitized JSON parsing without schema validation; corrupted local storage must gracefully reset to factory defaults.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>Economy functions enforce valid transactions and cleanly persist to localStorage</done>
</task>

<task type="auto">
  <name>Build The Black Market Terminal Storefront & Live Preview</name>
  <files>src/components/BlackMarketModal.tsx, src/components/MarketItemCard.tsx</files>
  <action>
    Construct `BlackMarketModal.tsx`:
    - Retro hacker-terminal shopping layout with category tabs: `[PALETTES]`, `[SOUNDS]`, `[TRAILS]`, `[SIGNATURES]`.
    - Real-time KP balance display with animated counter ticker.
    Construct `MarketItemCard.tsx`:
    - Shows item name, price, equipped badge, or "PURCHASE" / "EQUIP" action buttons.
    - Live interactive preview area: clicking "Test Sound" plays a synthesized switch sample; hovering over palette previews colors in real time.
    - Keyboard accessible: Esc closes shop, Arrow keys or Tab navigates inventory.
    AVOID: Modal trapping bugs; ensure focus is returned to main viewport upon closing the shop.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>The Black Market displays full catalog, supports live previews, and manages purchases</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] TypeScript check succeeds with zero errors
- [ ] KP formula correctly computes match rewards
- [ ] Purchasing an item debits wallet and persists unlock across reloads
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
