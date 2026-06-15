import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
import re
from typing import Dict, List, Any
from textblob import TextBlob
import nltk

try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt', quiet=True)

def extract_keywords(texts: List[str], top_n: int = 10) -> List[Dict[str, Any]]:
    """
    Extracts top keywords/phrases using TF-IDF from the texts list.
    """
    if not texts or len(texts) == 0:
        return []
        
    # Standardize/clean a bit
    clean_texts = [t.lower() for t in texts if isinstance(t, str) and len(t.strip()) > 3]
    if not clean_texts:
        return []
        
    try:
        # Use single words and bigrams, excluding common stop words
        vectorizer = TfidfVectorizer(
            stop_words='english',
            ngram_range=(1, 2),
            max_features=100
        )
        tfidf_matrix = vectorizer.fit_transform(clean_texts)
        feature_names = vectorizer.get_feature_names_out()
        
        # Calculate mean TF-IDF scores across docs
        scores = np.mean(tfidf_matrix.toarray(), axis=0)
        
        keyword_scores = []
        for word, score in zip(feature_names, scores):
            # Exclude very short terms
            if len(word) > 2:
                keyword_scores.append({"keyword": word, "score": float(score)})
                
        # Sort by score descending
        keyword_scores = sorted(keyword_scores, key=lambda x: x["score"], reverse=True)
        return keyword_scores[:top_n]
    except Exception as e:
        # Simple frequency fallback if TF-IDF fails
        words = {}
        stop_words_fallback = {'the', 'and', 'a', 'to', 'for', 'in', 'of', 'is', 'it', 'this', 'that', 'with', 'on', 'was', 'were', 'my', 'i', 'had', 'have', 'but', 'not'}
        for text in clean_texts:
            for word in re.findall(r'\b\w{3,}\b', text):
                if word not in stop_words_fallback:
                    words[word] = words.get(word, 0) + 1
        sorted_words = sorted(words.items(), key=lambda x: x[1], reverse=True)
        return [{"keyword": k, "score": float(v)} for k, v in sorted_words[:top_n]]

def extract_suggestion_sentences(texts: List[str], limit: int = 5) -> List[str]:
    """
    Extracts sentences that sound like suggestions or feature requests.
    """
    suggestion_patterns = [
        r"\bshould\b", r"\bneed\b", r"\bplease\b", r"\bwould like\b", 
        r"\bwish\b", r"\bhope\b", r"\bbetter\b", r"\bfix\b", r"\bimprove\b", 
        r"\badd\b", r"\bmissing\b", r"\bupdate\b", r"\bupgrade\b"
    ]
    
    suggestions = []
    
    for text in texts:
        if not isinstance(text, str):
            continue
        # Split into sentences
        sentences = re.split(r'[.!?]+', text)
        for sentence in sentences:
            sentence = sentence.strip()
            if len(sentence) < 15 or len(sentence) > 120:
                continue
            # Check pattern match
            lower_s = sentence.lower()
            for pattern in suggestion_patterns:
                if re.search(pattern, lower_s):
                    suggestions.append(sentence)
                    break
                    
    # Deduplicate suggestions and keep best ones
    unique_suggestions = list(set(suggestions))
    # Sort by length or score if needed
    unique_suggestions = sorted(unique_suggestions, key=len)
    return unique_suggestions[:limit]

def summarize_reviews(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Generates structured summaries of reviews locally.
    """
    total_reviews = len(df)
    if total_reviews == 0:
        return {
            "summary": "No reviews uploaded yet.",
            "likes": [],
            "dislikes": [],
            "complaints": [],
            "suggestions": [],
            "keywords": []
        }
        
    pos_df = df[df["sentiment"] == "Positive"]
    neg_df = df[df["sentiment"] == "Negative"]
    
    # 1. Keywords
    top_keywords = extract_keywords(df["text"].tolist(), top_n=12)
    
    # 2. Key sentences for Likes (from positive reviews)
    likes_sentences = []
    for text in pos_df["text"].head(20):
        sentences = re.split(r'[.!?]+', text)
        for s in sentences:
            s_clean = s.strip()
            if 20 < len(s_clean) < 100 and any(w in s_clean.lower() for w in ["great", "good", "excellent", "love", "amazing", "best", "perfect", "easy", "satisfied"]):
                likes_sentences.append(s_clean)
    likes = list(set(likes_sentences))[:5]
    if not likes:
        likes = [s.strip() for text in pos_df["text"].head(3) for s in re.split(r'[.!?]+', text) if len(s.strip()) > 15][:3]
        
    # 3. Key sentences for Dislikes / Complaints
    dislikes_sentences = []
    complaints_sentences = []
    for text in neg_df["text"].head(20):
        sentences = re.split(r'[.!?]+', text)
        for s in sentences:
            s_clean = s.strip()
            if 20 < len(s_clean) < 100:
                lower_s = s_clean.lower()
                if any(w in lower_s for w in ["bad", "worst", "slow", "broken", "issue", "problem", "disappointed", "poor", "difficult"]):
                    dislikes_sentences.append(s_clean)
                if any(w in lower_s for w in ["charge", "cost", "customer service", "crash", "error", "fail", "useless", "waste"]):
                    complaints_sentences.append(s_clean)
                    
    dislikes = list(set(dislikes_sentences))[:5]
    if not dislikes:
        dislikes = [s.strip() for text in neg_df["text"].head(3) for s in re.split(r'[.!?]+', text) if len(s.strip()) > 15][:3]
        
    complaints = list(set(complaints_sentences))[:5]
    if not complaints:
        complaints = dislikes[:3]
        
    # 4. Actionable Suggestions
    suggestions = extract_suggestion_sentences(df["text"].tolist(), limit=5)
    if not suggestions:
        suggestions = ["Ensure system issues and customer complaints are addressed promptly.",
                       "Look closely into improving the features highlighted by negative sentiment reviews."]

    # 5. Overall Executive Summary Generation
    avg_rating = df["rating"].mean() if "rating" in df else 0
    pos_pct = (len(pos_df) / total_reviews) * 100 if total_reviews > 0 else 0
    neg_pct = (len(neg_df) / total_reviews) * 100 if total_reviews > 0 else 0
    
    sentiment_desc = "predominantly positive" if pos_pct > 60 else ("predominantly negative" if neg_pct > 40 else "mixed")
    
    top_kw_str = ", ".join([k["keyword"] for k in top_keywords[:3]])
    
    summary = (
        f"Based on our analysis of {total_reviews} customer reviews, the overall sentiment is {sentiment_desc} "
        f"with an average satisfaction score of {avg_rating:.1f}/5.0 stars. "
        f"The primary topics discussed by customers center around '{top_kw_str}'. "
        f"Specifically, {pos_pct:.1f}% of feedback was positive, highlighting strong strengths, while "
        f"{neg_pct:.1f}% of reviews highlighted critical bottlenecks that present opportunities for product or service updates."
    )
    
    return {
        "summary": summary,
        "likes": likes if likes else ["Customers expressed satisfaction with the overall service and features."],
        "dislikes": dislikes if dislikes else ["Some customers noted minor bugs and responsiveness delays."],
        "complaints": complaints if complaints else ["Occasional reports of performance lag and UI complexity."],
        "suggestions": suggestions,
        "keywords": top_keywords
    }
