import scatter_data
import sentimentUtils
from data_types import *
def constructHexData(target_entity, cooccurrences, entity_data_dict, top_k=36):
    hex_data = EntityCooccurrences(target=None, sorted_cooccurrences_list=[])
    target_cooccurrences = []
    for entity2, cooccurr_ids in cooccurrences.items():
        if entity2 == target_entity: 
            sst = Sentiment2D(entity_data_dict[entity2].pos_sst, entity_data_dict[entity2].neg_sst)
            hex_data.target = HexEntity( entity=entity2, article_ids=cooccurr_ids, sst=sst)
            continue
        sst = Sentiment2D(entity_data_dict[entity2].pos_sst, entity_data_dict[entity2].neg_sst)
        target_cooccurrences.append(HexEntity(
            entity=entity2, 
            article_ids=cooccurr_ids, 
            sst=sst,
        ))
    target_cooccurrences.sort(reverse=True,key=lambda hex: len(hex.article_ids))
    hex_data.sorted_cooccurrences_list = target_cooccurrences[0:top_k]
    return hex_data
def constructGroupedHexData(target_entity, cooccurrences, entity_data_dict, processed_data, metadata):
    top_k = 36
    hex_data = EntityCooccurrences(target=None, sorted_cooccurrences_list=[])
    target_cooccurrences = []
    for entity2, cooccurr_ids in cooccurrences.items():
        if entity2 == target_entity: 
            sst = Sentiment2D(entity_data_dict[entity2].pos_sst, entity_data_dict[entity2].neg_sst)
            hex_data.target = HexEntity( entity=entity2, article_ids=cooccurr_ids, sst=sst)
            continue
        articles = processed_data.idsToArticles(cooccurr_ids)
        pos, neg, pos_articles, neg_articles = sentimentUtils.generate_sst_score(
            articles,
            metadata.pos_max, metadata.pos_min,
            metadata.neg_max, metadata.neg_min,
        )
        sst = Sentiment2D(pos, neg)
        # sst = Sentiment2D(entity_data_dict[entity2].pos_sst, entity_data_dict[entity2].neg_sst)
        target_cooccurrences.append(HexEntity(
            entity=entity2, 
            article_ids=cooccurr_ids, 
            sst=sst,
        ))
    target_cooccurrences.sort(reverse=True,key=lambda hex: len(hex.article_ids))
    hex_data.sorted_cooccurrences_list = target_cooccurrences[0:top_k]
    return hex_data

def get_entity_candidates(center_entity, entity_cooccurrences_grouped, grouped_node_dict, processed_data, overall_node_dict, grouped_metadata):
    res = []
    merged_entities = []
    for outlet, cooccurrences_dict in entity_cooccurrences_grouped.items():
        cooccurrences = cooccurrences_dict[center_entity]
        hex_data = constructGroupedHexData(center_entity, cooccurrences, grouped_node_dict[outlet], processed_data, grouped_metadata)
        res.append({"entity": center_entity, "outlet": outlet, "cooccurrences_data": hex_data})
        entities = list(map(lambda hex_entity: hex_entity.entity, hex_data.sorted_cooccurrences_list))
        merged_entities = list(set(merged_entities + entities))
        # sort by freq in overall scatter
    merged_entities.sort(reverse=True, key=lambda entity: len(overall_node_dict[entity].article_ids))

    return res, merged_entities





