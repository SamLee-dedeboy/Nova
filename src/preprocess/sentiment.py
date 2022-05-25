from re import S
import preprocess
import google_sa
import textblob_sa
from hugging_face_sa import hugFace
import pandas as pd
from collections import defaultdict
import time

start_time = time.time()
dataset = preprocess.getSingleTopicDataset()
# parse_result = {
#     "id": [], 
#     # "google_results": [],
#     # "hugging_face_results": [],
#     # "textblob_results": [],
#     "entities":[]
# }

# hugging_face_analyzer =  hugFace()
entitiesToArticle_dict = defaultdict(list)
urlToName_dict = defaultdict(set)
articles = dataset
init_time = time.time() - start_time
print("--- init time: {} ---".format(init_time))
for (ite, article) in enumerate(articles):
    print("ite: {}, id: {}".format(ite, article["id"]))
    # parse_result["id"].append(article["id"])

    sentences = preprocess.article_to_sentences(article["content"])

    # google
    google_entities = google_sa.analyze_entity(sentences)
    google_sentiment = google_sa.analyze_sentiment(sentences)

    
    for entity in google_entities:
        entitiesToArticle_dict[entity.metadata["wikipedia_url"]].append(article["id"])
        urlToName_dict[entity.metadata["wikipedia_url"]].add(entity.name)
    article["entities"] = [next(iter((urlToName_dict[entity.metadata["wikipedia_url"]]))) for entity in google_entities] 
    article["sentiment"] = {"score": google_sentiment.document_sentiment.score, "magnitude": google_sentiment.document_sentiment.magnitude}

    # google_res = {"magnitude": google_response.document_sentiment.magnitude, "score": google_response.document_sentiment.score}
    # parse_result["google_results"].append(google_res)
    # google_response.entities.sort(key=lambda e: e.salience, reverse=True)
    # entity_list = []
    # for entity in google_response.entities:
    #    entity_dict = {
    #         "name": entity.name,
    #         "salience": entity.salience,
    #         "sentiment_score": entity.sentiment.score,
    #         "sentiment_magnitude": entity.sentiment.magnitude,
    #    } 
    #    entity_list.append(entity_dict)
    # print(*entity_list, sep="\n")
    # print("---------------")

# parse_result["entities"].append(entity_list)

    # hug face
    # hugFace_res = hugging_face_analyzer.analyze_sentiment(sentences)
    # parse_result["hugging_face_results"].append(hugFace_res)

    # textblob
    # blob_res = textblob_sa.analyze_sentiment(sentences)
    # parse_result["textblob_results"].append(blob_res)

# entities_df = pd.DataFrame(data=entitiesToArticle_dict)
# articles_df = pd.DataFrame(data=articles)

# convert set to list because set is not serializable in json
process_time = time.time() - init_time
print("--- process time: {} ---".format(process_time))
urlToName_dict = {k: list(v) for k, v in urlToName_dict.items()}
preprocess.dict_to_json(entitiesToArticle_dict, filepath="data/eneities.json")
preprocess.dict_to_json(articles, filepath="data/processed_articles.json")
preprocess.dict_to_json(urlToName_dict, filepath="data/urlToEntityName.json")
save_time = time.time() - process_time
print("--- save time: {} ---".format(save_time))
print("--- total time: {} ---".format(time.time() - start_time))