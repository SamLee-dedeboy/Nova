import json
class RawDataManager():
    def __init__(self):
        self.outlet_article_dict = load_articles()
        self.candidate_entity = load_candidate_entities()
        self.candidate_entity_grouped = load_candidate_entities_grouped()
        self.entity_cooccurrences = load_entity_cooccurrences()
        self.entity_cooccurrences_grouped = load_entity_cooccurrences_grouped()


def load_articles(filepath="data/outlet_article_dict.json"):
    return json.load((open(filepath)))

def load_candidate_entities(filepath="data/candidate_entity_mention_articles.json"):
    return json.load((open(filepath)))["entity_article_dict"]

def load_candidate_entities_grouped(filepath="data/candidate_entities_groupby_outlet.json"):
    return json.load((open(filepath)))

def load_entity_cooccurrences(filepath="data/entity_cooccurrences.json"):
    return json.load((open(filepath)))

def load_entity_cooccurrences_grouped(filepath="data/entity_cooccurrences_groupby_outlet.json"):
    return json.load((open(filepath)))



