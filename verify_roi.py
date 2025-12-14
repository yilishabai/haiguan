
import sys
import os
import random
from datetime import datetime, timedelta

# Add the project root to the python path
sys.path.append(os.getcwd())

from backend_py.routers.model_metrics import get_roi_analysis, simulate_traffic
from backend_py.db import SessionLocal
from backend_py.models.model_metrics import ModelExecutionLog, ModelMetric

def verify_roi():
    db = SessionLocal()
    try:
        print("Populating historical data for verification...")
        # Populate last 7 days
        for i in range(7):
            simulate_traffic(days_back=i, db=db)
            
        print("Data populated. querying ROI analysis...")
        result = get_roi_analysis(db)
        
        print("Dates:", result['dates'])
        print("ROI Trend:", result['roi_trend'])
        print("Accuracy Trend:", result['accuracy_trend'])
        
        # Validation
        if len(result['dates']) != 7:
            print("ERROR: Expected 7 days of data.")
        else:
            print("Date count correct.")
            
        if any(v > 0 for v in result['roi_trend']):
             print("ROI Trend has data.")
        else:
             print("WARNING: ROI Trend is all zeros.")

        if any(v > 0 for v in result['accuracy_trend']):
             print("Accuracy Trend has data.")
        else:
             print("WARNING: Accuracy Trend is all zeros.")
             
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    verify_roi()
