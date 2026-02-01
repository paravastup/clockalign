# The Sacrifice Score™

> *"If we can't eliminate bad meeting times, at least we can make them fair."*

The Sacrifice Score is ClockAlign's system for quantifying and tracking the "pain" of attending meetings at inconvenient times. It transforms an invisible burden into a visible metric, promoting fairness in distributed teams.

---

## Why Sacrifice Scores?

In global teams, someone always gets the short end of the stick:

- The person in Sydney joining the 8am SF standup... at 1am
- The engineer in Berlin dialing into the 5pm NYC sync... at 11pm
- The designer in Tokyo attending the "global all-hands"... during dinner

Without tracking, the same people silently absorb this pain. Sacrifice Scores make it visible, measurable, and actionable.

---

## How It Works

### The Core Algorithm

Every meeting time slot receives a **base pain weight** (1-10 points) based on what hour it is in the participant's local timezone:

| Time Category | Local Hours | Base Points | Impact Level |
|---------------|-------------|-------------|--------------|
| 🌟 **Golden** | 10 AM – 4 PM | 1 pt | Minimal |
| 👍 **Good** | 9-10 AM, 4-5 PM | 1.5 pts | Minimal |
| ✅ **Acceptable** | 8-9 AM, 5-6 PM | 2 pts | Low |
| 🌅 **Early Morning** | 7-8 AM | 3 pts | Medium |
| 🌆 **Evening** | 6-8 PM | 3 pts | Medium |
| 🏠 **Late Evening** | 8-9 PM | 4 pts | High |
| 🌙 **Night** | 9-10 PM | 5 pts | Severe |
| 😴 **Late Night** | 10-11 PM | 6 pts | Severe |
| 💀 **Graveyard** | 11 PM – 7 AM | 10 pts | Extreme |

### The Pain Weight Philosophy

These weights are designed based on:

1. **Circadian rhythm research** — When humans are cognitively sharpest
2. **Work-life balance impact** — Personal time, family time, sleep
3. **Career sustainability** — Graveyard shifts aren't just inconvenient, they're harmful

The jump to 10 points for graveyard hours isn't arbitrary — it reflects that waking up at 3am for a meeting is qualitatively different from a slightly-early 8am call.

---

## Score Multipliers

Base points are adjusted by several multipliers:

### Duration Multiplier

A 30-minute meeting is the baseline. Longer meetings hurt more:

| Duration | Multiplier |
|----------|------------|
| 30 min | ×1.0 |
| 45 min | ×1.5 |
| 60 min | ×2.0 |
| 90 min | ×3.0 |

### Recurring Meeting Multiplier

Recurring meetings get a **×1.5** multiplier. Why?

- A one-time 9pm meeting is annoying
- A WEEKLY 9pm meeting is a lifestyle change

The extra weight reflects the compounding impact.

### Organizer Discount

Meeting organizers get a **×0.8** discount (20% off). The logic:

- They chose the time, presumably after considering options
- They have some agency in the situation
- They're taking responsibility for the meeting existing

This is a small incentive to organize thoughtfully.

---

## The Full Formula

```
Sacrifice Score = Base Points × (Duration/30) × Recurring Multiplier × Organizer Multiplier
```

**Example:**

Sarah in London joins a recurring 1-hour meeting that's at 9pm her time:

- Base points: 5 (night category)
- Duration: ×2.0 (60 minutes)
- Recurring: ×1.5
- Organizer: ×1.0 (she's not the organizer)

**Score: 5 × 2.0 × 1.5 × 1.0 = 15 points**

That same meeting for someone in SF where it's 1pm:

- Base points: 1 (golden hours)
- Duration: ×2.0
- Recurring: ×1.5
- Organizer: ×1.0

**Score: 1 × 2.0 × 1.5 × 1.0 = 3 points**

Sarah is sacrificing 5× more than her SF colleague.

---

## The Leaderboard

Each team has a **Sacrifice Leaderboard** showing:

1. **Rankings** — Who's sacrificed the most (descending)
2. **Total points** — Cumulative sacrifice this period
3. **Trend indicators** — Is someone's sacrifice increasing or decreasing?
4. **Worst slot counts** — How many graveyard/late-night meetings each person has

### Fairness Alerts

ClockAlign automatically flags imbalances:

| Status | Threshold | Action |
|--------|-----------|--------|
| ✅ Balanced | Within average | All good! |
| ⚠️ Above Average | 1.3× average | Worth noting |
| 🔶 High Sacrifice | 2× average | Should rotate times |
| 🚨 Critical | 3× average | Urgent rebalancing needed |

When someone hits "critical," they've been silently carrying the team's timezone burden. Time to share the pain.

---

## Using Sacrifice Scores Effectively

### For Team Leads

1. **Check the leaderboard weekly** — Don't let imbalances grow
2. **Rotate recurring meetings** — If APAC took the hit this month, EMEA takes it next
3. **Use the data in retros** — "How can we reduce our total team sacrifice?"
4. **Celebrate fairness** — When scores are balanced, you're doing it right

### For Individual Contributors

1. **Know your score** — Don't silently suffer
2. **Bring data to discussions** — "I've absorbed 50% of the team's sacrifice this quarter"
3. **Propose alternatives** — "Can we rotate this standup time monthly?"
4. **Respect others' scores** — Before scheduling, check who's already sacrificing

### For Meeting Organizers

1. **Check the impact** — ClockAlign shows sacrifice scores before you send the invite
2. **Consider async** — High combined score? Maybe it's an email instead
3. **Spread the pain** — Don't always pick the time convenient for YOU
4. **Document the decision** — "We chose this time because it minimizes total sacrifice"

---

## Edge Cases & FAQs

**Q: What if someone prefers late-night meetings?**

A: ClockAlign uses your stated preferences. If you're a night owl and mark 9pm as "available," the score still applies — but you can customize your energy curve to reflect that you're actually productive then.

**Q: Do lunch hours count differently?**

A: Currently, 12-1pm is still "golden hours." Future versions may account for lunch preferences.

**Q: What about time off / holidays?**

A: Meetings scheduled during your marked unavailable time aren't scored — you shouldn't be attending them!

**Q: Can I see historical scores?**

A: Yes! The score history chart shows daily and cumulative trends over time.

---

## The Bigger Picture

Sacrifice Scores aren't about making people feel guilty. They're about:

- **Visibility** — You can't fix what you can't see
- **Fairness** — Distributing burden equitably
- **Sustainability** — Preventing burnout from chronic bad-time meetings
- **Culture** — Normalizing the conversation about timezone pain

The goal isn't zero sacrifice — that's impossible for global teams. The goal is **balanced sacrifice**: everyone chips in, no one drowns.

---

## Technical Reference

### API Endpoint

```
GET /api/sacrifice-score?type=user&userId=...
GET /api/sacrifice-score?type=team&teamId=...&days=30
GET /api/sacrifice-score?type=history&userId=...&days=90
```

### Database Schema

Scores are stored in the `sacrifice_scores` table with:
- `user_id` — Who earned this score
- `meeting_id` — Which meeting
- `points` — Calculated score
- `category` — Time category (golden, graveyard, etc.)
- `calculated_at` — When calculated

See [API Documentation](./api.md) for full details.

---

*Next: [Understanding Golden Windows →](./golden-windows.md)*
