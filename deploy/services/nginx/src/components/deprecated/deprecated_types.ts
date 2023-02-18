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

export class Path {
    title: string
    start: Number
    end: Number
}

export class TemporalBins {
    [id: string] : {[id: string]: Article[]}
}

export enum ViewType {
   EntityScatter,
   OutletScatter,
   CooccurrHex,
   Temporal,
   Article,
   Detail,
}

export interface PanelView {
    title: string,
    type: ViewType,
    data: any,
}

export class OutletScatterView implements PanelView {
    title: string
    type: ViewType.OutletScatter
    data: {nodes: ScatterNode[], max_articles: number, min_articles: number}
}
export class TemporalView implements PanelView {
    title: string
    type: ViewType.Temporal
    data: TemporalBins
}
export class ArticleView implements PanelView {
    title: string
    type: ViewType.Article
    data: any[]
}
export class DetailView implements PanelView {
    title: string
    type: ViewType.Detail
    data: {outlet_scatter_data: ScatterNode[], temporal_data: TemporalBins}
}