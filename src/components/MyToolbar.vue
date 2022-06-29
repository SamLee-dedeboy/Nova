
<script>
export default {
    emits: ["candidate_updated"],
    // inject: ['articles', 'entity_mentions'],
    computed: {
        article_dict: function() {
            return this.articles.reduce(function(dict, article) { dict[article["id"]] = article; return dict; }, {})
        },
        np_article_dict: function() {
            return this.entity_mentions.reduce(function(p, c) { p[c[0]] = c[1]; return p; }, {});
        }
    },
    data() {
        return {
            articles: {},
            entity_mentions: {}
        }
    },
    async mounted() {
        await fetch("candidate_entities.json")
            .then(res => res.json())
            .then(json => {
                this.entity_mentions = json.ranked_entity_list
            },
            response => {
                console.log("Error loading entity mentions.")
            })

        await fetch("processed_articles_rel_hugFace.json")
            .then(res => res.json())
            .then(json => {
                this.articles = json
            },
            response => {
                console.log("Error loading articles.")
            })
        return
        for(const article of this.articles) {
            // topic
            if(!this.topic_dict[article.top_level_topic]) {
                this.topic_dict[article.top_level_topic] = []
            }
            this.topic_dict[article.top_level_topic].push(article.id)

            // outlet
            if(!this.outlet_article_dict[article.journal]) {
                this.outlet_article_dict[article.journal] = []
            }
            this.outlet_article_dict[article.journal].push(article.id)
        }
    },
    methods: {
        getData(target_entity) {
            const article_id_list = this.np_article_dict[target_entity] 
            var self = this
            return article_id_list.reduce(function(article_list, id) { article_list.push(self.article_dict[id]); return article_list; }, [])
        },
        
        testClicked() {
            // var outlet_set = Object.keys(this.outlet_article_dict)
            // // original nodes and edges
            // var graph1 = {
            //     nodes: [
            //         {x: 100, y: 110, outlet:outlet_set[0], sentiment: -0.8, pos_sent: 0.1, neg_sent: -0.9, neu_sent:0, articles:this.articles.filter(article => article.journal==outlet_set[0])},
            //         {x: 600, y: 150, outlet:outlet_set[1], sentiment: 0.9, pos_sent: 0.9, neg_sent: -0.1, neu_sent:0.1, articles:this.articles.filter(article => article.journal==outlet_set[1])},
            //         {x: 80, y: 300, outlet:outlet_set[2], sentiment: -0.1, pos_sent: 0.1, neg_sent: -0.3, neu_sent:0.1, articles:this.articles.filter(article => article.journal==outlet_set[2])},
            //         {x: 500, y: 300, outlet:outlet_set[4], sentiment: 0.5, pos_sent: 0.6, neg_sent: -0.1, neu_sent:0, articles:this.articles.filter(article => article.journal==outlet_set[4])},
            //         {x: 650, y: 400, outlet:outlet_set[5], sentiment: 0.1, pos_sent: 0.1, neg_sent: 0, neu_sent:0, articles:this.articles.filter(article => article.journal==outlet_set[5])},
            //         {x: 300, y: 300, text:this.np_list[0], pos_sent: 0, neg_sent: 0, neu_sent:0, isCenter:true}

            //     ],
            // }

            // var graph2 = {
            //     nodes: [
            //         {x: 100, y: 110, outlet:outlet_set[0], sentiment: -0.8, pos_sent: 0.1, neg_sent: -0.9, neu_sent:0, articles:this.articles.filter(article => article.journal==outlet_set[0])},
            //         {x: 600, y: 150, outlet:outlet_set[1], sentiment: 0.9, pos_sent: 0.9, neg_sent: -0.1, neu_sent:0.1, articles:this.articles.filter(article => article.journal==outlet_set[1])},
            //         {x: 80, y: 300, outlet:outlet_set[3], sentiment: -0.1, pos_sent: 0.1, neg_sent: -0.3, neu_sent:0.1, articles:this.articles.filter(article => article.journal==outlet_set[2])},
            //         {x: 500, y: 300, outlet:outlet_set[4], sentiment: 0.5, pos_sent: 0.6, neg_sent: -0.1, neu_sent:0, articles:this.articles.filter(article => article.journal==outlet_set[4])},
            //         {x: 650, y: 400, outlet:outlet_set[5], sentiment: 0.1, pos_sent: 0.1, neg_sent: 0, neu_sent:0, articles:this.articles.filter(article => article.journal==outlet_set[5])},
            //         {x: 300, y: 300, text:this.np_list[1], pos_sent: 0, neg_sent: 0, neu_sent:0, isCenter:true}

            //     ],
            // }
            // var graphList = [graph1, graph2]
            // // add dotted nodes

            // graphList.forEach(graph=> {
            //     var dotted_nodes = []
            //     outlet_set.forEach(outlet => {
            //     if(!graph.nodes.map(a => a.outlet).includes(outlet)) {
            //         dotted_nodes.push({x:300, y:150, outlet:outlet, sentiment:0, dotted:true})
            //     } 
            // })
            //     graph.nodes.push.apply(graph.nodes, dotted_nodes)
            // })

            // emit
            // var dataset = {
            //     graphList: graphList,
            //     outlet_set: outlet_set,
            //     topic_dict: this.topic_dict,
            //     np_list: this.np_list
            // }
            this.$emit("candidate_updated", this.entity_mentions);
        }
      }
    }

</script>

<template>

    <Button label="Import" class="p-button-secondary"></Button>
    <Button label="Test" @click="testClicked" class="p-button-secondary"></Button>
</template> 

<style scoped>
Button {
    margin: 10px;
    border-radius: 8px;
}
</style>