# Golden Windows

> *"It's not enough to find when everyone CAN meet. Find when everyone can meet AND think clearly."*

Golden Windows is ClockAlign's algorithm for finding optimal meeting times by combining **availability** with **energy levels**. It answers the question: *"When is my distributed team simultaneously available AND cognitively sharp?"*

---

## The Problem Golden Windows Solves

Traditional scheduling tools ask: "When is everyone free?"

That's the wrong question. Consider:

- **Everyone is "free" at 6am UTC** — But half your team is asleep
- **Everyone is "free" at 2pm UTC** — But it's 10pm in Singapore
- **Everyone marked the same 1-hour window** — But one person is post-lunch-coma, another hasn't had coffee yet

Availability ≠ Productivity.

Golden Windows finds times when the team overlaps **and** everyone's brain is actually working.

---

## How It Works

### Step 1: Map Availability Windows

For each UTC hour (0-23), ClockAlign checks every participant:

1. **Convert to local time** — What hour is it in their timezone?
2. **Check availability** — Are they marked as available at that local hour?
3. **All-or-nothing** — If anyone is unavailable, the window is invalid

### Step 2: Calculate Energy Levels

For each valid window, we assess **sharpness** — how cognitively alert each participant is:

| Sharpness Level | Value | What It Means |
|-----------------|-------|---------------|
| 🔥 Peak | 90-100% | Maximum focus, flow state possible |
| ☀️ High | 70-89% | Sharp, effective, engaged |
| 🌤️ Moderate | 50-69% | Functional but not optimal |
| 🌙 Low | 30-49% | Sluggish, easily distracted |
| 😴 Very Low | 0-29% | Zombie mode, should be sleeping |

Sharpness values come from each user's **energy curve** — a 24-hour profile of their personal productivity rhythm.

### Step 3: Compute the Golden Score

The **Golden Score** (0-100) combines everyone's sharpness:

```
Golden Score = Average Sharpness × 100
```

A Golden Score of 85 means the team averages 85% sharpness at that hour.

### Step 4: Calculate Quality Score (Advanced)

For ranking time slots, we use a more nuanced **Quality Score** that considers:

| Component | Weight | Why It Matters |
|-----------|--------|----------------|
| Average Sharpness | 40% | Overall team energy |
| Minimum Sharpness | 30% | Weakest-link principle — one zombie drags everyone down |
| Availability Ratio | 20% | Penalize times when not everyone can attend |
| Evenness | 10% | Prefer even distribution over one person at peak + others struggling |

**Formula:**
```
Quality Score = (0.4 × AvgSharpness + 0.3 × MinSharpness + 0.2 × AvailRatio + 0.1 × Evenness) × 100
```

If not everyone is available, a 70% penalty is applied — this isn't just a bad window, it's an invalid one.

---

## Energy Curves

### Default Energy Curve

ClockAlign's default is based on circadian rhythm research:

```
Hour  | Sharpness
------|-----------
 0-4  | 15-20%   (asleep)
 5-7  | 35-70%   (waking up)
 8-9  | 85-90%   (morning peak)
10-11 | 95%      (maximum focus)
12    | 85%      (pre-lunch)
13    | 65%      (post-lunch dip)
14-16 | 70-85%   (afternoon recovery)
17-18 | 65-75%   (winding down)
19-21 | 35-55%   (evening)
22-23 | 25-30%   (pre-sleep)
```

### Chronotypes

Users can select a **chronotype** to shift their curve:

**🌅 Early Bird:**
- Peak: 6-10am
- Sharp: morning to early afternoon
- Crashes: after 6pm

**🕐 Normal:**
- Peak: 10am-12pm
- Sharp: 8am-5pm
- Post-lunch dip at 1pm

**🦉 Night Owl:**
- Peak: 4-7pm
- Sharp: afternoon and evening
- Struggles: before 10am

### Custom Energy Curves

Power users can define their exact sharpness per hour:

```json
{
  "0": 0.20, "1": 0.15, "2": 0.15, ...,
  "10": 0.95, "11": 0.95, ...,
  "22": 0.30, "23": 0.25
}
```

This accounts for individual variations — some people ARE sharp at midnight, and that's valid!

---

## The Heatmap Visualization

The **Golden Windows Heatmap** is a 24-hour × N-participants grid showing:

### Reading the Heatmap

- **Rows** = Participants (with their timezone offset)
- **Columns** = UTC hours (0-23)
- **Cell color** = Energy level at that hour
  - 🟢 Green = High energy (70%+)
  - 🟡 Yellow = Moderate (50-70%)
  - 🟠 Orange = Low (30-50%)
  - 🔴 Red = Very low (<30%)
  - ⬜ Gray = Unavailable

### The Combined Row

At the bottom, the **Golden Score** row shows the team-wide score for each hour:

