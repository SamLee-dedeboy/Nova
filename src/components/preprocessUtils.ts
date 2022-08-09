import * as dfd from "danfojs"
import * as _ from 'lodash'
import { Series } from "danfojs/dist/danfojs-base"
import { ScatterOutletNode, ScatterOutletGraph, ViewType } from "../types"

export function constructEntityGraph(entity_mentions_grouped, article_dict) {
    var r_graph_dict = {}
    var r_min_articles = Object.keys(article_dict).length
    var r_max_articles = 0
    var r_node_article_id_dict = {}
    Object.keys(entity_mentions_grouped).forEach(outlet => {
        const entity_mentions = entity_mentions_grouped[outlet]
        var graph: ScatterOutletGraph= {title: outlet, type: ViewType.EntityScatter, nodes: []}
        entity_mentions.forEach(entity_mention => {
            const entity = entity_mention.entity
            const mentioned_article_ids = entity_mention.article_ids
            const mentioned_articles = idsToArticles(mentioned_article_ids, article_dict)
            const article_num = mentioned_articles.length
            if(article_num > r_max_articles) r_max_articles = article_num
            if(article_num < r_min_articles) r_min_articles = article_num
            const label = `${entity}-${outlet}` 
            const node = construct_node(mentioned_articles, label) 
            r_node_article_id_dict[label] = mentioned_article_ids
            graph.nodes.push(node)

        })
        r_graph_dict[outlet] = graph
    })
    return {r_graph_dict, r_max_articles, r_min_articles, r_node_article_id_dict}

}

export function constructEntityGraph2(entity_mentions, outlet_set, article_dict, articles) {
    var r_graph_dict = {}
    var r_min_articles = articles.length
    var r_max_articles = 0
    console.log("construct outlet article dict begin....")
    const outlet_article_dict = constructOutletArticleDict(articles)
    console.log("construct outlet article dict done.")
    console.log("-------------------")
    outlet_set.forEach(outlet => {
        console.log(`constructing ${outlet}...`)
        const outlet_article_ids = outlet_article_dict[outlet].map(article => article.id)
        var graph: ScatterOutletGraph= {title: outlet, nodes: []}
        // filter out articles that mentioned an entity
        console.log("--> going through entities...")
        entity_mentions.forEach(entity_mention => {
            const entity = entity_mention[0]
            const mentioned_article_ids = entity_mention[1]
            const intersect_article_ids = _.intersection(outlet_article_ids, mentioned_article_ids)
            if(intersect_article_ids.length < 10) return;
            const mentioned_articles = idsToArticles(intersect_article_ids, article_dict)
            const article_num = mentioned_articles.length
            if(article_num > r_max_articles) r_max_articles = article_num
            if(article_num < r_min_articles) r_min_articles = article_num

            const node = construct_node(mentioned_articles, entity) 
            graph.nodes.push(node)
        });
        r_graph_dict[outlet] = graph
        console.log(`${outlet} done.`)
        console.log("-------------------")
    })
    return {r_graph_dict, r_max_articles, r_min_articles}

}

export function constructOutletGraph(entity_mentions, outlet_set, article_dict) {
    var r_graph_dict = {}
    var r_min_articles = Object.keys(article_dict).length
    var r_max_articles = 0
    entity_mentions.forEach(entity_mention => {
        const entity = entity_mention[0]
        var graph: ScatterOutletGraph= {title: entity, type: ViewType.OutletScatter, nodes: []}
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

            const node = construct_node(articles, outlet) 
            graph.nodes.push(node)
        }) 
        // center node
        // var center_node = self.construct_node(self.articles, target)
        // center_node["isCenter"] = true
        // graph.nodes.push(center_node)
        r_graph_dict[entity] = graph
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

export function construct_node(articles, label): ScatterOutletNode {
    let node: ScatterOutletNode;  
    const article_num = articles?.length || 0
    if(article_num == 0) {
        node = {
            text: label,
            articles: 0,
            pos_articles: 0,
            neg_articles: 0,
            pos_sst: 0,
            neg_sst: 0,
        }
    } else {
        const pos_artcs = articles.map(article => article.sentiment.normalized_sst).filter(sst => sst >= 0)
        const neg_artcs = articles.map(article => article.sentiment.normalized_sst).filter(sst => sst < 0)

        const median = (x) => {
            x = x.sort();
            var idx = Math.round(x.length / 2);
            return x[idx];
        }
        const std = (x) => {
            var avg = _.sum(x) / x.length;
            return Math.sqrt(_.sum(_.map(x, (i) => Math.pow((i - avg), 2))) / x.length);
        }
        const pos_mean = _.mean(pos_artcs)
        const pos_median = median(pos_artcs)
        const pos_std = std(pos_artcs) 
        const pos_score = sigmoid(-3*(pos_mean-pos_median)/pos_std) || 0

        const neg_mean = Math.abs(_.mean(neg_artcs))
        const neg_median = Math.abs(median(neg_artcs))
        const neg_std = std(neg_artcs) 
        const neg_score = sigmoid(-3*(neg_mean-neg_median)/neg_std) || 0

        node = {
            text: label,
            articles: article_num,
            pos_articles: pos_artcs.length,
            neg_articles: neg_artcs.length,
            pos_sst: parseFloat(pos_score.toFixed(2)),
            neg_sst: parseFloat(neg_score.toFixed(2)),
        }
    }
    return node
}


const pos_mean = 12.506365768116687
const pos_std = 18.00385412093575
const neg_mean = -25.86358780825294
const neg_std = 29.437169285743654 

export function processArticleDict(outlet_article_dict) {
    let r_article_dict: {[id: string]: any} = {}
    let r_article_bins_dict: {[id: string]: any}  = {}
    let r_outlet_article_num_dict = {}
    let min_timestamp = new Date("3000-10-10")
    let max_timestamp = new Date("1000-10-10")
    Object.keys(outlet_article_dict).forEach(outlet => {
        const articles = outlet_article_dict[outlet]
        articles.forEach(article => {
            const pos = article.sentiment.pos
            const neg = article.sentiment.neg
            Object.assign(article.sentiment, {"normalized_sst": (Math.tanh((pos-pos_mean)/pos_std) + Math.tanh((neg-neg_mean)/neg_std))/2})
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