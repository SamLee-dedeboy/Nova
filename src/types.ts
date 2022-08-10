export enum ViewType {
   EntityScatter,
   OutletScatter,
   Temporal, 
}
export interface Path {
    title: string,
    start: Number,
    end: Number,
}
export interface ScatterOutletGraph {
    title: string,
    type: ViewType,
    nodes: ScatterOutletNode[]
}
export interface ScatterOutletNode {
    text: string,
    articles: number,
    pos_articles: number,
    neg_articles: number,
    pos_sst: number,
    neg_sst: number,
    topicBins: {[id: string]: {topic: string, freq: number}}
}
export interface OutletNodeInfo {
    text: string,
    pos_articles: number,
    neg_articles: number,
    pos_score: number,
    neg_score: number,
}
export interface OutletNode {
    x?: number,
    y?: number,
    text: string,
    sentiment: string,
    pos_articles: number,
    neg_articles: number,
    neu_articles: number,
    pos_sent: number,
    neg_sent: number,
    neu_sent: number,
    neu_pos_sent: number,
    neu_neg_sent: number,
    articles: Article[],
    dotted?: Boolean,
    isCenter?: Boolean, 
}
export interface OutletEdge {
    source: number,
    target: number,
}
export interface Article {
    id: number,
    headline: string,
    journal: string,
    timestamp: string,
    content: string,
    top_level_topic: string,
    second_level_topic: string,
    entities: EntityMention[],
    sentiment: Sentiment[],
}
export interface EntityMention {
    start_pos: number,
    length: number,
    mention_text: string,
    wiki_id: string,
    er_confidence: number,
    ed_confidence: number,
    ner_type: number
}
export interface Sentiment2D {
    pos: Number,
    neg: Number,
}
export interface Sentiment {
    pos: number,
    neg: number,
    pos_sentences: number,
    neg_sentences: number,
}