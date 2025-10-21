# Demo Data Population Guide

## Overview

The AR Coin Hunt demo data population script creates realistic test data for development and testing. It generates:

- **20 demo users** with realistic profiles and token balances
- **8 AR coin hunt events** across various real-world locations
- **64-192 virtual coins** distributed across events with realistic collection patterns
- **Calculated prize pools** based on participant entry fees and collected tokens

## Token Economy System

### How It Works

**Real Money → In-Game Tokens → Virtual Coins**

1. **Token Purchase**: Users buy tokens with real money

   - Minimum: **10€ = 10 tokens** - UPDATED
   - Tokens are the in-game currency

2. **Event Entry**: Users spend tokens to join events

   - Minimum entry: **10 tokens** - UPDATED
   - Higher entry fees create more valuable prize pools

3. **Coin Generation**: Entry fees create virtual coins to collect

   - **Flexible distribution**: Coins with varying token values (5-50 tokens each)
   - **Total value scales**: Higher entry fees = more coins and higher total token value
   - **Example**: 10 token entry might create 3 coins worth 5, 15, 20 tokens (total 40 tokens)

4. **Prize Pool**: All entry fees + collected token values
   - Entry fees × 1.5 bonus multiplier + collected tokens

### Profit Generation

The system generates profit through coin generation:

- User pays 10€ for 10 tokens
- User spends 10 tokens to join event
- System generates 5 virtual coins worth the prize pool
- **Result: 5 token profit per user** (50% profit margin)

## Prize Calculation Logic

### Formula

```
Prize Pool = (Participants × Entry Fee × Bonus Multiplier) + Collected Tokens

Where:
- Entry Fee = Variable (10, 20, 30, 40 tokens) - UPDATED
- Bonus Multiplier = 1.5x (organizer bonus)
- Collected Tokens = Sum of all coin values collected during the event
- Coin Generation = Flexible distribution of token values across 3-8 coins
```

### Example Calculations

**Standard Event (5 participants, 10 token entry):**

- Entry Fees: 5 × 10 = 50 tokens
- Coin Distribution: 3 coins worth 5, 15, 20 tokens (total 40 tokens)
- Bonus: 50 × 1.5 = 75 tokens
- Collected Tokens: 25 tokens (collected the 5-token coin)
- **Total Prize Pool: 75 + 25 = 100 tokens**

**Premium Event (8 participants, 30 token entry):**

- Entry Fees: 8 × 30 = 240 tokens
- Coin Distribution: 5 coins with varying values (total ~150 tokens)
- Bonus: 240 × 1.5 = 360 tokens
- Collected Tokens: 95 tokens (partial collection)
- **Total Prize Pool: 360 + 95 = 455 tokens**

## Running the Demo Data Script

### Option 1: Firebase Admin SDK (Recommended for Production Data)

1. **Install Firebase Admin SDK:**

   ```bash
   npm install firebase-admin
   ```

2. **Set up Firebase Service Account:**

   - Go to Firebase Console → Project Settings → Service Accounts
   - Generate new private key → Download JSON file
   - Save as `firebase-admin-key.json` in project root

3. **Set Environment Variables:**

   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="firebase-admin-key.json"
   export FIREBASE_PROJECT_ID="your-project-id"
   ```

4. **Run the Script:**
   ```bash
   node scripts/populate-demo-data.js
   ```

### Option 2: In-App Data Population (For Development)

Create a development screen or button that calls this function:

```typescript
import { FirebaseService } from "../services/firebase/FirebaseService";

