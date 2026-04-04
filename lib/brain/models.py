from datetime import datetime
from typing import List, Dict, Optional, Literal
from pydantic import BaseModel, Field

# ─────────────────────────────────────────────────────────────
# 1. STRATEGIC BRIEF (Output by Nemotron-3-Nano)
# ─────────────────────────────────────────────────────────────

class Scenario(BaseModel):
    name: str = Field(..., description="Name of the hypothetical scenario (e.g., 'Bull Trap', 'Breakout Confirmation')")
    probability: float = Field(..., ge=0, le=1, description="Probability of this scenario occurring (0.0 to 1.0)")
    trigger_condition: str = Field(..., description="Specific price action or signal that validates this scenario")

class StrategicBrief(BaseModel):
    """
    The output from the Strategic Thinker (Nemotron).
    Designed to provide high-level context and 'Rules of Engagement' for the Tactical Executor (Qwen).
    """
    current_bias: Literal["BULLISH", "BEARISH", "NEUTRAL"]
    bias_confidence: float = Field(..., ge=0, le=100)
    primary_thesis: str = Field(..., description="The main reasoning behind the current market bias")
    
    scenarios: List[Scenario] = Field(default_factory=list)
    
    # The 6 Pillars Analysis
    pillar_analysis: Dict[str, str] = Field(
        default_factory=lambda: {
            "premium_discount": "",
            "support_resistance": "",
            "momentum": "",
            "price_action": "",
            "volume": "",
            "poc_greeks_oi": ""
        },
        description="Brief strategic notes on each of the 6 core pillars"
    )
    
    manipulation_risks: List[str] = Field(default_factory=list, description="Specific traps or fakeouts identified")
    key_levels_to_watch: Dict[str, float] = Field(default_factory=dict, description="Crucial price levels (e.g., 'Target', 'Safety')")
    
    guidance_for_tactical: str = Field(..., description="Specific instructions for Qwen's real-time scans")
    timestamp: datetime = Field(default_factory=datetime.now)

# ─────────────────────────────────────────────────────────────
# 2. URGENT UPDATE (Sent from Qwen to Nemotron)
# ─────────────────────────────────────────────────────────────

class UrgentUpdate(BaseModel):
    """
    Feedback signal from the Tactical Executor (Qwen) when conditions shift dramatically
    between strategic breathing cycles.
    """
    reason: str = Field(..., description="Why is an urgent strategic rethink required?")
    market_shock_detected: str = Field(..., description="Description of the price/volume anomaly")
    priority: int = Field(default=3, ge=1, le=5, description="Priority level (1=Highest)")
    suggested_bias_shift: Optional[str] = None

# ─────────────────────────────────────────────────────────────
# 3. TRADING DECISION (Final Standardized JSON)
# ─────────────────────────────────────────────────────────────

class TradingDecision(BaseModel):
    """
    The final output schema. Both models must use this format so the execution bot 
    is agnostic to which model generated the signal.
    """
    autonomous_thesis: str = Field(..., description="High-level reasoning for this specific action")
    final_trade_direction: Literal["BUY", "SELL", "HOLD", "EXIT"]
    confidence: float = Field(..., ge=0, le=100)
    internal_reasoning: str = Field(..., description="Tactical logic chain (Chain of Thought)")
    potential_traps_identified: List[str] = Field(default_factory=list)
    adjustment_advice: str = Field(..., description="Advice on sizing, timing, or stop placement")
    
    # Metadata for tracking
    model_source: str = Field(..., description="Which model generated this (Nemotron/Qwen)")
    is_strategic_override: bool = False
