import * as dfd from "danfojs"
import * as _ from 'lodash'
import { Series } from "danfojs/dist/danfojs-base"
import { Article, SentimentType, Sentiment2D, EntityScatterView, OutletScatterView, ScatterNode, ViewType } from "../types"

export function constructEntityGraph(entity_mentions_grouped, article_dict) {
    var r_graph_dict = {}
    let r_min_articles = Object.keys(article_dict).length
    let r_max_articles = 0
    let r_pos_max_articles = 0
    let r_pos_min_articles = r_min_articles
    let r_neg_max_articles = 0
    let r_neg_min_articles = r_min_articles
    var r_node_article_id_dict = {}
    // generate min/max of articles
    Object.keys(entity_mentions_grouped).forEach(outlet => {
        const entity_mentions = entity_mentions_grouped[outlet]
        entity_mentions.forEach(entity_mention => {
            const mentioned_article_ids = entity_mention.article_ids
            const mentioned_articles = idsToArticles(mentioned_article_ids, article_dict)
            const pos_articles = mentioned_articles.filter(article => article.sentiment.label === "POSITIVE")
            const neg_articles = mentioned_articles.filter(article => article.sentiment.label === "NEGATIVE")
            if(pos_articles.length > r_pos_max_articles) r_pos_max_articles = pos_articles.length
            if(pos_articles.length < r_pos_min_articles) r_pos_min_articles = pos_articles.length
            if(neg_articles.length > r_neg_max_articles) r_neg_max_articles = neg_articles.length
            if(neg_articles.length < r_neg_min_articles) r_neg_min_articles = neg_articles.length
            if(mentioned_articles.length > r_max_articles) r_max_articles = mentioned_articles.length
            if(mentioned_articles.length < r_min_articles) r_min_articles = mentioned_articles.length
        })
    })
    // construct view 
    Object.keys(entity_mentions_grouped).forEach(outlet => {
        const entity_mentions = entity_mentions_grouped[outlet]
        var entity_scatter_view: EntityScatterView= {
            title: outlet, 
            type: ViewType.EntityScatter, 
            data: {nodes: [], max_articles: 0, min_articles: 0}
        }
        entity_mentions.forEach(entity_mention => {
            const entity = entity_mention.entity
            const mentioned_article_ids = entity_mention.article_ids
            const mentioned_articles = idsToArticles(mentioned_article_ids, article_dict)
            const label = `${entity}-${outlet}` 
            const node = construct_node(
                mentioned_articles, label, 
                r_pos_max_articles, r_pos_min_articles,
                r_neg_max_articles, r_neg_min_articles
            )
            r_node_article_id_dict[label] = mentioned_article_ids
            entity_scatter_view.data.nodes.push(node)
            entity_scatter_view.data.max_articles = r_max_articles
            entity_scatter_view.data.min_articles = r_min_articles
        })
        r_graph_dict[outlet] = entity_scatter_view
    })
    return {
        r_graph_dict, 
        r_max_articles, r_min_articles, 
        r_pos_max_articles, r_pos_min_articles,
        r_neg_max_articles, r_neg_min_articles,
        r_node_article_id_dict
    }
}

