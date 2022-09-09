import scatter_data
import sentiment_processor
from data_types import *
def constructHexData(target_entity, cooccurrences, entity_data_dict, top_k=36):
    hex_data = EntityCooccurrences(entity=target_entity, sorted_cooccurrences_list=[])
    target_cooccurrences = []
    for entity2, cooccurr_ids in cooccurrences.items():
        if entity2 == target_entity: continue
        sst = Sentiment2D(entity_data_dict[entity2].pos_sst, entity_data_dict[entity2].neg_sst)
        target_cooccurrences.append(HexEntity(
            entity=entity2, 
            article_ids=cooccurr_ids, 
            sst=sst,
            mask=False
        ))
    target_cooccurrences.sort(reverse=True,key=lambda hex: len(hex.article_ids))
    hex_data.sorted_cooccurrences_list = target_cooccurrences[0:top_k]
    return hex_data




