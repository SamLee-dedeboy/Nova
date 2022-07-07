export interface OutletNode {
    text: string,
    sentiment: string,
    pos_articles: number,
    neg_articles: number,
    neu_articles: number,
    pos_sent: number,
    neg_sent: number,
    neu_sent: number,
    articles: Article[]
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
export interface Sentiment {
    pos: number,
    neg: number,
    pos_sentences: number,
    neg_sentences: number,
}