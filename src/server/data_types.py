from dataclasses import dataclass
import json


@dataclass
class ScatterNode:
    text: str
    article_ids: list
    pos_articles: int
    neg_articles: int
    pos_sst: float
    neg_sst: float
    topicBins: dict

@dataclass
class EntityScatterData:
    nodes: list
    max_articles: int
    min_articles: int

@dataclass
class OverallEntityScatterData(EntityScatterData):
    mentions_groupby_outlet_dict: dict
    pos_max: dict
    pos_min: dict
    neg_max: dict
    neg_min: dict




