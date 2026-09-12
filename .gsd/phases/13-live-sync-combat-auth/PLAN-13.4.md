---
phase: 13
plan: 4
wave: 2
depends_on:
  - "13.1"
files_modified:
  - src/components/BlackMarketModal.tsx
  - src/components/MarketItemCard.tsx
  - src/economy/useEconomy.ts
autonomous: true
must_haves:
  truths:
    - "Purchasing a theme palette in the Black Market automatically equips it immediately and shifts the viewport colors"
    - "Purchasing an item pops up an intuitive confirmation and theme preview banner/selector"
    - "Purchasing soundboards, trails, or signatures auto-equips the purchased item instantly"
    - "The full platform feels tightly connected, intuitive, and cohesive without dead ends"
  artifacts:
    - "src/components/BlackMarketModal.tsx with auto-equip logic and theme switcher popup"
    - "src/components/MarketItemCard.tsx with immediate purchase-to-equipped transition"
    - "src/economy/useEconomy.ts with helper to buy and equip in a single atomic transaction"
---

# Plan 13.4: Marketplace Theme Auto-Equip & Connected UX Flows

<objective>
Make the Black Market and cosmetic system feel intuitive, instant, and connected.
1. When a user buys a new theme palette in the Black Market, immediately auto-equip it and apply the color shift across the viewport in real-time.
2. Pop up a vibrant "THEME EQUIPPED" confirmation banner and quick palette preview selector inside the Black Market modal so the user immediately sees the theme in action.
3. Automatically equip other purchased cosmetic categories (soundboards, typing trails, ASCII KO signatures) upon purchase as well.
4. Update `useEconomy.ts` with an atomic `buyAndEquipItem` method so balance deduction, unlock, and equipping occur in one clean step.

Purpose: Deliver the intuitive, connected reward loop the user asked for: buying a theme immediately switches to it and opens the selector/preview without extra hunting.
Output: Instant cosmetic equipping, theme preview popup, and connected storefront flow.
</objective>

<context>
Load for context:
- src/components/BlackMarketModal.tsx
- src/components/MarketItemCard.tsx
- src/economy/useEconomy.ts
- src/economy/economyState.ts
</context>

<tasks>

<task type="auto">
  <name>Atomic buy-and-equip method in useEconomy hook</name>
  <files>src/economy/useEconomy.ts</files>
  <action>
    1. In `src/economy/useEconomy.ts`:
       - Add `buyAndEquipItem: (item: MarketItem) => boolean` method.
       - If player has enough balance, deduct KP, add `item.id` to `unlockedItemIds`, update `equipped[item.category] = item.id`, and save both state and unlocks to localStorage.
       - Return `true` on success, `false` if balance insufficient.
  </action>
  <verify>`npx tsc --noEmit` exits 0.</verify>
  <done>
    - `buyAndEquipItem` allows one-step transaction of unlocking and equipping.
  </done>
</task>

<task type="auto">
  <name>Auto-equip flow and theme preview popup in BlackMarketModal and MarketItemCard</name>
  <files>src/components/BlackMarketModal.tsx, src/components/MarketItemCard.tsx</files>
  <action>
    1. In `src/components/MarketItemCard.tsx`:
       - When `onBuy(item)` is triggered:
         - Automatically transition item to EQUIPPED state.
         - Play purchase haptic / keystroke sound.
    2. In `src/components/BlackMarketModal.tsx`:
       - When an item is bought:
         - Call `onEquip(item.category, item.id)`.
         - If `item.category === 'palette'`:
           - Show an interactive notification bar:
             "🎨 THEME EQUIPPED: [Theme Name] — Live Emissive Phosphor Activated"
             with quick preview buttons for all unlocked palettes.
         - If `item.category === 'soundboard'`:
           - Play a brief sound sample confirming activation.
  </action>
  <verify>`npx tsc --noEmit` exits 0.</verify>
  <done>
    - Buying any item immediately equips it.
    - Buying a theme palette immediately updates the screen colors and displays the theme switcher popup.
  </done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] Buying a theme in the Black Market immediately equips it and applies phosphor styling.
- [ ] Theme confirmation / preview banner appears after purchase.
- [ ] Soundboards, trails, and signatures auto-equip on purchase.
- [ ] `npx tsc --noEmit` exits 0.
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
