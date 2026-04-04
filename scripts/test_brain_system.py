import asyncio
import logging
from datetime import datetime
from typing import Dict, Any

# Local imports
try:
    from lib.brain.coordinator import BrainCoordinator
    from lib.brain.dispatchers import HTTPDispatcher, DecisionDispatcher
    from lib.brain.models import StrategicBrief, TradingDecision
except ImportError:
    import sys
    import os
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
    from lib.brain.coordinator import BrainCoordinator
    from lib.brain.dispatchers import HTTPDispatcher, DecisionDispatcher
    from lib.brain.models import StrategicBrief, TradingDecision

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("FullEndToEndTest")

async def run_coordinated_execution_cycle():
    """
    Demonstrates the full lifecycle:
    Schwab/TOS -> BrainCoordinator -> QuantVPS Execution Bot
    """

    print("\n" + "="*60)
    print("🚀 PREDATOR SYSTEM: COORDINATED EXECUTION DEMO")
    print("="*60)

    # 1. Initialize the QuantVPS Connection
    # This dispatcher pushes signals to your low-latency execution node in Chicago.
    vps_dispatcher = HTTPDispatcher(
        endpoint_url="http://quant-vps-chicago.local/v1/signals",
        api_key="quant_bot_secure_key_123"
    )

    # 2. Initialize the Brain Coordinator
    # Functional with local Qwen today, pre-wired for H200/Nemotron.
    brain = BrainCoordinator(
        local_base_url="http://localhost:11434/v1",
        local_model="qwen2.5:14b",
        quant_vps_dispatcher=vps_dispatcher, # Connect the execution layer
        market_open_time=datetime.now()
    )

    # ─────────────────────────────────────────────────────────────
    # [PHASE 1] DATA INPUT (From Schwab/TOS)
    # ─────────────────────────────────────────────────────────────
    
    mock_6_pillars = {
        "premium": "Market is in extreme discount zone (1.5 ATR below mean).",
        "levels": "S1 at $5,120, R1 at $5,155.",
        "momentum": "Squeeze firing bullish on 15m/30m timeframes.",
        "price_action": "Three-bar reversal pattern at daily lows.",
        "volume": "Deep call flow identified in SPX options chain.",
        "greeks": "Aggressive institutional buying at POC."
    }

    # ─────────────────────────────────────────────────────────────
    # [PHASE 2] STRATEGIC ANALYSIS (Nemotron-3-Nano)
    # ─────────────────────────────────────────────────────────────
    
    print("\n[BRAIN] Generating Strategic Battle Plan...")
    brief = await brain.generate_strategic_brief(
        pillar_data=mock_6_pillars,
        macro_context="Strong rejection of lows. Potential trend-reversal morning."
    )
    print(f"Strategic Bias: {brief.current_bias} | Guidance: {brief.guidance_for_tactical}")

    # ─────────────────────────────────────────────────────────────
    # [PHASE 3] TACTICAL EXECUTION + SIGNAL DISPATCH (Qwen -> QuantVPS)
    # ─────────────────────────────────────────────────────────────
    
    mock_live_feed = {
        "symbol": "SPY",
        "current_price": 512.40,
        "delta_change": "+1.2% in 2 minutes",
        "indicator_signals": "Bullish Squeeze Fired"
    }

    print("\n[BRAIN] Executing Tactical Scan...")
    
    # This method calls Qwen and automatically DISPATCHES the result to QuantVPS
    decision = await brain.get_trading_decision(
        current_market_data=mock_live_feed,
        auto_dispatch=True
    )

    print("\n" + "="*60)
    print(f"SIGNAL SOURCE:   {decision.model_source}")
    print(f"ACTION:          {decision.final_trade_direction} (Confidence: {decision.confidence}%)")
    print(f"THESIS:          {decision.autonomous_thesis}")
    print(f"ADVICE:          {decision.adjustment_advice}")
    print("="*60)
    print("✅ Logic complete. Signal pushed to QuantVPS Execution Layer.")

if __name__ == "__main__":
    asyncio.run(run_coordinated_execution_cycle())
