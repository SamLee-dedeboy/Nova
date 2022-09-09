import scatter_data
import sentiment_processor
from data_types import *
def constructHexData(target_entity, cooccurrences, processed_data_manager, metadata):
    hex_data = EntityCooccurrences(entity=target_entity, cooccurrences={})
    target_cooccurrences = {}
    for entity2, cooccurr_ids in cooccurrences.items():
        articles = processed_data_manager.idsToArticles(cooccurr_ids)
        pos, neg, pos_articles, neg_articles = sentiment_processor.generate_sst_score(
            articles, 
            metadata.pos_max, metadata.pos_min,
            metadata.neg_max, metadata.neg_min
        )
        sst = Sentiment2D(pos=pos, neg=neg)
        target_cooccurrences[entity2] = HexEntity(
            entity=entity2, 
            article_ids=cooccurr_ids, 
            sst=sst,
            mask=False)
    hex_data.cooccurrences = target_cooccurrences
    return hex_data




