
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
            outlet_article_dict: {},
            entity_mentions: {},
            entity_cooccurrences_outlet_dict: {},
            isLoading: true,
        }
    },
    async mounted() {
        // await fetch("candidate_entities.json")
        // await fetch("entities.json")
        // await fetch("entities_gt10.json")
        await fetch("entities_groupby_outlet.json")
            .then(res => res.json())
            .then(json => {
                // this.entity_mentions = json.ranked_entity_list
                this.entity_mentions = json
            },
            response => {
                console.log("Error loading entity mentions.")
            })

        // await fetch("processed_articles_rel_hugFace.json")
        await fetch("outlet_article_dict.json")
            .then(res => res.json())
            .then(json => {
                // this.articles = json
                this.outlet_article_dict = json
            },
            response => {
                console.log("Error loading articles.")
            })
        // await fetch("entity_cooccurrences_groupby_outlet.json")
        //     .then(res => res.json())
        //     .then(json => {
        //         this.entity_cooccurrences_outlet_dict = json
        //     })
        this.isLoading = false
        this.testClicked()
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
        getDataset() {
            return {
                // articles: this.articles,
                // entity_mentions: this.entity_mentions,
                outlet_article_dict: this.outlet_article_dict,
                entity_mentions: this.entity_mentions,
            }
        },
        getData(target_entity) {
            const article_id_list = this.np_article_dict[target_entity] 
            var self = this
            return article_id_list.reduce(function(article_list, id) { article_list.push(self.article_dict[id]); return article_list; }, [])
        },
        getMetaData() {
            return {
                total_articles: this.articles.length,
                entities: this.entity_mentions.length,
                outlets: ["CNN", "FoxNews", "Breitbart", "ABC News", "New York Times", "Washington Post"]
            }
        },
        
        testClicked() {
            this.$emit("dataset_imported", 
            {
                outlet_article_dict: this.outlet_article_dict,
                entity_mentions: this.entity_mentions,
                entity_cooccurrences_outlet_dict: this.entity_cooccurrences_outlet_dict,
            }
            // {
                // articles: this.articles, 
            // entity_mentions: this.entity_mentions,
            // metadata: this.getMetaData()}
            )

//            this.$emit("candidate_updated", this.entity_mentions);
        }
      }
    }

</script>

<template>

    <Button label="Import" class="p-button-secondary" style="display: none"></Button>
    <!-- <Button label="Test" @click="testClicked" class="p-button-secondary" :loading="isLoading"></Button> -->
</template> 

<style scoped>
</style>