async function populateDemoData() {
  // Implementation of the demo data creation logic
  // using FirebaseService methods instead of Admin SDK
}
```

## Demo Data Structure

### Events Distribution

- **40% Active**: Currently running with partial coin collection
- **30% Upcoming**: Scheduled for future dates
- **30% Completed**: Finished with full coin collection stats

### Coin Distribution

- **8-32 virtual coins per event** based on entry fee level
- **Coin values**: 5-25 tokens each
- **Rarity**: 80% common, 20% rare
- **Collection rates**:
  - Completed events: 70% coins collected
  - Active events: 40% coins collected

### Entry Fee Distribution

- **70% Standard Events**: 10 token entry (3-5 coins, flexible values)
- **20% Premium Events**: 20-30 token entry (4-6 coins, higher values)
- **10% High-Roller Events**: 40 token entry (6-8 coins, premium values)

### User Participation

- **2-8 participants per event**
- **Realistic user profiles** with varying levels and token balances
- **Participation history** and collected coin tracking

## Interactive Features

### Real-time Updates

- **Coin collection** updates prize pools dynamically
- **Participant joins** increase prize pools
- **Event status changes** affect availability

### Realistic Scenarios

- **GPS-based coin placement** around real locations
- **Time-based event progression**
- **Social interaction simulation**

## Testing Scenarios

### Event Card Display

- Verify prize pools show correct calculations
- Check remaining coins count for ongoing events
- Test participant count updates

### Coin Collection Flow

- Test GPS accuracy and coin discovery
- Verify collection updates user balances
- Check real-time prize pool adjustments

### Participation System

- Test join/leave functionality
- Verify fee calculations and refunds
- Check participant limit enforcement

## Customization Options

### Adjust Demo Parameters

Modify `DEMO_CONFIG` in the script:

### Adjust Demo Parameters

Modify `DEMO_CONFIG` in the script:

```javascript
const DEMO_CONFIG = {
  TOTAL_EVENTS: 8, // Number of events to create
  TOTAL_USERS: 20, // Number of demo users
  BASE_ENTRY_FEE: 10, // Minimum tokens to join (10€ = 10 tokens) - UPDATED
  LATE_FEE_PENALTY: 10,
  BONUS_MULTIPLIER: 1.5,
  COINS_PER_EVENT: { min: 3, max: 8 }, // UPDATED: Flexible coin count based on entry fee
  PARTICIPANTS_PER_EVENT: { min: 2, max: 8 },
  COIN_VALUE_RANGE: { min: 5, max: 50 }, // UPDATED: Higher max for valuable coins
  TOKENS_TO_COINS_RATIO: 5 / 10, // Base ratio, but flexible based on coin values - UPDATED
};
```

### Location Customization

Add new locations to `HUNT_LOCATIONS`:

```javascript
{
  name: "Your Location",
  coords: { latitude: 40.7128, longitude: -74.0060 },
  description: "Description of the area",
  terrain: "Urban", // Urban, Park, Beach, Mountain, etc.
  difficulty: "Easy", // Easy, Medium, Hard
}
```

## Data Cleanup

To clear demo data:

```javascript
// Clear all collections
await FirebaseService.clearCollection("events");
await FirebaseService.clearCollection("coins");
await FirebaseService.clearCollection("users");
```

## Token Economy Benefits

### For Users

- **Fair Play**: Higher entry fees create more valuable events
- **Strategy**: Choose entry level based on risk tolerance
- **Rewards**: Better prizes attract more participants

### For Platform

- **Profit Generation**: 60% margin on coin generation
- **Scalability**: More participants = more revenue
- **Engagement**: Premium events drive competition

### Business Model

- **Revenue Streams**: Token sales + platform fees
- **Growth Potential**: Viral mechanics through competition
- **Monetization**: Premium features and high-stakes events
- **Profit Margin**: 50% on token economy (entry fees create prize pools)
- **Coin Value Strategy**: High-value coins create excitement and competition
- **Profit Margin**: 50% on coin generation (10 tokens → 5 coins)

## Production Considerations

### Data Scaling

- **Batch operations** for large datasets
- **Indexing strategy** for query performance
- **Data pagination** for large result sets

### Security

- **Access controls** for demo vs production data
- **Data validation** before insertion
- **Audit logging** for data changes

### Performance

- **Background processing** for data generation
- **Progressive loading** for large datasets
- **Caching strategy** for frequently accessed data

## Troubleshooting

### Common Issues

**Firebase Authentication Errors:**

- Verify service account key is correct
- Check Firebase project permissions
- Ensure proper environment variables

**Data Validation Errors:**

- Check coordinate formats
- Verify required fields are present
- Ensure data type consistency

**Performance Issues:**

- Reduce batch sizes for large operations
- Implement progress indicators
- Add error recovery mechanisms

## Next Steps

1. **Run the demo data script** with proper Firebase credentials
2. **Test the app** with realistic data scenarios
3. **Verify prize calculations** match expected logic
4. **Tune parameters** based on testing feedback
5. **Document findings** for production deployment

This demo data provides a solid foundation for testing AR Coin Hunt functionality with realistic, interactive scenarios that closely mimic production usage patterns.
