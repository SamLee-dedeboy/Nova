import time
import numpy as np 
import preprocess
from collections import defaultdict
# import swat_ned
import os
import sys
dirname = os.path.dirname(__file__)
relative_path = os.path.join(dirname, "rel_ned")
sys.path.insert(0, relative_path) 
from ned_utils import REL_NedAnalyzer
import preprocess
def add_entity(src_dataset_path, dst_dataset_path, entity_list_path, subset=None):
    # init
    start_time = time.time()
    dataset = preprocess.getDataset(src_dataset_path)
    rel_analyzer = REL_NedAnalyzer()
    entitiesToArticle_dict = defaultdict(set)
    # urlToName_dict = defaultdict(set)
    articles = dataset if subset == None else dataset[0:subset]
    
    # split dataset in to batches
    batch_size = 100
    article_batches = np.array_split(articles, int(len(articles)/batch_size))

    res = []
    for (batch_index,batch) in enumerate(article_batches):
        # process entities
        # article_entity_dict = rel_analyzer.analyze_entity(batch, lambda content: " ".join(preprocess.article_to_sentences(content)))
        article_entity_dict = rel_analyzer.analyze_entity(batch)
        print(article_entity_dict)
        print("-------------------------------")
        print("Batch {} Analyze Done! Post-processing...".format(batch_index))
        print("-------------------------------")
        for article in batch:
            if article["id"] in article_entity_dict.keys():
                entity_list = article_entity_dict[article["id"]]
            else:
                entity_list = []
            new_attribute_name = "summary_entities"
            article[new_attribute_name] = entity_list
            res.append({
                "id": article["id"],
                new_attribute_name: entity_list,
            })
            # for entity in [result[3] for result in entity_list]:
            #     entitiesToArticle_dict[entity].add(article["id"])

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
            # rel_entities = rel_analyzer.analyze_entity(article)
            # for entity in rel_entities:
            #     entitiesToArticle_dict[entity].append(article["id"])
            # article["entities"] = rel_entities

    entitiesToArticle_dict = {k: list(v) for k, v in entitiesToArticle_dict.items()}
    # urlToName_dict = {k: list(v) for k, v in urlToName_dict.items()}
    print("-------------------------------")
    print("Entity Processing Done! Saving....")
    print("-------------------------------")
    # preprocess.dict_to_json(entitiesToArticle_dict, filepath=entity_list_path)
    # preprocess.dict_to_json(articles, filepath=dst_dataset_path)
    preprocess.dict_to_json(res, filepath=dst_dataset_path)
    # preprocess.dict_to_json(urlToName_dict, filepath="data/WikiIDToEntityName.json")