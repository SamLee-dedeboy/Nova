from tracemalloc import start
import json
# import textblob_sa
from hugging_face_sa import hugFace
import pandas as pd
from collections import defaultdict
import utils
from pprint import pprint
from NewsSentiment import TargetSentimentClassifier

def add_sentiment(src_dataset_path, dst_dataset_path, subset=None):
    # init
    dataset = utils.getDataset(src_dataset_path)
    hugging_face_analyzer =  hugFace()
    articles = dataset if subset == None else dataset[0:subset]
    # process sentiment 
    for (ite, article) in enumerate(articles):
        print("ite: {}, id: {}".format(ite, article["id"]))
        # sentences = preprocess.article_to_sentences(article["content"])
        summary = article["summary"]
        # google
        # google_sentiment = google_sa.analyze_sentiment(sentences)
        # article["sentiment"] = {"score": google_sentiment.document_sentiment.score, "magnitude": google_sentiment.document_sentiment.magnitude}

        # hug face
        # hugFace_sentiment = hugging_face_analyzer.analyze_sentiment(sentences)
        hugFace_sentiment = hugging_face_analyzer.analyze_doc_sentiment(summary)
        article["sentiment"] = hugFace_sentiment 
        # textblob
        # blob_sentiment = textblob_sa.analyze_sentiment(sentences)
        # article["sentiment"] = blob_sentiment


    # save results
    print("-------------------------------")
    print("Sentiemnt Processing Done! Saving....")
    print("-------------------------------")
    utils.dict_to_json(articles, filepath=dst_dataset_path)


# add_sentiment(
#     src_dataset_path="data/test_articles_with_summary.json",
#     dst_dataset_path="data/processed_articles_with_summary.json",
#     subset=None
# )

def NewsSentiment_analysis(src_dataset_path=r'data/articles_w_entities.json', dst_dataset_path=r'data/articles_w_entities_sentiment.json', subset=None):
    tsc = TargetSentimentClassifier()
    articles = json.load(open(src_dataset_path))
    articles = articles if subset == None else articles[0:subset]
    res = []
    for index, article in enumerate(articles):
        print("analyzing article {}/{} ...".format(index+1, len(articles)))
        content = article['content']
        sentence_entities_dict = article['entities']
        sentences = utils.splitSentences(content)
        for sentence_index, sentence_entities in sentence_entities_dict.items():
            print("---- analyzing sentence {}/{} ...".format(sentence_index, len(list(sentence_entities_dict.keys()))))
            sentence = sentences[int(sentence_index)]
            sentence_sentiment_res = []
            for entity in sentence_entities:
                start_pos = entity['start_pos']
                length = entity['length']
                left, target, right = generate_triplet(start_pos, length, sentence)
                sentiment = tsc.infer_from_text(left, target, right)[0]
                # entity = {
                #     "start_pos": entity.start_pos,
                #     "length": entity.length,
                #     "word": entity.word,
                #     "wiki_id": entity.wiki_id,
                #     "ner_confidence": entity.ner_confidence,
                #     "type": entity.type,
                #     "sentiment": sentiment['class_label'],
                #     "sentiment_prob": sentiment['class_prob'],
                # }
                entity["sentiment"] = sentiment['class_label']
                entity["sentiment_prob"] = sentiment['class_prob']
                sentence_sentiment_res.append(entity)
                sentence_entities_dict[sentence_index] = sentence_sentiment_res
        res.append(article)
    utils.save_json(res, dst_dataset_path)
    
def generate_triplet(start_pos, length, sentence):
    return sentence[0:start_pos], sentence[start_pos: start_pos+length], sentence[start_pos+length:]

def sentiment_result_analysis(input_file=r'data/articles_w_entities_sentiment.json'):
    import sys
    articles = json.load(open(input_file))
    with open("test_result.txt", 'w') as f:
        sys.stdout = f
        for index, article in enumerate(articles):
            content = article['content']
            sentence_entities_dict = article['entities']
            sentences = utils.splitSentences(content)
            for sentence_index, sentence_entities in sentence_entities_dict.items():
                sentence = sentences[int(sentence_index)]
                not_neu_entities = []
                for entity in sentence_entities:
                    if entity['sentiment'] != 'neutral':
                        not_neu_entities.append(entity)
                if len(not_neu_entities) != 0:
                    print(sentence)

                    for entity in not_neu_entities:
                        print(entity['word'], entity['sentiment'])
                    print("----------------------")

if __name__ == '__main__':
    NewsSentiment_analysis()
    # sentiment_result_analysis()
    