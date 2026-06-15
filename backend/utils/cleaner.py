import pandas as pd
import numpy as np
import re
from typing import Dict, Optional

def clean_data(df: pd.DataFrame, mapping: Dict[str, Optional[str]]) -> pd.DataFrame:
    """
    Cleans the uploaded review dataframe:
    - Drops duplicates based on review text.
    - Handles missing names, dates, and sources.
    - Standardizes review text formatting.
    """
    cleaned_df = df.copy()
    
    text_col = mapping.get("review_text")
    if not text_col or text_col not in cleaned_df.columns:
        # Create dummy text col if somehow missing
        cleaned_df["review_text_cleaned"] = "No review content provided."
        text_col = "review_text_cleaned"
    else:
        # Pre-fill NaNs with empty strings to avoid dropping rows
        cleaned_df[text_col] = cleaned_df[text_col].fillna("").astype(str).str.strip()
        
        # Split empty comments (rating-only reviews) and actual written comments
        empty_comments = cleaned_df[cleaned_df[text_col] == ""]
        written_comments = cleaned_df[cleaned_df[text_col] != ""]
        
        # Deduplicate only written comments to filter out real duplicates
        written_comments = written_comments.drop_duplicates(subset=[text_col])
        
        # Re-combine
        cleaned_df = pd.concat([written_comments, empty_comments], ignore_index=True)
        
        # Clean text
        def clean_text(text):
            if not text:
                return "Rating only (No comment left)"
            # Remove HTML tags if any
            text = re.sub(r"<[^>]*>", "", text)
            # Remove excessive whitespace
            text = re.sub(r"\s+", " ", text)
            return text.strip()
            
        cleaned_df["review_text_cleaned"] = cleaned_df[text_col].apply(clean_text)
        text_col = "review_text_cleaned"

    # Handle ratings
    rating_col = mapping.get("rating")
    if rating_col and rating_col in cleaned_df.columns:
        def parse_rating_val(val):
            if pd.isna(val) or val is None:
                return np.nan
            val_str = str(val).strip().lower()
            if not val_str:
                return np.nan
            # Extract numerator from "4/5", "4 out of 5", etc.
            match = re.search(r'([0-9.]+)\s*(?:/|out\s+of)\s*[0-9.]+', val_str)
            if match:
                try:
                    return float(match.group(1))
                except ValueError:
                    pass
            # Extract first floating point number
            match = re.search(r'([0-9.]+)', val_str)
            if match:
                try:
                    return float(match.group(1))
                except ValueError:
                    pass
            return np.nan

        cleaned_df["rating_cleaned"] = cleaned_df[rating_col].apply(parse_rating_val)
        # Replace missing or out-of-bounds ratings with NaN (so analyzer can infer them)
        cleaned_df.loc[
            (cleaned_df["rating_cleaned"] < 1) | (cleaned_df["rating_cleaned"] > 5), 
            "rating_cleaned"
        ] = np.nan
    else:
        cleaned_df["rating_cleaned"] = np.nan
        
    # Handle dates
    date_col = mapping.get("date")
    if date_col and date_col in cleaned_df.columns:
        from datetime import datetime, timedelta
        base_date = datetime(2026, 6, 11) # Current system date
        
        def parse_date_str(val):
            if pd.isna(val) or val is None:
                return None
            val_str = str(val).strip().lower()
            if not val_str:
                return None
                
            # Clean prefixes like "edited " or suffixes like " on google", " on tripadvisor"
            val_str = re.sub(r'^edited\s+', '', val_str)
            val_str = re.split(r'\s+on\s+', val_str)[0].strip()
            
            # 1. Match relative formats e.g. "a year ago", "10 months ago", "2 weeks ago"
            if val_str in ["a year ago", "an year ago"]:
                return (base_date - timedelta(days=365)).strftime('%Y-%m-%d')
            if val_str in ["a month ago", "an month ago"]:
                return (base_date - timedelta(days=30)).strftime('%Y-%m-%d')
            if val_str == "a week ago":
                return (base_date - timedelta(days=7)).strftime('%Y-%m-%d')
            if val_str in ["a day ago", "yesterday"]:
                return (base_date - timedelta(days=1)).strftime('%Y-%m-%d')
                
            # "N years ago", "N months ago", "N weeks ago", "N days ago"
            match = re.search(r'(\d+)\s+(year|month|week|day|hour)s?\s+ago', val_str)
            if match:
                num = int(match.group(1))
                unit = match.group(2)
                if unit == "year":
                    return (base_date - timedelta(days=num * 365)).strftime('%Y-%m-%d')
                elif unit == "month":
                    return (base_date - timedelta(days=num * 30)).strftime('%Y-%m-%d')
                elif unit == "week":
                    return (base_date - timedelta(days=num * 7)).strftime('%Y-%m-%d')
                elif unit == "day":
                    return (base_date - timedelta(days=num)).strftime('%Y-%m-%d')
                elif unit == "hour":
                    return base_date.strftime('%Y-%m-%d')
                    
            # 2. Match absolute date conversion
            try:
                dt = pd.to_datetime(val, errors='coerce')
                if pd.notna(dt):
                    return dt.strftime('%Y-%m-%d')
            except Exception:
                pass
                
            return None

        cleaned_df["date_cleaned"] = cleaned_df[date_col].apply(parse_date_str)
    else:
        cleaned_df["date_cleaned"] = None
        
    # Fill remaining NaNs for date with default value
    cleaned_df["date_cleaned"] = cleaned_df["date_cleaned"].fillna("Unknown Date")

    # Handle reviewer name
    name_col = mapping.get("reviewer_name")
    if name_col and name_col in cleaned_df.columns:
        cleaned_df["reviewer_name_cleaned"] = cleaned_df[name_col].fillna("Anonymous").astype(str).str.strip()
    else:
        cleaned_df["reviewer_name_cleaned"] = "Anonymous"
        
    # Handle source
    source_col = mapping.get("source")
    if source_col and source_col in cleaned_df.columns:
        cleaned_df["source_cleaned"] = cleaned_df[source_col].fillna("Unknown").astype(str).str.strip()
    else:
        cleaned_df["source_cleaned"] = "General Source"
        
    # Standardize output schema: keep only cleaned columns
    result_df = pd.DataFrame({
        "reviewer": cleaned_df["reviewer_name_cleaned"],
        "rating": cleaned_df["rating_cleaned"],
        "text": cleaned_df["review_text_cleaned"],
        "date": cleaned_df["date_cleaned"],
        "source": cleaned_df["source_cleaned"]
    })
    
    return result_df
