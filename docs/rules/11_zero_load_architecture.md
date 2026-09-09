# Rule 11: Ultra-Performance, Zero-Lag & Zero-DB-Load Architecture (Rule 21)

Across the entire platform—whether public link sharing, visitor geolocation, snaps capture, companion monitoring, live audio/video feeds, gallery access, or live movement tracking:

## 1. Zero Database Load for High-Frequency & Streaming Features
- **WebRTC Live Video, Live Audio-Only Listen-In, and 2-Way Walkie-Talkie**:
  - MUST operate strictly Peer-to-Peer (P2P) via STUN.
  - Zero media data, video frames, or audio buffers may ever be written to or proxied through PostgreSQL.
- **Live Movement Location Tracking**:
  - Continuous movement (3-second updates) MUST use ephemeral Supabase Realtime WebSocket broadcasts (`device-live:*`).
  - Never thrash PostgreSQL with high-frequency writes every few seconds.

## 2. Zero Client & Device Lag Guarantee
- **Audio-Only Listen-In Mode**:
  - MUST completely shut down camera sensors and preview threads on the child's phone.
  - Guarantees < 2% CPU usage, zero thermal throttling, and minimal battery consumption.
- **Android Background Threads**:
  - All background synchronization tasks on Android must use non-blocking background threads (`ScheduledExecutorService`).
  - Release wake locks immediately after task dispatch.
- **Client Web Performance**:
  - Lazy-load heavy data on-demand (loading contacts, gallery files, call logs, and messages only when their respective tab is clicked).

## 3. 100% Real Production Implementations (Anti-Dummy / Anti-Fake Rule)
- Absolutely zero mock, dummy, stub, or fake placeholder implementations.
- Every feature must be deeply analyzed, architecturally sound, end-to-end verified, and genuinely operational in production.
