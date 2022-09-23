export class CooccurrHexView {
    title: string
    data: EntityCooccurrences
}

export class EntityScatterView {
    title: string
    data: {
        nodes: ScatterNode[], 
        max_articles: number, 
        min_articles: number, 
    }
}

export class EntityCooccurrences {
    target: HexEntity
    sorted_cooccurrences_list: HexEntity[]
}
export class HexEntity {
    entity: string
    article_ids: number[]
    sst: Sentiment2D
}

export class ScatterNode {
    text: string
    article_ids: number[]
    pos_article_ids: number[]
    neg_article_ids: number[]
    pos_sst: number
    neg_sst: number
    topicBins: {[id: string]: {pos: number, neg: number}}
}
export class OutletNodeInfo {
    text: string
    pos_articles: number
    neg_articles: number
    pos_score: number
    neg_score: number
}
export class EntityInfo {
    name: string
    outlet: string
    num_of_mentions: number
    sst_ratio?: {
        pos_artcs: number, neg_artcs: number, 
        pos: number, neg: number,
        pos_max: number, pos_min: number,
        neg_max: number, neg_min: number
    }
    articles?: Article[]
    mentions_grouped?: {
        pos: {[id: string]: number}
        neg: {[id: string]: number}
    }
    articles_topic_dict?: {[id: string]: {pos: number, neg: number}}
    article_ids?: number[]
}

export class CooccurrEntityInfo extends EntityInfo{
    target: string
    target_num_of_mentions: number
}

export class Article {
    id: number
    headline: string
    journal: string
    timestamp: string
    content: string
    summary: string
    top_level_topic: string
    second_level_topic: string
    entities: EntityMention[]
    sentiment: Sentiment
}

export class EntityMention {
    start_pos: number
    length: number
    mention_text: string
    wiki_id: string
    er_confidence: number
    ed_confidence: number
    ner_type: number
}
export class Sentiment2D {
    pos: number
    neg: number
}

export enum SentimentType {
    neu,
    pos,
    neg,
    mix,
    unknown,
}
export class Sentiment {
    label: string
    score: number
}