export function constructOverallEntityGraph(entity_mentions, article_dict, node_article_id_dict) {
    let r_min_articles = Object.keys(article_dict).length
    let r_max_articles = 0
    let r_pos_max_articles: any[] = []
    let r_pos_min_articles: any[] = new Array(r_min_articles)
    let r_neg_max_articles: any = []
    let r_neg_min_articles: any[] = new Array(r_min_articles)
    let entity_scatter_view: EntityScatterView= {
        title: "Overall", 
        type: ViewType.EntityScatter, 
        data: {nodes: [], max_articles: 0, min_articles: 0, mentions_groupby_outlet_dict: {}}
    }
    Object.keys(entity_mentions).forEach(entity => {
        const mentioned_article_ids = entity_mentions[entity]
        const mentioned_articles = idsToArticles(mentioned_article_ids, article_dict)
        const pos_articles = mentioned_articles.filter(article => article.sentiment.label === "POSITIVE")
        const neg_articles = mentioned_articles.filter(article => article.sentiment.label === "NEGATIVE")
        if(pos_articles.length > r_pos_max_articles.length) r_pos_max_articles = pos_articles
        if(pos_articles.length < r_pos_min_articles.length) r_pos_min_articles = pos_articles
        if(neg_articles.length > r_neg_max_articles.length) r_neg_max_articles = neg_articles
        if(neg_articles.length < r_neg_min_articles.length) r_neg_min_articles = neg_articles
        if(mentioned_articles.length > r_max_articles) r_max_articles = mentioned_articles.length
        if(mentioned_articles.length < r_min_articles) r_min_articles = mentioned_articles.length
    })
    entity_scatter_view.data.max_articles = r_max_articles
    entity_scatter_view.data.min_articles = r_min_articles
    entity_scatter_view.data.pos_max = article_num_groupby_outlet_dict(r_pos_max_articles)
    entity_scatter_view.data.pos_min = article_num_groupby_outlet_dict(r_pos_min_articles)
    entity_scatter_view.data.neg_max = article_num_groupby_outlet_dict(r_neg_max_articles)
    entity_scatter_view.data.neg_min = article_num_groupby_outlet_dict(r_neg_min_articles)
    
    Object.keys(entity_mentions).forEach(entity => {
        const mentioned_article_ids = entity_mentions[entity]
        const mentioned_articles = idsToArticles(mentioned_article_ids, article_dict)
        const mentions_groupby_outlet_dict = _.groupBy(mentioned_articles, (article) => (article.journal))
        Object.keys(mentions_groupby_outlet_dict).forEach(outlet => {
            const mention_list = mentions_groupby_outlet_dict[outlet]
            const pos_mentions = mention_list.filter(article => article.sentiment.label === "POSITIVE")
            const neg_mentions = mention_list.filter(article => article.sentiment.label === "NEGATIVE")
            mentions_groupby_outlet_dict[outlet] = {pos: pos_mentions.length, neg: neg_mentions.length}
        })
        const label: string = entity 
        const node = construct_node(
            mentioned_articles, label,
            r_pos_max_articles.length, r_pos_min_articles.length,
            r_neg_max_articles.length, r_neg_min_articles.length
        )
        node_article_id_dict[label] = mentioned_article_ids
        entity_scatter_view.data.nodes.push(node)
        entity_scatter_view.data.mentions_groupby_outlet_dict[entity] = mentions_groupby_outlet_dict
    })
    // return {entity_scatter_view, r_max_articles, r_min_articles, r_node_article_id_dict}
    return entity_scatter_view
}

function article_num_groupby_outlet_dict(articles: Article[]) {
    return _.mapValues(
        _.groupBy(
        articles.map(article => {return {article_id: article.id, journal: article.journal}}), 
        (article) => article.journal
        ),
        (article_ids) => { return article_ids.length}
    )
}

/**
 * @deprecated 
 */
export function constructOutletGraph(entity_mentions, outlet_set, article_dict) {
    var r_graph_dict = {}
    var r_min_articles = Object.keys(article_dict).length
    var r_max_articles = 0
    entity_mentions.forEach(entity_mention => {
        const entity = entity_mention[0]
        var outlet_scatter_view: OutletScatterView= {title: entity, type: ViewType.OutletScatter, data: []}
        // get articles mentioneding this entity
        const mentioned_articles = idsToArticles(entity_mention[1], article_dict)
        const outlet_article_dict = constructOutletArticleDict(mentioned_articles)

        outlet_set.forEach(outlet => {
            // const article_ids = outlet_article_dict[outlet]
            // const articles = idsToArticles(article_ids, article_dict)
            const articles = outlet_article_dict[outlet]
            const article_num = articles.length
            if(article_num > r_max_articles) r_max_articles = article_num
            if(article_num < r_min_articles) r_min_articles = article_num

            const node = construct_node(
                articles, outlet,
                pos_max_articles, pos_min_articles,
                neg_max_articles, neg_min_articles) 
            outlet_scatter_view.data.push(node)
        }) 
        // center node
        // var center_node = self.construct_node(self.articles, target)
        // center_node["isCenter"] = true
        // graph.nodes.push(center_node)
        r_graph_dict[entity] = outlet_scatter_view
    })
    return {r_graph_dict, r_max_articles, r_min_articles}
}

