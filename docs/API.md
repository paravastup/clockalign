# ClockAlign API Reference

All API endpoints require authentication via Supabase session cookies.

## Base URL

- Development: `http://localhost:3000/api`
- Production: `https://your-domain.com/api`

---

## Authentication

All endpoints require a valid Supabase session. Include the session cookie with each request.

### Errors

| Status | Description |
|--------|-------------|
| 401 | Unauthorized - No valid session |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 500 | Server Error - Internal error |

---

## Meetings

### List Meetings

```http
GET /api/meetings
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| teamId | string | Filter by team ID (optional) |
| limit | number | Max results (default: 20) |

**Response:**

```json
{
  "meetings": [
    {
      "id": "uuid",
      "title": "Weekly Standup",
      "description": "Team sync",
      "duration_minutes": 30,
      "meeting_type": "standup",
      "is_recurring": true,
      "created_at": "2025-01-30T10:00:00Z",
      "organizer": { "id": "uuid", "name": "John", "email": "john@example.com" },
      "team": { "id": "uuid", "name": "Engineering" },
      "meeting_slots": [...],
      "meeting_participants": [...]
    }
  ]
}
```

### Create Meeting

```http
POST /api/meetings
```

**Request Body:**

```json
{
  "title": "Weekly Standup",
  "description": "Team sync meeting",
  "duration": 30,
  "meetingType": "standup",
  "teamId": "uuid",
  "participants": [
    { "email": "jane@example.com", "name": "Jane" }
  ],
  "isRecurring": true,
  "selectedSlot": {
    "utcHour": 14,
    "goldenScore": 85
  }
}
```

**Response:**

```json
{
  "meeting": {
    "id": "uuid",
    "title": "Weekly Standup"
  },
  "message": "Meeting created successfully"
}
```

---

## Teams

### List Teams

```http
GET /api/teams
```

**Response:**

```json
{
  "teams": [
    {
      "id": "uuid",
      "name": "Engineering",
      "slug": "engineering",
      "role": "owner",
      "member_count": 5,
      "created_at": "2025-01-30T10:00:00Z"
    }
  ]
}
```

### Create Team

```http
POST /api/teams
```

**Request Body:**

```json
{
  "name": "Engineering",
  "slug": "engineering"
}
```

**Response:**

```json
{
  "team": {
    "id": "uuid",
    "name": "Engineering",
    "slug": "engineering"
  }
}
```

### Get Team Details

```http
GET /api/teams/[id]
```

**Response:**

```json
{
  "team": {
    "id": "uuid",
    "name": "Engineering",
    "slug": "engineering",
    "created_at": "2025-01-30T10:00:00Z"
  },
  "members": [
    {
      "id": "uuid",
      "name": "John",
      "email": "john@example.com",
      "timezone": "America/New_York",
      "role": "owner"
    }
  ],
  "role": "owner"
}
```

### Create Invite

```http
POST /api/teams/[id]/invite
```

**Request Body:**

```json
{
  "email": "jane@example.com"
}
```

**Response:**

```json
{
  "invite": {
    "id": "uuid",
    "code": "ABC123",
    "email": "jane@example.com",
    "expires_at": "2025-02-06T10:00:00Z"
  }
}
```

---

## Golden Windows

### Find Optimal Times

```http
GET /api/golden-windows
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| teamId | string | Team to analyze |
| participantIds | string | Comma-separated user IDs |
| date | string | Reference date (ISO format) |
| topN | number | Number of results (default: 5) |
| requireAllAvailable | boolean | Only times when all available (default: true) |
| minQualityScore | number | Minimum quality threshold (default: 0) |
| includeHeatmap | boolean | Include heatmap data |
| includeRanges | boolean | Include time ranges |

**Response:**

```json
{
  "bestTimes": [
    {
      "rank": 1,
      "utcHour": 14,
      "utcStartFormatted": "14:00 UTC",
      "goldenScore": 85,
      "qualityScore": 82,
      "recommendation": "excellent",
      "summary": "Peak energy alignment (85% avg sharpness)",
      "allAvailable": true,
      "participants": [
        {
          "id": "uuid",
          "name": "John",
          "timezone": "America/New_York",
          "localHour": 9,
          "localTimeFormatted": "9 AM",
          "sharpness": 90,
          "isAvailable": true
        }
      ]
    }
  ],
  "participantCount": 3,
  "timezones": ["America/New_York", "Europe/London", "Asia/Tokyo"],
  "heatmap": { ... },
  "timeRanges": [ ... ]
}
```

---

## Sacrifice Score

### Get Scores

```http
GET /api/sacrifice-score
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| type | string | `user`, `team`, `meeting`, or `history` |
| teamId | string | Team ID (for team type) |
| meetingId | string | Meeting ID (for meeting type) |
| days | number | History period (default: 30) |

**Response (team type):**

```json
{
  "team": { "id": "uuid", "name": "Engineering" },
  "period": { "days": 30, "startDate": "2025-01-01" },
  "stats": {
    "totalPoints": 150,
    "averagePerMember": 30,
    "memberCount": 5,
    "meetingCount": 20
  },
  "leaderboard": [
    {
      "rank": 1,
      "userId": "uuid",
      "userName": "John",
      "userEmail": "john@example.com",
      "timezone": "Asia/Tokyo",
      "totalPoints": 45,
      "meetingCount": 8,
      "averagePerMeeting": 5.6,
      "worstSlotCount": {
        "graveyard": 2,
        "lateNight": 1,
        "night": 0,
        "earlyMorning": 3
      },
      "trend": "up",
      "trendPercent": 15,
      "percentOfTotal": 30,
      "fairnessStatus": "high_sacrifice"
    }
  ],
  "fairnessAlerts": [
    {
      "userId": "uuid",
      "userName": "John",
      "status": "high_sacrifice",
      "multiplierVsAverage": 1.5
    }
  ]
}
```

### Calculate Score

```http
POST /api/sacrifice-score/calculate
```

**Request Body:**

```json
{
  "meetingId": "uuid",
  "participantId": "uuid",
  "localHour": 22,
  "durationMinutes": 60,
  "isRecurring": true
}
```

**Response:**

```json
{
  "points": 9,
  "basePoints": 6,
  "category": "late_night",
  "impactLevel": "severe",
  "multipliers": {
    "duration": 2,
    "recurring": 1.5,
    "organizer": 1,
    "custom": 1,
    "total": 3
  },
  "breakdown": "Base: 6 pts (late_night) → Duration: ×2.0 (60 min) → Recurring: ×1.5"
}
```

---

## Async Nudge

### Get Stats

```http
GET /api/async-nudge/stats
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| teamId | string | Filter by team |
| userId | string | Filter by user |
| days | number | Period (default: 30) |

**Response:**

```json
{
  "totalHoursReclaimed": 12.5,
  "meetingsConverted": 8,
  "averageHoursPerMeeting": 1.6,
  "byType": {
    "loom": { "count": 3, "hours": 4.5 },
    "doc": { "count": 2, "hours": 3.0 },
    "slack": { "count": 3, "hours": 5.0 }
  },
  "trend": "up",
  "trendPercent": 25
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "details": "Additional details (if available)",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `AUTH_ERROR` | Authentication failed |
| `VALIDATION_ERROR` | Invalid input |
| `NOT_FOUND` | Resource not found |
| `PERMISSION_DENIED` | Insufficient permissions |
| `RATE_LIMIT` | Too many requests |
| `INTERNAL_ERROR` | Server error |
