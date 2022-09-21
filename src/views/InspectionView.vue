<script setup lang="ts">
import * as vue from "vue"
import {Ref, ref} from 'vue'
import { useStore } from 'vuex'
import Splitter from 'primevue/splitter';
import SplitterPanel from "primevue/splitterpanel"
import ArticleView from "../components/ArticleView.vue";
import { Article } from "../types"

const store = useStore()

const left_section_size = 60 
const right_section_size = vue.computed(() => 100-left_section_size)
const server_address = vue.inject("server_address")
const data_fetched: Ref<boolean> = ref(false)

const selected_entity = vue.computed(() => store.state.selected_entity)
const selected_cooccurr_entity = vue.computed(() => store.state.selected_cooccurr_entity)
const segmentation = vue.computed(() => store.state.segmentation)

const target_articles: Ref<Article[]> = ref([])
vue.onMounted(() => {
    const article_ids = selected_cooccurr_entity.value.cooccurr_article_ids
    fetch_articles(article_ids)
})
async function fetch_articles(article_ids) {
    console.log("🚀 ~ file: InspectionView.vue ~ line 27 ~ fetch_articles ~ article_ids", article_ids)
    await fetch(`${server_address}/processed_data/ids_to_articles`,{
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(article_ids)
    })
      .then(res => res.json())
      .then(json => {
        target_articles.value = json
        console.log("articles fetched")
        data_fetched.value = true
      })

}
</script>

<template>
    <Splitter class="splitter-outmost">
        <SplitterPanel id="article_view_section" class="articleview-section flex align-items-center justify-content-center" :size="left_section_size" :min-size="left_section_size" >
            <i v-if="!data_fetched" class="pi pi-spin pi-spinner" 
            style="
            position:absolute;
            left: 45%;
            top: 30%;
            font-size: 3rem;
            z-index: 1000
            "></i> 
            <ArticleView
            v-if="data_fetched"
            v-model:sst_threshold="segmentation"
            :articles="target_articles">
            </ArticleView>
        </SplitterPanel>    
        <SplitterPanel id="entity_info_section" class="entity-info-section flex align-items-center justify-content-center" :size="right_section_size" >
            <div class="entity-info-container">
                <div class="target-cooccurr-container">
                <EntityInfoView
                    v-if="selected_entity"
                    title="Target Entity"
                    :entity_info="selected_entity"
                    v-model:segmentation="segmentation"
                >
                </EntityInfoView>
                <Divider v-if="selected_cooccurr_entity" layout="vertical"></Divider>
                <EntityInfoView
                    v-if="selected_cooccurr_entity"
                    title="Co-occurr Entity"
                    :entity_info="selected_cooccurr_entity"
                >
                </EntityInfoView>
                </div>
            </div>
            <div class="outlet-weight-container">

            </div>

        </SplitterPanel>
    </Splitter>

</template>
<style scoped>
.splitter-outmost {
  width: 97vw;
  height: 95vh;
  display: flex;
}

</style>