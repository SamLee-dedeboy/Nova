from dataclasses import dataclass
import json


@dataclass
class ScatterNode:
    text: str
    article_ids: list
    pos_article_ids: list
    neg_article_ids: list
    pos_sst: float
    neg_sst: float
    topicBins: dict

@dataclass
class EntityScatterData:
    nodes: list
    max_articles: int
    min_articles: int

# @dataclass
# class OverallEntityScatterData(EntityScatterData):
#     mentions_groupby_outlet_dict: dict

@dataclass
class EntityCooccurrences:
    entity: str
    sorted_cooccurrences_list: list

@dataclass
class Sentiment2D:
    pos: float
    neg: float

@dataclass
class HexEntity:
    entity: str
    article_ids: list
    sst: Sentiment2D
    mask: bool
@dataclass
class SentimentScatterMetaData:
    max_articles: int
    min_articles: int
    pos_max: int
    pos_min: int
    neg_max: int
    neg_min: int
@dataclass
class OverallSentimentScatterMetaData(SentimentScatterMetaData):
    pos_max_grouped: dict
    pos_min_grouped: dict
    neg_max_grouped: dict
    neg_min_grouped: dict
    mentions_groupby_outlet_dict: dict
    




