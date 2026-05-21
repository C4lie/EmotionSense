# EmotionSense AI — API Reference

## Base URL
- Development: `http://localhost:8000`
- Production: `https://your-api.render.com`

## Authentication
All protected routes require a Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_access_token>
```

---

## Auth Endpoints

### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "access_token": "jwt_token",
  "token_type": "bearer"
}
```

---

### POST /api/auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response 200:**
```json
{
  "id": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "access_token": "jwt_token",
  "token_type": "bearer"
}
```

---

### GET /api/auth/me
Get current authenticated user's profile.

**Headers:** `Authorization: Bearer <token>`

**Response 200:**
```json
{
  "id": "uuid",
  "name": "John Doe",
  "email": "john@example.com"
}
```

---

## Detection Endpoints

### POST /api/detect/image
Detect emotions from an uploaded image file.

**Request:** Multipart form-data
- `file`: Image file (JPEG/PNG/WEBP, max 10MB)

**Response 200:**
```json
{
  "success": true,
  "faces": [
    {
      "face_index": 0,
      "dominant_emotion": "happy",
      "confidence": 97.1,
      "box": {"x": 120, "y": 80, "width": 140, "height": 140},
      "emotion_scores": {
        "happy": 97.1,
        "sad": 0.3,
        "angry": 0.2,
        "neutral": 1.5,
        "fear": 0.4,
        "surprise": 0.3,
        "disgust": 0.2
      }
    }
  ],
  "processing_time_ms": 145.3
}
```

---

### POST /api/detect/video
Process an uploaded video file for emotion analysis.

**Request:** Multipart form-data
- `file`: Video file (MP4/MOV/WEBM, max 100MB)

**Response 200:**
```json
{
  "success": true,
  "session_id": "uuid",
  "dominant_emotion": "neutral",
  "average_confidence": 84.2,
  "timeline": [...],
  "processing_time_ms": 5200.0
}
```

---

## Session Endpoints

### GET /api/sessions
Get paginated list of past emotion sessions.

**Headers:** `Authorization: Bearer <token>`

**Query Params:** `page=1&size=10`

**Response 200:**
```json
{
  "total": 25,
  "page": 1,
  "size": 10,
  "sessions": [...]
}
```

### GET /api/sessions/{id}
Get detailed session with all emotion records.

### DELETE /api/sessions/{id}
Delete a specific session.

---

## Analytics Endpoints

### GET /api/analytics/dashboard
Get aggregated analytics data for authenticated user.

**Query Params:** `range=7d` (options: 7d, 30d)

**Response 200:**
```json
{
  "mood_score": 72.3,
  "total_sessions": 15,
  "most_frequent_emotion": "neutral",
  "emotion_distribution": {...},
  "mood_timeline": [...]
}
```

---

## WebSocket

### WS /ws/detect
Real-time emotion detection via WebSocket streaming.

**Connection:** `ws://localhost:8000/ws/detect?token=JWT_TOKEN&session_id=UUID`

**Client sends:**
```json
{"image": "base64_jpeg_data", "timestamp": "2026-01-01T00:00:00Z"}
```

**Server responds:**
```json
{
  "faces": [...],
  "fps": 8.2,
  "timestamp": "2026-01-01T00:00:00Z"
}
```

---

## Error Responses

All error responses follow this structure:
```json
{
  "success": false,
  "message": "Human-readable error message"
}
```

### Common HTTP Status Codes
- `400` Bad Request — Invalid input data
- `401` Unauthorized — Missing or invalid token
- `403` Forbidden — Insufficient permissions
- `404` Not Found — Resource does not exist
- `413` Payload Too Large — File exceeds size limit
- `422` Unprocessable Entity — Validation error
- `429` Too Many Requests — Rate limit exceeded
- `500` Internal Server Error — Unexpected server error
