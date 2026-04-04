# The Predator Intelligence System Overview

## 🏛️ Architecture: "Owned Power"
The system is built on an **Owned Power** philosophy. Instead of relying on expensive, latency-prone cloud services for everything, the "Live Predator" utilizes local high-performance hardware:
- **Storage**: [PGlite](https://github.com/electric-sql/pglite) for ephemeral, high-speed local SSD storage.
- **Compute**: Local NVIDIA RTX 5070 Ti for deep pattern learning and sentiment analysis.
- **Database**: Hybrid synchronization between local PGlite and cloud Firestore for state persistence.

## 🖐️ The 5 Pillars of Intelligence

### 1. Technical Pillar
Analyzes price action, volume, and multi-timeframe internals. It detects structural breaks and high-probability entry points.

### 2. Flow Pillar
Interprets real-time options premium (IV, Delta, Gamma) and institutional "Big Money" flow. It identifies where the smart money is positioning.

### 3. Sentiment Pillar
Mines news narratives, catalyst arcs, and social sentiment. It distinguishes between market "noise" and genuine sentiment shifts.

### 4. Behavioral Pillar
Tracks market psychology and "Emotional Flow." It detects "Bait & Manipulation" tactics and "Expectation vs. Shock" scenarios.

### 5. Macro Pillar
Correlates economic calendar events (CPI, FOMC, Jobs) with price action to anticipate volatility windows.

## 🔄 The Compounding Knowledge Loop
Insights from live trading are fed into a **Daily Compounding Loop**. After market close, the system enters a "Study Session" to relive historical days and refine its internal models for continuous autonomous evolution.

## 🛠️ Key Engines
- **Premium Mastery Engine**: Specialized in per-second options data.
- **Market Flow Intelligence**: Tracks institutional footprint.
- **Behavioral Gravity Engine**: Models the psychological pull of price levels.
- **Profit Compounding Manager**: Orchestrates capital allocation and risk management.
