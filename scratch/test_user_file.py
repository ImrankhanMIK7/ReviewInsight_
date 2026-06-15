import pandas as pd
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "backend"))

from utils.detector import detect_columns
from utils.cleaner import clean_data
from utils.analyzer import run_analysis_pipeline
from utils.summarizer import summarize_reviews

def main():
    path = r"C:\Users\HP\Downloads\google-com-2026-06-11-3.csv"
    if not os.path.exists(path):
        print("User file not found at Downloads path!")
        return
        
    df = pd.read_csv(path)
    print(f"Loaded user file. Rows: {len(df)}")
    
    mapping = detect_columns(df)
    print(f"DETECTED COLUMNS: {mapping}")
    
    cleaned_df = clean_data(df, mapping)
    print(f"Cleaned DataFrame Shape: {cleaned_df.shape}")
    
    analyzed_df = run_analysis_pipeline(cleaned_df)
    print(f"Analyzed DataFrame Shape: {analyzed_df.shape}")
    
    print("\nSAMPLE REVIEWS AND SENTIMENTS:")
    for i, row in analyzed_df.head(10).iterrows():
        print(f"Rating: {row['rating']} | Sentiment: {row['sentiment']} | Reviewer: {row['reviewer']}")
        print(f"Text snippet: {str(row['text'])[:120]}...\n")
        
    summary = summarize_reviews(analyzed_df)
    print("\n--- EXECUTIVE SUMMARY ---")
    print(summary['summary'])
    print(f"Likes: {summary['likes']}")
    print(f"Dislikes: {summary['dislikes']}")

if __name__ == "__main__":
    main()
