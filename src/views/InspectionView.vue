<script setup lang="ts">
/**
 * primevue components
 */
import Splitter from 'primevue/splitter';
import SplitterPanel from "primevue/splitterpanel"
import Divider from 'primevue/divider'
import SelectButton from "primevue/selectbutton"
import Slider from "primevue/slider"

/**
 * libraries
 */
import * as vue from "vue"
import {Ref, ref} from 'vue'
import { useStore } from 'vuex'

/**
 * types
 */
import { Article, SentimentType, Sentiment2D } from "../types"

/**
 * vue components
 */
import ArticleView from "../components/ArticleView.vue";
import EntityInfoView from "../components/EntityInfoView.vue";

const store = useStore()

const left_section_size = 60 
const right_section_size = vue.computed(() => 100-left_section_size)
const server_address = vue.inject("server_address")
const data_fetched: Ref<boolean> = ref(false)

const selected_entity = vue.computed(() => store.state.selected_entity)
const selected_cooccurr_entity = vue.computed(() => store.state.selected_cooccurr_entity)
const segmentation = vue.computed(() => store.state.segmentation)
const setSegmentation = (segmentation) => store.commit("setSegmentation", segmentation) 
const outlet_weight_dict = vue.computed(() => store.state.outlet_weight_dict)

const target_articles: Ref<Article[]> = ref([])
vue.onMounted(() => {
    const article_ids = selected_cooccurr_entity.value.cooccurr_article_ids
    fetch_articles(article_ids)
})

const sentiment_options = [
    {type: SentimentType.neu, value: "neu"}, 
    {type: SentimentType.neg, value: "neg"}, 
    {type: SentimentType.pos, value: "pos"}, 
    {type: SentimentType.mix, value: "mix"}, 
]
const selectedCategory: Ref<any> = ref({})
vue.watch(selectedCategory, (new_value, old_value) => {
    const adjust_target: Sentiment2D = selected_entity.value.sst_ratio || {pos: 0.5, neg: 0.5}
    const offset = 0.05
    if(new_value.type === SentimentType.neu) {
        setSegmentation({pos: adjust_target.pos + offset, neg: adjust_target.neg + offset})
    }
    if(new_value.type === SentimentType.neg) {
        setSegmentation({pos: adjust_target.pos + offset, neg: adjust_target.neg - offset})
    }
    if(new_value.type === SentimentType.pos) {
        setSegmentation({pos: adjust_target.pos - offset, neg: adjust_target.neg + offset})
    }
    if(new_value.type === SentimentType.mix) {
        setSegmentation({pos: adjust_target.pos - offset, neg: adjust_target.neg - offset})
    }
})

async function fetch_articles(article_ids) {
    console.log("🚀 ~ file: InspectionView.vue ~ line 71 ~ fetch_articles ~ article_ids", article_ids)
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
      console.log(outlet_weight_dict.value[selected_entity.value.outlet])

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
                        :entity_info="selected_entity">
                    </EntityInfoView>
                    <!-- <Divider v-if="selected_cooccurr_entity" layout="vertical"></Divider> -->
                    <EntityInfoView
                        v-if="selected_cooccurr_entity"
                        title="Co-occurr Entity"
                        :entity_info="selected_cooccurr_entity" >
                    </EntityInfoView>
                    <!-- <Divider v-if="selected_cooccurr_entity" layout="vertical"></Divider> -->
                    <div class="journal-info-container" style="font-size:small">
                        <div> Journal </div>
                        <div> {{selected_entity.outlet}} </div>
                    </div>
                </div>
            </div>
            <div class="outlet-weight-container">
                <span class="slider-label" style="font-size:small">{{selected_entity.outlet}}</span>
                <Slider 
                    :modelValue="outlet_weight_dict[selected_entity.outlet]"
                    :step="0.01"
                    :min="0"
                    :max="1">
                </Slider> 
            </div>
            <div class="select-category-container">
                <span> How would you describe the coverage of {{selected_entity.outlet}} on {{selected_entity.name}}? </span>
                <SelectButton
                    v-model="selectedCategory"
                    :options="sentiment_options"
                    option-label="value"
                    data-key="type" >
                </SelectButton>
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
:deep(.p-divider.p-divider-vertical::before) {
  border-left: 1px solid #dee2e6 !important;
}
.target-cooccurr-container {
  display: flex;
  justify-content: space-between;
  padding-left: 10px;
  padding-right: 10px;
}
.entity-info-view-container {
  display: flex;
  flex-direction: column;
  align-content: center;
  width: 100%;
  justify-content: center;
}
.outlet-weight-container {
  display: flex;
  align-items: center;
}
:deep(.p-slider.p-component.p-slider-horizontal) {
  width: 50%;
  margin-left: 15px;
}
.journal-info-container {
  white-space: nowrap;
}


</style>