export function idsToArticles(article_ids, article_dict) {
    if(!article_ids) return []
    return article_ids.reduce(function(article_list, id) { article_list.push(article_dict[id]); return article_list; }, [])
}
export function constructOutletArticleDict(articles) {
    return _.groupBy(articles, (article) => (article.journal))
    // const articles_df = new dfd.DataFrame(articles)
    // const grouped_df = articles_df.groupby(["journal"])
    // return grouped_df.colDict
    
    var outlet_article_dict = {} 
    articles.forEach(article => {
        outlet_article_dict[article.journal] = outlet_article_dict[article.journal] || []
        outlet_article_dict[article.journal].push(article.id)
    })
    return outlet_article_dict
}

const pos_mean = 0.824299592297731 
const pos_std = 0.255743833288008
const pos_median = 0.9539622269802468
const neg_mean = 0.9315541011156876
const neg_std = 0.1554181764759948 
const neg_median = 0.9864524463801179

export function pos_score(pos_article_num: number, pos_max: number, pos_min: number) {
    return Math.pow((pos_article_num-pos_min)/(pos_max-pos_min), 0.4)
}
export function neg_score(neg_article_num: number, neg_max: number, neg_min: number) {
    return Math.pow((neg_article_num-neg_min)/(neg_max-neg_min), 0.3)
}

export function generate_sst_score(articles: Article[], pos_max: number, pos_min: number, neg_max: number, neg_min: number) {
    const pos_artcs = articles.filter(article => article.sentiment.label === "POSITIVE").map(article => article.sentiment.score)
    const neg_artcs = articles.filter(article => article.sentiment.label === "NEGATIVE").map(article => article.sentiment.score)
    const pos = pos_score(pos_artcs.length, pos_max, pos_min)
    const neg = neg_score(neg_artcs.length, neg_max, neg_min)
    return {pos, neg, pos_artcs, neg_artcs}

    const median = (x) => { 
        x = x.sort();
        var idx = Math.round(x.length / 2);
        return x[idx];
    }
    const std = (x) => {
        var avg = _.sum(x) / x.length;
        return Math.sqrt(_.sum(_.map(x, (i) => Math.pow((i - avg), 2))) / x.length);
    }
    // const subset_pos_mean = _.mean(pos_artcs)
    // const subset_pos_median = median(pos_artcs)
    // const subset_pos_std = std(pos_artcs)
    // const subset_pos_skew = sigmoid(3*(subset_pos_mean-pos_mean)/pos_std) || 0

    // const subset_neg_mean = Math.abs(_.mean(neg_artcs))
    // const subset_neg_median = Math.abs(median(neg_artcs))
    // const subset_neg_std = std(neg_artcs)
    // const subset_neg_skew = sigmoid(3*(subset_neg_mean-neg_mean)/neg_std) || 0
    

} 

export function construct_node(
articles: Article[], label, 
pos_max_articles, pos_min_articles, 
neg_max_articles, neg_min_articles) {
    let node: ScatterNode;  
    const article_num = articles?.length || 0
    if(article_num == 0) {
        node = {
            text: label,
            articles: [],
            pos_articles: 0,
            neg_articles: 0,
            pos_sst: 0,
            neg_sst: 0,
            topicBins: {}
        }
    } else {
        let topicBins = {}
        let article_ids: number[] = []
        articles.forEach(article => {
            article_ids.push(article.id)
            if(!topicBins[article.top_level_topic]) {
                topicBins[article.top_level_topic] = {pos: 0, neg: 0}
            }
            if(article.sentiment.label === "POSITIVE")
                topicBins[article.top_level_topic].pos += 1
            else
                topicBins[article.top_level_topic].neg += 1
        })
        const {pos, neg, pos_artcs, neg_artcs} = generate_sst_score(articles, pos_max_articles, pos_min_articles, neg_max_articles,neg_min_articles)
        node = {
            text: label,
            articles: article_ids,
            pos_articles: pos_artcs.length,
            neg_articles: neg_artcs.length,
            pos_sst: pos,
            neg_sst: neg,
            topicBins: topicBins,
        }
    }
    return node
}

