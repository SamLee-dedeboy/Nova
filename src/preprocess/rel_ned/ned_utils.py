from http.server import HTTPServer
from REL.mention_detection import MentionDetection
from REL.entity_disambiguation import EntityDisambiguation
from REL.ner import Cmns, load_flair_ner
from REL.server import make_handler
from REL.utils import process_results



wiki_version = "wiki_2019"
model_path = 'ed-wiki-2019'
base_url = '/Users/samytlee/Documents/MediaBias/src/preprocess/rel_ned'

config = {
    "mode": "eval",
    # "model_path": "{}/{}/generated/model".format(base_url, wiki_version),
    "model_path": "{}/{}/model".format(base_url, model_path),
}
salience_threshold = 0.5

class REL_NedAnalyzer:
    def __init__(self):
        self.mention_detection = MentionDetection(base_url, wiki_version)
        self.tagger_ner = load_flair_ner("ner-fast")

        self.tagger_ngram = Cmns(base_url, wiki_version, n=5)
        self.model = EntityDisambiguation(base_url, wiki_version, config)
    
    def analyze_entity(self, dataset, preprocess_func=None):
        dataset = format_dataset(dataset, preprocess_func) 
        print("analyze_entity(): finding mentions...")
        mentions_dataset, n_mentions = self.mention_detection.find_mentions(dataset, self.tagger_ner)
        print("analyze_entity(): find mentions done...")
        print("analyze_entity(): model predicting...")
        predictions, timing = self.model.predict(mentions_dataset)
        print("analyze_entity(): model predict done...")
        print("analyze_entity(): processing results")
        results = process_results(mentions_dataset, predictions, dataset)
        print("analyze_entity(): process result done")
        # for id, sentence_entity in results.items():
        #     sentence_entity = sentence_entity[0]
        #     start_pos = sentence_entity[0]
        #     len = sentence_entity[1]
        #     # print(dataset[id][0])
        #     print(dataset[id][0][start_pos: start_pos + len])
        return results
        # doc_entity_dict = {} 
        # print("analyze_entity(): summarizing entities...")
        # for doc in results:
        #     entities = [entity[3] for entity in results[doc]] 
        #     doc_entity_dict[doc] = list(set(entities))
            # for entity in entities:
            #     mention = entity["mention"]
            #     prediction = entity["prediction"]
        # return doc_entity_dict

def format_dataset(dataset, preprocess_func=None):
    # dataset should have format [article], article = {"id":xxx, "content":xxx}
    processed = {}
    # attribute_name = "summary"
    attribute_name = "content"
    # user does some stuff, which results in the format below.
    for sentence in dataset:
        processed[sentence["id"]] = [sentence[attribute_name] if preprocess_func == None else preprocess_func(sentence[attribute_name]), []]
    return processed

if __name__ == "__main__":
    rel_analyzer = REL_NedAnalyzer()
    sentences = [
        {
            "id": 0, 
            "content": "I like Trump but I don't like Biden." 
        },
        {
            "id": 1, 
            "content": "I like Biden but I don't like Trump." 
        },
    ]
    sentence_entities = rel_analyzer.analyze_entity(sentences)