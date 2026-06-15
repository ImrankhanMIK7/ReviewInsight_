import os
import pandas as pd
from utils.detector import detect_columns
from utils.cleaner import clean_data
from utils.analyzer import run_analysis_pipeline
from utils.summarizer import summarize_reviews
import database

def main():
    print("--- PIPELINE VERIFICATION TEST ---")
    csv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "sample_reviews.csv")
    
    # 1. Read File
    print(f"Reading sample reviews from: {csv_path}")
    if not os.path.exists(csv_path):
        print("Error: sample_reviews.csv not found!")
        return
        
    df = pd.read_csv(csv_path)
    print(f"File parsed successfully. Rows: {len(df)}")
    
    # 2. Detect Columns
    mapping = detect_columns(df)
    print(f"Detected Column Mapping: {mapping}")
    
    # 3. Clean Data
    cleaned_df = clean_data(df, mapping)
    print(f"Cleaned Data (first 3 rows):\n{cleaned_df.head(3)}")
    
    # 4. Run Analysis
    analyzed_df = run_analysis_pipeline(cleaned_df)
    print(f"Analyzed Data (first 3 rows with sentiment & ratings):\n{analyzed_df.head(3)}")
    
    # 5. Summarize
    summaries = summarize_reviews(analyzed_df)
    print("\n--- NLP Summary ---")
    print(f"Overall: {summaries['summary']}")
    print(f"Likes: {summaries['likes'][:2]}")
    print(f"Dislikes: {summaries['dislikes'][:2]}")
    print(f"Keywords: {[k['keyword'] for k in summaries['keywords'][:4]]}")
    
    print("\n--- DB Setup Check ---")
    database.init_db()
    print("Database initialised correctly.")
    
    print("\nPipeline test completed successfully!")

if __name__ == "__main__":
    main()
