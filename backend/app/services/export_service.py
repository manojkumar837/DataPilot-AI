import io
from typing import Dict, Any, List
import pandas as pd

def export_dataframe_to_csv(df: pd.DataFrame) -> str:
    output = io.StringIO()
    df.to_csv(output, index=False)
    return output.getvalue()
