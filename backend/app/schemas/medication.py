from pydantic import BaseModel

class Inventory(BaseModel):
    medication_id: str
    location_id: str
    quantity_on_hand: float
    average_daily_use: float
    minimum_reserve: float
