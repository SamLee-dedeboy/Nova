import * as dfd from "danfojs"
import { ScatterOutletNode } from "../types"

export function constructOutletGraph(entity_mentions, outlet_set, article_dict) {
    console.log("constructing graphs!")
    var graph_dict = {}
    entity_mentions.forEach(entity_mention => {
        var graph: {
            nodes: ScatterOutletNode[]
        } = {nodes: []}
        const entity = entity_mention[0]
        // get articles mentioneding this entity
        const mentioned_articles = idsToArticles(entity_mention[1], article_dict)
        const outlet_article_dict = constructOutletArticleDict(mentioned_articles)

        outlet_set.forEach(outlet => {
            const article_ids = outlet_article_dict[outlet]
            const articles = idsToArticles(article_ids, article_dict)

            const node = construct_node(articles, outlet) 
            graph.nodes.push(node)
        }) 
        // center node
        // var center_node = self.construct_node(self.articles, target)
        // center_node["isCenter"] = true
        // graph.nodes.push(center_node)
        graph_dict[entity] = graph
    })
    console.log("construction done!")
    return graph_dict
}

export function idsToArticles(article_ids, article_dict) {
    if(!article_ids) return []
    return article_ids.reduce(function(article_list, id) { article_list.push(article_dict[id]); return article_list; }, [])
}
export function constructOutletArticleDict(articles) {
    var outlet_article_dict = {} 
    articles.forEach(article => {
        outlet_article_dict[article.journal] = outlet_article_dict[article.journal] || []
        outlet_article_dict[article.journal].push(article.id)
    })
    return outlet_article_dict
}

export function construct_node(articles, label): ScatterOutletNode {
    let node: ScatterOutletNode;  
    if(articles.length == 0) {
        node = {
            text: label,
            articles: 0,
            pos_sst: 0,
            neg_sst: 0,
        }
    } else {
        const sst_df = new dfd.DataFrame(articles.map(article=>article.sentiment))
        const pos_dfs = sst_df.iloc({rows: sst_df["normalized_sst"].gt(0).or(sst_df["normalized_sst"].eq(0))})
        const neg_dfs = sst_df.iloc({rows: sst_df["normalized_sst"].lt(0)})

        const pos_mean = pos_dfs["normalized_sst"].mean()
        const pos_median = pos_dfs["normalized_sst"].median()
        const pos_std = pos_dfs["normalized_sst"].std()
        const pos_score = sigmoid(3*(pos_mean-pos_median)/pos_std) || 0

        const neg_mean = neg_dfs["normalized_sst"].mean()
        const neg_median = neg_dfs["normalized_sst"].median()
        const neg_std = neg_dfs["normalized_sst"].std()
        const neg_score = sigmoid(3*(neg_mean-neg_median)/neg_std)

        node = {
            text: label,
            articles: articles.length,
            pos_sst: pos_score,
            neg_sst: neg_score,
        }
    }
    return node
}
export function processArticles(articles) {
    const pos_mean = 12.506365768116687
    const pos_std = 18.00385412093575
    const neg_mean = -25.86358780825294
    const neg_std = 29.437169285743654 

    let outlet_set = new Set<string>()
    let article_dict: {[id: string]: any} = {}
    for(var article of articles) {
        // normalization
        const pos = article.sentiment.pos
        const neg = article.sentiment.neg
        Object.assign(article.sentiment, {"normalized_sst": (Math.tanh((pos-pos_mean)/pos_std) + Math.tanh((neg-neg_mean)/neg_std))/2})
        // article dict
        if(!article_dict[article.id]) article_dict[article.id] = []
        article_dict[article.id] = article
        outlet_set.add(article.journal)
    }
    const normalized_articles = articles
    return {outlet_set, normalized_articles, article_dict}
}


function normalization(x, mean, std) {
    return Math.tanh((x-mean)/std)
}

function sigmoid(x) {
    return 1/(1+Math.exp(-x))
}