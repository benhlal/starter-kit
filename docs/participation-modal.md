# Participation Modal & Token Economy

This document explains the Participation Modal styles and the token/coin economy used by the AR coin hunt events.

## Purpose

The Participation Modal is the UI users interact with to join an AR coin hunt. It shows event details, entry fees, prize pool numbers, available coins and their total token value, and actions for joining or leaving the event.

The token economy separates two concepts:

- Tokens: the platform currency. Used to pay entry fees, buy passes, and get rewards.
- Coins: AR collectibles placed in the world. Each coin has a `value` in tokens. When collected by users, the coin's token value reduces the event's remaining prize pool and increases the user's token balance.

## File location

`components/Events/ParticipationModal/ParticipationModal.styles.ts`

## Key rules (recommended defaults)

- `tokensRequired` — entry fee per participant (example: 30 tokens)
- `participants` — number of participants currently joined
- `entryTokens` = `participants * tokensRequired`
- `prizePoolShare` (default `0.7`) — fraction of entry tokens allocated to the prize pool
- `prizePoolBase` = `Math.round(entryTokens * prizePoolShare)`
- `platformMargin` = `entryTokens - prizePoolBase` (this is the platform's revenue from entries)
- `coinAllocationFactor` (default `0.8`) — fraction of `prizePoolBase` allocated as token values for collectible coins
- `coinTokenTotal` = `Math.round(prizePoolBase * coinAllocationFactor)`
- `tokensCollected` — tokens already redeemed from collected coins
- `coinTokenRemaining` = `coinTokenTotal - tokensCollected`
- `prizePoolRemaining` (current prize pool) = `prizePoolBase - tokensCollected`

Late fees (if applicable) are separate platform revenue and should NOT be included in `prizePoolBase`.

## UI fields to display in Participation Modal

- Entry fee (show `tokensRequired`)
- Participants (current count)
- Prize pool (base) — computed `prizePoolBase`
- Current prize pool — `prizePoolRemaining` (updates as coins are collected)
- Coins available — number of uncollected coins
- Total token value of available coins — `coinTokenRemaining`
- Tokens collected so far — `tokensCollected`
- (Admin only) Platform margin — `platformMargin`

## Example

Given `participants = 7`, `tokensRequired = 30`:

- `entryTokens = 7 * 30 = 210`
- `prizePoolBase (70%) = 147`
- `platformMargin = 63`
- `coinTokenTotal (80% of prizePoolBase) = 118` (rounded)
- If there are 8 coins, distribute values summing to 118, e.g. `[10,10,15,5,10,18,30,20]`
- `tokensCollected` decreases `coinTokenRemaining` and `prizePoolRemaining`

## Event data model (recommended fields)

- `tokensRequired: number` — per-player fee
- `participantsCount: number`
- `entryTokens: number`
- `prizePoolBase: number`
- `coinTokenTotal: number`
- `coinTokenRemaining: number`
- `tokensCollected: number`
- `platformMargin: number`

## Developer notes

- Compute economy numbers with a single util (server-side preferred) and store results on event creation to guarantee consistency between UI and server-state.
- When generating coins, ensure `sum(coin.value) === coinTokenTotal` to avoid rounding mismatches.
- Display both `prizePoolBase` and `prizePoolRemaining` in the modal so users and admins understand distribution and the effect of coin collection.

## Styling reference

The styles used by the modal live in
`components/Events/ParticipationModal/ParticipationModal.styles.ts` and include:

- `eventDetails`, `eventName`, `eventCategory`
- `prizeSection`, `prizeAmount`, `experienceBonus`
- `participationSection`, `feeRow`, `balanceRow`, `participantInfo`
- `huntDetails`, `detailRow`, `detailLabel`, `detailValue`
- `actionButtons`, `participateButton`, `unsubscribeButton`, `cancelButton`

See the source file for exact color codes and layout values.

## Next steps / recommended improvements

- Add a small server-side or backend util `computeEconomy(params)` to centralize calculations.
- Add `distributeCoinValues(target, count)` to deterministically distribute token totals across coins.
- Add an admin endpoint or dashboard view to show historical `tokensCollected` and `platformMargin` per event for audits.

---

Documentation added to repository.