- Numbers = Score (only shown if everyone is available)
- "—" = Someone is unavailable
- Highlighted cells = Best meeting times

### Tooltip Details

Hover over any cell to see:
- Local time for that participant
- Exact sharpness percentage
- Availability status

---

## Best Times Ranking

ClockAlign ranks time slots by Quality Score:

### Recommendation Tiers

| Tier | Quality Score | Meaning |
|------|---------------|---------|
| ⭐ **Excellent** | 80%+ | Peak alignment — schedule this! |
| 👍 **Good** | 65-79% | Solid choice, everyone's decent |
| ✅ **Acceptable** | 50-64% | Workable, but someone's not at their best |
| ⚠️ **Poor** | <50% | Consider async instead |

### Best Times Summary

The Best Times panel shows:
1. **Rank** — 🥇🥈🥉 and beyond
2. **UTC Time** — The slot in UTC
3. **Quality Score** — The combined score
4. **Summary** — Human-readable description
5. **Per-participant breakdown** — Local times and individual sharpness

---

## Real-World Examples

### Example 1: US + Europe Team

**Participants:**
- Alice: San Francisco (UTC-8)
- Bob: New York (UTC-5)
- Carol: London (UTC+0)
- Dave: Berlin (UTC+1)

**Best Windows Found:**

| Rank | UTC | SF | NYC | London | Berlin | Score |
|------|-----|-----|-----|--------|--------|-------|
| 🥇 | 3pm | 7am | 10am | 3pm | 4pm | 82% |
| 🥈 | 4pm | 8am | 11am | 4pm | 5pm | 78% |
| 🥉 | 2pm | 6am | 9am | 2pm | 3pm | 71% |

The 3pm UTC window works because:
- SF: Early but sharp (7am = 70% sharpness)
- NYC: Peak productivity (10am = 95%)
- London/Berlin: Strong afternoon (85%)

### Example 2: Truly Global Team

**Participants:**
- Tokyo (UTC+9)
- Berlin (UTC+1)
- São Paulo (UTC-3)
- San Francisco (UTC-8)

**Challenge:** 17-hour spread between Tokyo and SF

**Best Windows:** Only 2 hours where everyone scores above 50%

**Result:** ClockAlign recommends async-first, with optional sync windows at:
- 1am UTC (9am Tokyo, 2am Berlin ❌)
- 11pm UTC (8am Tokyo, midnight Berlin ⚠️)

When golden windows barely exist, that's valuable information too.

---

## Using Golden Windows Effectively

### For Scheduling New Meetings

1. Enter all participants
2. View the heatmap — see the full picture
3. Check the ranked recommendations
4. Pick from the top 3 (or go async if scores are low)
5. Note the Quality Score in your invite

### For Evaluating Existing Meetings

1. Check when your recurring meetings happen
2. See each participant's sharpness at that time
3. If Golden Score is <60%, consider moving it
4. Use the leaderboard to see who's consistently in low-energy slots

### For Team Planning

1. Share the heatmap with your team
2. Identify your "golden overlap zone" — maybe it's only 2 hours
3. Protect those hours for synchronous collaboration
4. Move everything else to async

---

## Edge Cases

**Q: What if there are NO valid windows?**

A: ClockAlign will show all windows with availability issues. This is valuable data — it means your team cannot reasonably meet synchronously without someone sacrificing.

**Q: What about DST changes?**

A: ClockAlign uses timezone-aware calculations. When DST shifts, your windows shift too. Check after time changes!

**Q: Can I weight some participants higher?**

A: Not currently. The algorithm treats all participants equally. (Future feature?)

**Q: What about calendar integration?**

A: Coming soon! We'll overlay actual calendar free/busy on top of preference-based availability.

---

## Technical Reference

### API Endpoint

```
GET /api/golden-windows?teamId=...
GET /api/golden-windows?participants=id1,id2,id3
```

**Response includes:**
- `heatmap` — Full 24-hour × N-participant grid
- `bestTimes` — Ranked time slots
- `stats` — Summary statistics

### Algorithm Parameters

```typescript
{
  topN: 5,              // Number of recommendations
  requireAllAvailable: true,  // Strict availability
  minQualityScore: 0,   // Minimum threshold
  referenceDate: DateTime  // Date for DST calculations
}
```

---

## The Philosophy

Golden Windows is built on three principles:

1. **Energy > Availability** — A zombie attendee is worse than a missing one
2. **Fairness through visibility** — See who's always in their low-energy hours
3. **Async-first mindset** — If no golden window exists, that's the answer: don't force sync

The goal isn't to make bad times good. It's to find the genuinely good times — or acknowledge when they don't exist.

---

*Previous: [← Sacrifice Score](./sacrifice-score.md)*

*Next: [API Documentation →](./api.md)*
