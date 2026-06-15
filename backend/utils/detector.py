import re
from typing import Dict, List, Optional
import pandas as pd
import numpy as np

COLUMN_PATTERNS = {
    "review_text": [
        r"\breview\b", r"\btext\b", r"\bcomment\b", r"\bbody\b", r"\bmessage\b", 
        r"\bdesc\b", r"\bdescription\b", r"\bcontent\b", r"\bfeedback\b", r"\bopinion\b"
    ],
    "rating": [
        r"\brating\b", r"\bscore\b", r"\bstar\b", r"\bstars\b", r"\bpts\b", r"\bpoint\b", r"\bpoints\b", r"\bgrade\b"
    ],
    "reviewer_name": [
        r"\bname\b", r"\buser\b", r"\bauthor\b", r"\breviewer\b", r"\bcustomer\b", r"\bclient\b", r"\bnickname\b", r"\busername\b"
    ],
    "date": [
        r"\bdate\b", r"\btime\b", r"\btimestamp\b", r"\bcreated\b", r"\bposted\b", r"\bday\b", r"\byear\b"
    ],
    "source": [
        r"\bsource\b", r"\bsite\b", r"\bplatform\b", r"\borigin\b", r"\bchannel\b", r"\bstore\b"
    ]
}

def detect_columns(df: pd.DataFrame) -> Dict[str, Optional[str]]:
    """
    Scans dataframe columns and maps them to standard fields.
    If header-based keyword scanning yields poor results or generic headers,
    falls back to deep inspection of cell contents.
    """
    mapped_cols = {
        "review_text": None,
        "rating": None,
        "reviewer_name": None,
        "date": None,
        "source": None
    }
    
    available_cols = list(df.columns)
    
    # 1. Header-based Scan (First Pass: Exact/Close matches)
    for key, patterns in COLUMN_PATTERNS.items():
        for col in available_cols:
            col_lower = str(col).lower().strip()
            # Direct exact match check
            if col_lower in ["review", "text", "comment", "review_text", "reviews"] and key == "review_text":
                mapped_cols[key] = col
                break
            if col_lower in ["rating", "score", "star", "stars", "rating_score"] and key == "rating":
                mapped_cols[key] = col
                break
            if col_lower in ["name", "user", "reviewer", "author", "reviewer_name"] and key == "reviewer_name":
                mapped_cols[key] = col
                break
            if col_lower in ["date", "time", "timestamp", "review_date"] and key == "date":
                mapped_cols[key] = col
                break
            if col_lower in ["source", "site", "platform", "review_source"] and key == "source":
                mapped_cols[key] = col
                break

    # Remove mapped
    for val in mapped_cols.values():
        if val in available_cols:
            available_cols.remove(val)

    # 2. Header-based Scan (Second Pass: Regex matching on headers)
    for key, patterns in COLUMN_PATTERNS.items():
        if mapped_cols[key] is not None:
            continue
        for col in available_cols:
            col_lower = str(col).lower().strip()
            for pattern in patterns:
                if re.search(pattern, col_lower):
                    mapped_cols[key] = col
                    break
            if mapped_cols[key] is not None:
                available_cols.remove(mapped_cols[key])
                break

    # 3. Data-driven Deep Inspection (If headers are generic, e.g. "data", "data3", "col1")
    # Let's inspect each remaining column to identify its content type
    candidates = list(available_cols)
    
    # Analyze metrics for each column
    col_metrics = {}
    for col in df.columns:
        # Sample non-null values
        sample = df[col].dropna().head(40)
        if sample.empty:
            continue
            
        sample_str = sample.astype(str).str.strip()
        mean_len = sample_str.str.len().mean()
        
        # Check if values look like URLs
        is_url = sample_str.str.startswith(("http://", "https://")).mean() > 0.6
        
        # Check if values look like ratings (e.g. numbers 1-5, or floats, or "3/5")
        def is_rating_like(val):
            val_s = str(val).strip().lower()
            if re.search(r'^[1-5](\.0)?$', val_s):
                return True
            if re.search(r'^[1-5]\s*/\s*5$', val_s):
                return True
            if re.search(r'^[1-5]\s+out\s+of\s+5$', val_s):
                return True
            return False
            
        rating_match_rate = sample.apply(is_rating_like).mean()
        
        # Check if values look like dates
        def is_date_like(val):
            val_s = str(val).strip().lower()
            # Standard dates or phrases like "a year ago", "10 months ago", "2 Oct 2015"
            if any(term in val_s for term in ["ago", "yesterday", "today"]):
                return True
            # YYYY-MM-DD or DD/MM/YYYY or DD-MM-YYYY
            if re.search(r'\b\d{1,4}[-/]\d{1,2}[-/]\d{1,4}\b', val_s):
                return True
            # Month names like Jan, Feb, October
            if any(m in val_s for m in ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]):
                return True
            return False
            
        date_match_rate = sample.apply(is_date_like).mean()
        
        # Check if values contain source keywords (Google, Tripadvisor, App Store)
        def is_source_like(val):
            val_s = str(val).strip().lower()
            return any(term in val_s for term in ["google", "tripadvisor", "app store", "amazon", "flipkart", "yelp"])
            
        source_match_rate = sample.apply(is_source_like).mean()

        col_metrics[col] = {
            "mean_len": mean_len,
            "is_url": is_url,
            "rating_rate": rating_match_rate,
            "date_rate": date_match_rate,
            "source_rate": source_match_rate,
        }

    # Fallback assignment based on metrics
    # --- RATING ---
    if mapped_cols["rating"] is None:
        best_rating_col = None
        highest_rate = 0.25  # Require at least 25% match rate
        for col, m in col_metrics.items():
            if m["rating_rate"] > highest_rate and not m["is_url"]:
                highest_rate = m["rating_rate"]
                best_rating_col = col
        if best_rating_col:
            mapped_cols["rating"] = best_rating_col
            if best_rating_col in candidates: candidates.remove(best_rating_col)

    # --- DATE ---
    if mapped_cols["date"] is None:
        best_date_col = None
        highest_rate = 0.4
        for col, m in col_metrics.items():
            if m["date_rate"] > highest_rate and not m["is_url"]:
                highest_rate = m["date_rate"]
                best_date_col = col
        if best_date_col:
            mapped_cols["date"] = best_date_col
            if best_date_col in candidates: candidates.remove(best_date_col)

    # --- SOURCE ---
    if mapped_cols["source"] is None:
        best_source_col = None
        highest_rate = 0.4
        for col, m in col_metrics.items():
            if m["source_rate"] > highest_rate and not m["is_url"]:
                highest_rate = m["source_rate"]
                best_source_col = col
        if best_source_col:
            mapped_cols["source"] = best_source_col
            if best_source_col in candidates: candidates.remove(best_source_col)

    # --- REVIEW TEXT ---
    if mapped_cols["review_text"] is None:
        best_text_col = None
        longest_len = 0
        for col, m in col_metrics.items():
            # Exclude URLs, dates, and numerical columns
            if m["is_url"] or col == mapped_cols["rating"] or col == mapped_cols["date"] or col == mapped_cols["source"]:
                continue
            # Text columns will have a high average character length
            # Exclude things like IDs (which have length around 10-15 but no spaces)
            sample_vals = df[col].dropna().head(10).astype(str)
            has_spaces = sample_vals.str.contains(" ").mean() > 0.5
            
            if m["mean_len"] > longest_len and has_spaces:
                longest_len = m["mean_len"]
                best_text_col = col
        if best_text_col:
            mapped_cols["review_text"] = best_text_col
            if best_text_col in candidates: candidates.remove(best_text_col)

    # --- REVIEWER NAME ---
    if mapped_cols["reviewer_name"] is None:
        best_name_col = None
        # Name columns have short average lengths (3-25 characters), capitalized names, and aren't numbers/URLs
        for col in col_metrics.keys():
            m = col_metrics[col]
            if col in [mapped_cols["review_text"], mapped_cols["rating"], mapped_cols["date"], mapped_cols["source"]]:
                continue
            if m["is_url"]:
                continue
            if 3 < m["mean_len"] < 25:
                # Name columns contain alphabet values, usually capitalized
                sample_vals = df[col].dropna().head(10).astype(str)
                is_numeric = pd.to_numeric(sample_vals, errors='coerce').notna().mean() > 0.5
                has_letters = sample_vals.str.contains(r'[a-zA-Z]').mean() > 0.8
                if not is_numeric and has_letters:
                    best_name_col = col
                    break
        if best_name_col:
            mapped_cols["reviewer_name"] = best_name_col

    # Ultimate fallbacks if still None
    if mapped_cols["review_text"] is None and len(df.columns) > 0:
        mapped_cols["review_text"] = df.columns[0]

    return mapped_cols
