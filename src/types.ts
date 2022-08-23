export enum ViewType {
   EntityScatter,
   OutletScatter,
   CooccurrScatter,
   Temporal,
   Article,
}
export class Path {
    title: string
    start: Number
    end: Number
}
export class ScatterOutletGraph {
    title: string
    type: ViewType
    nodes: ScatterOutletNode[]
}
export class ScatterOutletNode {
    text: string
    articles: number
    pos_articles: number
    neg_articles: number
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
export class OutletNode {
    x?: number
    y?: number
    text: string
    sentiment: string
    pos_articles: number
    neg_articles: number
    neu_articles: number
    pos_sent: number
    neg_sent: number
    neu_sent: number
    neu_pos_sent: number
    neu_neg_sent: number
    articles: Article[]
    dotted?: Boolean
    isCenter?: Boolean
}
export class OutletEdge {
    source: number
    target: number
}
export class Article {
    id: number
    headline: string
    journal: string
    timestamp: string
    content: string
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
    pos: Number
    neg: Number
}
export class Sentiment {
    pos: number
    neg: number
    pos_sentences: number
    neg_sentences: number
    normalized_sst?: number
}