// export function categorizeNode(article_ids: number[], segment_sst: Sentiment2D, article_dict) {
//     const articles = idsToArticles(article_ids, article_dict)
//     const pos_artcs = articles.filter(article => article.sentiment.label === "POSITIVE").map(article => article.sentiment.score)
//     const neg_artcs = articles.filter(article => article.sentiment.label === "NEGATIVE").map(article => article.sentiment.score)
//     const pos = pos_score(pos_artcs)
//     const neg = neg_score(neg_artcs)
//     if(pos < segment_sst.pos && neg < segment_sst.neg) return SentimentType.neu
//     if(pos > segment_sst.pos && neg < segment_sst.neg) return SentimentType.pos
//     if(pos < segment_sst.pos && neg > segment_sst.neg) return SentimentType.neg
//     if(pos > segment_sst.pos && neg > segment_sst.neg) return SentimentType.mix
//     return SentimentType.neu
// }



export function processArticleDict(outlet_article_dict) {
    let r_article_dict: {[id: string]: any} = {}
    let r_article_bins_dict: {[id: string]: any}  = {}
    let r_outlet_article_num_dict = {}
    let min_timestamp = new Date("3000-10-10")
    let max_timestamp = new Date("1000-10-10")
    Object.keys(outlet_article_dict).forEach(outlet => {
        const articles = outlet_article_dict[outlet]
        articles.forEach(article => {
            if(article.sentiment.label === "NEGATIVE")
                article.sentiment.score *= -1
            // const pos = article.sentiment.pos
            // const neg = article.sentiment.neg
            // Object.assign(article.sentiment, {"normalized_sst": (Math.tanh((pos-pos_mean)/pos_std) + Math.tanh((neg-neg_mean)/neg_std))/2})
            const timestamp = new Date(article.timestamp.split(" ")[0])
            if(timestamp < min_timestamp) min_timestamp = timestamp
            if(timestamp > max_timestamp) max_timestamp = timestamp
            r_article_dict[article.id] = article
        })
        const articles_binBy_month = binArticlesByMonth(articles)
        r_article_bins_dict[outlet] = articles_binBy_month
        r_outlet_article_num_dict[outlet] = articles.length
    })
    const outlet_set = new Set(Object.keys(outlet_article_dict))
    const r_min_timestamp = min_timestamp.toISOString().split('T')[0]
    const r_max_timestamp = max_timestamp.toISOString().split('T')[0]
    return {outlet_set, r_article_dict, r_article_bins_dict, r_min_timestamp, r_max_timestamp, r_outlet_article_num_dict}
}

/**
 * @deprecated 
 */
export function processArticles(articles) {
    let outlet_set = new Set<string>()
    let r_article_dict: {[id: string]: any} = {}
    for(var article of articles) {
        // normalization
        const pos = article.sentiment.pos
        const neg = article.sentiment.neg
        Object.assign(article.sentiment, {"normalized_sst": (Math.tanh((pos-pos_mean)/pos_std) + Math.tanh((neg-neg_mean)/neg_std))/2})
        // article dict
        if(!r_article_dict[article.id]) r_article_dict[article.id] = []
        r_article_dict[article.id] = article
        outlet_set.add(article.journal)
    }

    const normalized_articles = articles
    return {outlet_set, normalized_articles, r_article_dict}
}

export function binArticlesByMonth(articles) {
    return _.groupBy(articles, (article) => {
        const month = article.timestamp.split("-")[1]
        if(month[0] === "0") return month[1]
        else return month
    })
}

export function sliceDatasetByTime(range, articles) {
    return
    const article_df = new dfd.DataFrame(articles)
    article_df["timestamp"].print()

}
function normalization(x, mean, std) {
    return Math.tanh((x-mean)/std)
}

function sigmoid(x) {
    return 1/(1+Math.exp(-x))
}