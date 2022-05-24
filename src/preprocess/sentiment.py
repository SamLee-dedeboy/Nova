from ast import operator, parse
from unittest import result
import preprocess
import google_sa
from hugging_face_sa import hugFace
import pandas as pd

dataset = preprocess.getDataset()
parse_result = {
    "id": [], 
    "google_results": [],
    "hugging_face_results": [],
}

hugging_face_analyzer =  hugFace()

for article in dataset[:3]:
    parse_result["id"].append(article["id"])

    # hug face
    sentences = preprocess.article_to_sentences(article["content"])
    res = hugging_face_analyzer.sentiment_analyze(sentences)
    res_pos = sum(i for i in res if i >= 0)
    res_neg = sum(i for i in res if i < 0)
    hugFace_res = {"pos": res_pos, "neg": res_neg, "score": res_pos+res_neg}
    parse_result["hugging_face_results"].append(hugFace_res)
    print(hugFace_res)

    # google
    google_response = google_sa.analyze_sentiment(sentences)
    google_res = {"magnitude": google_response.document_sentiment.magnitude, "score": google_response.document_sentiment.score}
    parse_result["google_results"].append(google_res)
    print(google_res)
    print("----------------------")

result_df = pd.DataFrame(data=parse_result)
preprocess.df_to_csv(result_df)