import os
import json
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List

# Standard OpenAI client supports both vLLM and Ollama (v1 endpoint)
from openai import OpenAI
from pydantic import ValidationError

# Import our standardized models and dispatchers
try:
    from .models import StrategicBrief, TradingDecision, UrgentUpdate, Scenario
    from .dispatchers import DecisionDispatcher, HTTPDispatcher, BaseDispatcher
except ImportError:
    # Handle direct script execution for testing
    from models import StrategicBrief, TradingDecision, UrgentUpdate, Scenario
    from dispatchers import DecisionDispatcher, HTTPDispatcher, BaseDispatcher

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(name)s: %(message)s')
logger = logging.getLogger("BrainCoordinator")

class BrainCoordinator:
    """
    Orchestrates the hierarchical trading brain and dispatches signals to QuantVPS.
    
    DATA FLOW:
    1. Schwab/TOS Feed   -> Pushed into coordinator (via Data Provider)
    2. Strategic Layer   -> Nemotron (H200) builds StrategicBrief (every 15-40s)
    3. Tactical Layer    -> Qwen (Local/H200) generates TradingDecision (every 2-3s)
    4. Dispatch Layer    -> DecisionDispatcher pushes JSON to QuantVPS Execution Bot
    5. QuantVPS Bot      -> Risk checks + Schwab/TOS Order Execution
    """

    def __init__(
        self,
        local_base_url: str = "http://localhost:11434/v1",
        local_model: str = "qwen3.5:14b",
        h200_base_url: Optional[str] = None,
        h200_api_key: Optional[str] = None,
        h200_strategic_model: str = "nemotron-3-nano-30b-a3b",
        h200_tactical_model: str = "qwen3.5:14b",
        market_open_time: Optional[datetime] = None,
        quant_vps_dispatcher: Optional[BaseDispatcher] = None
    ):
        # Configuration
        self.local_model = local_model
        self.h200_strategic_model = h200_strategic_model
        self.h200_tactical_model = h200_tactical_model
        self.market_open_time = market_open_time or datetime.now()
        
        # Dispatcher for QuantVPS execution signals
        self.dispatcher = quant_vps_dispatcher
        
        # Clients
        self.local_client = OpenAI(base_url=local_base_url, api_key="ollama")
        
        self.h200_base_url = h200_base_url
        self.h200_api_key = h200_api_key
        self.h200_client = None
        if h200_base_url:
            self.h200_client = OpenAI(base_url=h200_base_url, api_key=h200_api_key or "vllm")
            
        # State
        self.current_strategic_brief: Optional[StrategicBrief] = None
        self.last_update_time: datetime = datetime.now()
        
        logger.info(f"BrainCoordinator initialized. Market Open: {self.market_open_time.strftime('%H:%M:%S')}")
        if self.dispatcher:
            logger.info("QuantVPS Dispatcher ready for execution layer signaling.")

    # ─────────────────────────────────────────────────────────────
    # Hardware/Handoff Logic
    # ─────────────────────────────────────────────────────────────

    def is_h200_era(self) -> bool:
        """
        Automatic hardware selector:
        - First 4 hours of the day (First-Hour Volatility + Open).
        - Requires valid H200 credentials.
        """
        if not self.h200_client:
            return False
            
        elapsed = datetime.now() - self.market_open_time
        return elapsed < timedelta(hours=4)

    def get_active_tactical_model(self) -> str:
        return self.h200_tactical_model if self.is_h200_era() else self.local_model

    def get_active_tactical_client(self) -> OpenAI:
        return self.h200_client if self.is_h200_era() else self.local_client

    # ─────────────────────────────────────────────────────────────
    # Phase 2: Strategic Thinking (Nemotron)
    # ─────────────────────────────────────────────────────────────

    async def generate_strategic_brief(self, pillar_data: Dict[str, Any], macro_context: str) -> StrategicBrief:
        """
        [DEEP REASONING LOOP - Every 15-40s]
        Calls Nemotron to update the Battle Plan across 6 pillars:
        Premium/Discount, S/R, Momentum, Price Action, Volume, POC/Greeks.
        """
        if not self.is_h200_era():
            logger.warning("Strategic brain offline (Not H200 era). Using fallback brief.")
            self.current_strategic_brief = self._build_fallback_brief(macro_context)
            return self.current_strategic_brief

        logger.info(f"Nemotron Strategic Handoff: Generating new Battle Plan...")
        
        prompt = self._build_strategic_prompt(pillar_data, macro_context)
        
        try:
            # Note: vLLM expects standard OpenAI completion format
            response = self.h200_client.chat.completions.create(
                model=self.h200_strategic_model,
                messages=[
                    {"role": "system", "content": "You are the Deep Strategic Thinker (Nemotron). Analyze pillars, identify manipulation/traps, and output a StrategicBrief JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
                response_format={"type": "json_object"}
            )
            
            raw_json = response.choices[0].message.content
            brief_data = json.loads(raw_json)
            self.current_strategic_brief = StrategicBrief(**brief_data)
            self.last_update_time = datetime.now()
            
            logger.info(f"Strategic Brief: Bias {self.current_strategic_brief.current_bias} ({self.current_strategic_brief.bias_confidence}%)")
            return self.current_strategic_brief
            
        except Exception as e:
            logger.error(f"Strategic brief generation failed: {e}")
            self.current_strategic_brief = self._build_fallback_brief(macro_context)
            return self.current_strategic_brief

    # ─────────────────────────────────────────────────────────────
    # Phase 1 & 2: Tactical Execution (Qwen)
    # ─────────────────────────────────────────────────────────────

    async def get_trading_decision(self, current_market_data: Dict[str, Any], auto_dispatch: bool = True) -> TradingDecision:
        """
        [FAST TACTICAL LOOP - Every 2-3s]
        Calls Qwen using the latest StrategicBrief as context.
        The result is sent directly to QuantVPS for execution.
        """
        client = self.get_active_tactical_client()
        model = self.get_active_tactical_model()
        
        strategic_context = "No strategic briefing available. Defensive stance."
        if self.current_strategic_brief:
            strategic_context = f"""
            ### STRATEGIC BRIEF FROM HEADQUARTERS:
            BIAS: {self.current_strategic_brief.current_bias} ({self.current_strategic_brief.bias_confidence}%)
            THESIS: {self.current_strategic_brief.primary_thesis}
            GUIDANCE: {self.current_strategic_brief.guidance_for_tactical}
            RISKS: {', '.join(self.current_strategic_brief.manipulation_risks)}
            """

        try:
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": f"You are the Tactical Executor (Qwen). Use Strategic Context: {strategic_context}. Return standardized TradingDecision JSON only."},
                    {"role": "user", "content": f"Market Data: {json.dumps(current_market_data)}"}
                ],
                temperature=0.1,
                response_format={"type": "json_object"}
            )
            
            decision_data = json.loads(response.choices[0].message.content)
            decision_data["model_source"] = f"Tactical ({model})"
            
            decision = TradingDecision(**decision_data)
            
            # --- AUTO-DISPATCH TO QUANTVPS ---
            if auto_dispatch and self.dispatcher:
                success = self.dispatcher.dispatch(decision.model_dump())
                if success:
                    logger.info(f"Decision '{decision.final_trade_direction}' dispatched to QuantVPS.")
                else:
                    logger.error("Signal dispatch failed. QuantVPS execution layer might be unreachable.")

            return decision

        except Exception as e:
            logger.error(f"Tactical decision logic failure: {e}")
            return self._build_fallback_decision(str(e))

    # ─────────────────────────────────────────────────────────────
    # Internal Helpers
    # ─────────────────────────────────────────────────────────────

    def _build_strategic_prompt(self, pillar_data: Dict[str, Any], macro_context: str) -> str:
        return f"""
        Analyze the 6 core pillars:
        1. Premium/Discount: {pillar_data.get('premium', 'N/A')}
        2. Support/Resistance: {pillar_data.get('levels', 'N/A')}
        3. Momentum: {pillar_data.get('momentum', 'N/A')}
        4. Price Action: {pillar_data.get('price_action', 'N/A')}
        5. Volume: {pillar_data.get('volume', 'N/A')}
        6. POC/Greeks/OI: {pillar_data.get('greeks', 'N/A')}
        
        Macro: {macro_context}
        Output StrategicBrief JSON only.
        """

    def _build_fallback_brief(self, macro_context: str) -> StrategicBrief:
        return StrategicBrief(
            current_bias="NEUTRAL",
            bias_confidence=50.0,
            primary_thesis=f"Fallback strategic analysis for {macro_context}",
            guidance_for_tactical="Maintain defensive positioning. Strategic brain sync pending.",
            manipulation_risks=["Limited strategic visibility"],
            scenarios=[Scenario(name="Flat Open", probability=1.0, trigger_condition="N/A")]
        )

    def _build_fallback_decision(self, error_msg: str) -> TradingDecision:
        return TradingDecision(
            autonomous_thesis="Safety fallback triggered.",
            final_trade_direction="HOLD",
            confidence=0.0,
            internal_reasoning=error_msg,
            adjustment_advice="Verify Brain-VPS communication link.",
            model_source="Safety_Logic"
        )
