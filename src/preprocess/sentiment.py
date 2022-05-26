from re import S
import preprocess
import google_sa
import textblob_sa
from hugging_face_sa import hugFace
import pandas as pd
from collections import defaultdict
import time
import swat_ned
import rel_ned
# init
start_time = time.time()
dataset = preprocess.getSingleTopicDataset()
hugging_face_analyzer =  hugFace()
entitiesToArticle_dict = defaultdict(list)
urlToName_dict = defaultdict(set)
articles = dataset[0:10]
init_time = time.time() - start_time
print("--- init time: {} ---".format(init_time))

# process sentiment & entity
for (ite, article) in enumerate(articles):
    print("ite: {}, id: {}".format(ite, article["id"]))
    sentences = preprocess.article_to_sentences(article["content"])

    # google entities
    # google_entities = google_sa.analyze_entity(sentences)
    # for entity in google_entities:
    #     entitiesToArticle_dict[entity.metadata["wikipedia_url"]].append(article["id"])
    #     urlToName_dict[entity.metadata["wikipedia_url"]].add(entity.name)
    # article["entities"] = [next(iter((urlToName_dict[entity.metadata["wikipedia_url"]]))) for entity in google_entities] 

    # swat entities
    # swat_entities, entityIdToName_dict = swat_ned.getEntityList(sentences, article["headline"])
    # for entityId in swat_entities:
    #     entitiesToArticle_dict[entityId].append(article["id"])
    #     urlToName_dict[entityId].update(entityIdToName_dict[entityId])
    # article["entities"] = [next(iter((urlToName_dict[entityId]))) for entityId in swat_entities]

    # REL
    rel_entities = rel_ned.getEntityList(article["content"])
    for entity in rel_entities:
        entitiesToArticle_dict[entity].append(article["id"])
    article["entities"] = rel_entities

    # sentiment
    # google
    # google_sentiment = google_sa.analyze_sentiment(sentences)
    # article["sentiment"] = {"score": google_sentiment.document_sentiment.score, "magnitude": google_sentiment.document_sentiment.magnitude}

    # hug face
    hugFace_sentiment = hugging_face_analyzer.analyze_sentiment(sentences)
    article["sentiment"] = hugFace_sentiment 
    # textblob
    # blob_sentiment = textblob_sa.analyze_sentiment(sentences)
    # article["sentiment"] = blob_sentiment

process_time = time.time() - init_time
print("--- process time: {} ---".format(process_time))

# save results
# convert set to list because set is not serializable in json
urlToName_dict = {k: list(v) for k, v in urlToName_dict.items()}
preprocess.dict_to_json(entitiesToArticle_dict, filepath="data/nel_entities.json")
preprocess.dict_to_json(articles, filepath="data/processed_articles_hugFace_nel.json")
# preprocess.dict_to_json(urlToName_dict, filepath="data/WikiIDToEntityName.json")
save_time = time.time() - process_time
print("--- save time: {} ---".format(save_time))
print("--- total time: {} ---".format(time.time() - start_time))