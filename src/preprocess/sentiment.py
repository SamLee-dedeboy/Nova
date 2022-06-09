import preprocess
# import textblob_sa
from hugging_face_sa import hugFace
import pandas as pd
from collections import defaultdict

def add_sentiment(src_dataset_path, dst_dataset_path, subset=None):
    # init
    dataset = preprocess.getDataset(src_dataset_path)
    hugging_face_analyzer =  hugFace()
    articles = dataset if subset == None else dataset[0:subset]
    # process sentiment 
    for (ite, article) in enumerate(articles):
        print("ite: {}, id: {}".format(ite, article["id"]))
        sentences = preprocess.article_to_sentences(article["content"])
        # google
        # google_sentiment = google_sa.analyze_sentiment(sentences)
        # article["sentiment"] = {"score": google_sentiment.document_sentiment.score, "magnitude": google_sentiment.document_sentiment.magnitude}

        # hug face
        hugFace_sentiment = hugging_face_analyzer.analyze_sentiment(sentences)
        article["sentiment"] = hugFace_sentiment 
        # textblob
        # blob_sentiment = textblob_sa.analyze_sentiment(sentences)
        # article["sentiment"] = blob_sentiment


    # save results
    print("-------------------------------")
    print("Sentiemnt Processing Done! Saving....")
    print("-------------------------------")
    preprocess.dict_to_json(articles, filepath=dst_dataset_path)