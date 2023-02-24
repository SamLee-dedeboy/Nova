import time
import numpy as np 
from collections import defaultdict
# import swat_ned
import os
import sys
dirname = os.path.dirname(__file__)
relative_path = os.path.join(dirname, "rel_ned")
sys.path.insert(0, relative_path) 
from ned_utils import REL_NedAnalyzer
import utils
import json


def add_entity(src_dataset_path, dst_dataset_path, content_field, result_field, subset=None):
    # init
    start_time = time.time()
    dataset = json.load(open(src_dataset_path))
    rel_analyzer = REL_NedAnalyzer()
    entitiesToArticle_dict = defaultdict(set)
    # urlToName_dict = defaultdict(set)
    articles = dataset if subset == None else dataset[0:subset]
    
    res = []
    # split dataset in to batches
    for index, article in enumerate(articles):
        # process entities
        sentences = utils.splitSentences(article[content_field])
        # sentence format is required by REL NER
        sentences = [{'id': i, 'content': sentence} for i, sentence in enumerate(sentences)]
        article_entities = rel_analyzer.analyze_entity(sentences)
        print(article_entities)
        print("-------------------------------")
        print("article #{}/{} Analyze Done! Post-processing...".format(index, len(dataset)))
        print("-------------------------------")

        article[result_field] = addNERFields(article_entities)
        res.append(article)

    # entitiesToArticle_dict = {k: list(v) for k, v in entitiesToArticle_dict.items()}
    print("-------------------------------")
    print("Entity Processing Done! Saving....")
    print("-------------------------------")
    utils.save_json(res, filepath=dst_dataset_path)

def addNERFields(entities):
    for sentence_index, ner_res in entities.items():
        for index, entity_mention in enumerate(ner_res):
            ner_res[index] = {
                "start_pos": entity_mention[0],
                "length": entity_mention[1],
                "word": entity_mention[2],
                "wiki_id": entity_mention[3],
                "ner_confidence": entity_mention[5],
                "type": entity_mention[6],
            }
        entities[sentence_index] = ner_res
    return entities

