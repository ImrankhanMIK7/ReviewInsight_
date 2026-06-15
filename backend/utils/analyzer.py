import pandas as pd
import numpy as np
import nltk
import re
from textblob import TextBlob
from typing import Tuple, List, Dict, Any

# Proactively download VADER lexicon
try:
    from nltk.sentiment.vader import SentimentIntensityAnalyzer
    # Attempt instantiation to check if lexicon is present
    sia = SentimentIntensityAnalyzer()
except LookupError:
    nltk.download('vader_lexicon', quiet=True)
    from nltk.sentiment.vader import SentimentIntensityAnalyzer
    sia = SentimentIntensityAnalyzer()

HINGLISH_POS = {
    'acha', 'achha', 'accha', 'badiya', 'badhiya', 'mast', 'mst', 'sundar', 'sasta', 
    'shukriya', 'sukriya', 'dhanyawad', 'pasand', 'lajawab', 'gazab', 'maza', 'mazza', 'perfect'
}
HINGLISH_NEG = {
    'bekar', 'ganda', 'kharab', 'bakwas', 'ghatiya', 'faltu', 'fhaltu', 'rubbish', 
    'worst', 'bekaar', 'kharaba', 'gandagi', 'mahenga', 'mehenga', 'dhokha', 'frad', 'fraud'
}

def analyze_review_sentiment(text: str) -> Tuple[float, float, str]:
    """
    Analyzes sentiment of a single review text.
    Returns (compound_score, subjectivity, sentiment_label)
    """
    if not isinstance(text, str) or not text.strip():
        return 0.0, 0.0, "Neutral"
        
    # NLTK VADER compound score
    vader_scores = sia.polarity_scores(text)
    compound = vader_scores["compound"]
    
    # TextBlob subjectivity & fallback polarity
    blob = TextBlob(text)
    subjectivity = blob.sentiment.subjectivity
    
    # Fallback to TextBlob polarity if VADER is completely neutral (e.g. short/unusual adjectives)
    if abs(compound) < 0.01 and abs(blob.sentiment.polarity) > 0.01:
        compound = blob.sentiment.polarity

    # Hinglish Keyword adjustment
    words = re.findall(r'\b\w+\b', text.lower())
    for w in words:
        if w in HINGLISH_POS:
            compound += 0.25
        elif w in HINGLISH_NEG:
            compound -= 0.25
            
    # Cap compound between -1.0 and 1.0
    compound = max(-1.0, min(1.0, compound))
    
    # Sentiment classification
    if compound >= 0.05:
        sentiment = "Positive"
    elif compound <= -0.05:
        sentiment = "Negative"
    else:
        sentiment = "Neutral"
        
    return float(compound), float(subjectivity), sentiment

def estimate_rating(compound: float) -> int:
    """
    Estimates star rating (1-5) based on sentiment compound score.
    """
    if compound >= 0.6:
        return 5
    elif compound >= 0.1:
        return 4
    elif compound >= -0.1:
        return 3
    elif compound >= -0.6:
        return 2
    else:
        return 1

def run_analysis_pipeline(df: pd.DataFrame) -> pd.DataFrame:
    """
    Takes a cleaned dataframe (with keys: reviewer, rating, text, date, source)
    and populates sentiment, estimated ratings, and overall score.
    """
    processed_df = df.copy()
    
    compounds = []
    subjectivities = []
    sentiments = []
    
    for text in processed_df["text"]:
        comp, subj, sent = analyze_review_sentiment(text)
        compounds.append(comp)
        subjectivities.append(subj)
        sentiments.append(sent)
        
    processed_df["sentiment_score"] = compounds
    processed_df["subjectivity"] = subjectivities
    processed_df["sentiment"] = sentiments
    
    # Determine estimated ratings and set missing ratings
    estimated_ratings = []
    is_estimated_list = []
    aligned_sentiments = []
    
    for idx, row in processed_df.iterrows():
        comp = row["sentiment_score"]
        current_rating = row["rating"]
        current_sentiment = row["sentiment"]
        
        if pd.isna(current_rating) or np.isnan(current_rating):
            est = estimate_rating(comp)
            estimated_ratings.append(est)
            is_estimated_list.append(True)
            aligned_sentiments.append(current_sentiment)
        else:
            # Keep existing, ensure it's integer star value between 1 and 5
            rating_val = int(max(1, min(5, round(current_rating))))
            estimated_ratings.append(rating_val)
            is_estimated_list.append(False)
            
            # Align sentiment category to the parsed Rating to avoid mismatches
            if rating_val >= 4:
                aligned_sentiments.append("Positive")
            elif rating_val == 3:
                aligned_sentiments.append("Neutral")
            else:
                aligned_sentiments.append("Negative")
            
    processed_df["rating"] = estimated_ratings
    processed_df["is_estimated"] = is_estimated_list
    processed_df["sentiment"] = aligned_sentiments
    
    return processed_df
