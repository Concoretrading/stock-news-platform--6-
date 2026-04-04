import json
import logging
import requests
import asyncio
from typing import Optional, Dict, Any
from abc import ABC, abstractmethod

# Standard standard logging
logger = logging.getLogger("DecisionDispatcher")

class BaseDispatcher(ABC):
    """Abstract base for sending decisions to the QuantVPS Execution Layer."""
    
    @abstractmethod
    def dispatch(self, decision: Dict[str, Any]) -> bool:
        pass

class HTTPDispatcher(BaseDispatcher):
    """
    Sends 'Push' notifications to the QuantVPS bot via HTTP POST.
    Ideal for reliable, standardized signal delivery.
    """
    def __init__(self, endpoint_url: str, api_key: Optional[str] = None):
        self.url = endpoint_url
        self.headers = {
            "Content-Type": "application/json",
            "User-Agent": "Predator-Brain-Coordinator"
        }
        if api_key:
            self.headers["X-API-Key"] = api_key

    def dispatch(self, decision: Dict[str, Any]) -> bool:
        try:
            logger.info(f"Pushing Decision to QuantVPS: {self.url}")
            response = requests.post(self.url, json=decision, headers=self.headers, timeout=5)
            
            if response.status_code in [200, 201, 202]:
                logger.info(f"Successfully dispatched to QuantVPS. Status: {response.status_code}")
                return True
            else:
                logger.error(f"QuantVPS Dispatch Failed. Status: {response.status_code}. Msg: {response.text}")
                return False
        except Exception as e:
            logger.error(f"HTTP Dispatch Error: {e}")
            return False

class WebSocketDispatcher(BaseDispatcher):
    """
    Maintains a low-latency persistent connection to QuantVPS.
    Requires 'websockets' library. (Implementation placeholder).
    """
    def __init__(self, ws_url: str):
        self.ws_url = ws_url
        # Note: Actual async websocket handling should be managed in the main event loop
        logger.warning("WebSocketDispatcher initialized. Ensure its async dispatch is called in an event loop.")

    def dispatch(self, decision: Dict[str, Any]) -> bool:
        # Placeholder for real-world low-latency push
        logger.info(f"[MOCK WS] Sending signal to {self.ws_url}: {decision.get('final_trade_direction')}")
        return True

class DecisionDispatcher:
    """
    The orchestrator for signal delivery. 
    Can handle multiple dispatch methods simultaneously (e.g. HTTP for QuantVPS + Log for Archive).
    """
    def __init__(self, dispatcher: BaseDispatcher):
        self._dispatcher = dispatcher

    def send(self, decision_model: Any) -> bool:
        # Convert pydantic model to dict for transmission
        if hasattr(decision_model, "model_dump"):
            decision_dict = decision_model.model_dump()
        else:
            decision_dict = decision_model
            
        return self._dispatcher.dispatch(decision_dict)
