<script setup lang="ts">
/**
 * primevue components
 */
import Splitter from 'primevue/splitter';
import SplitterPanel from "primevue/splitterpanel"
import SelectButton from "primevue/selectbutton"
import Slider from "primevue/slider"

/**
 * libraries
 */
import * as vue from "vue"
import {Ref, ref} from 'vue'
import { useStore } from 'vuex'
import * as d3 from 'd3'

/**
 * types
 */
import { Article, SentimentType, Sentiment2D, Constraint } from "../types"

/**
 * vue components
 */
import ArticleView from "../components/ArticleView.vue";
import EntityInfoView from "../components/EntityInfoView.vue";
import HexCooccurrence from "../components/HexCooccurrence.vue"
import OutletScatterplot from '../components/OutletScatterplot.vue';

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
const clicked_hexview = vue.computed(() => store.state.clicked_hexview)
const constraint_dict = vue.computed(() => store.state.constraints)
const addConstraint = (constraint: Constraint) => store.commit("addConstraint", constraint)
const removeConstraint = (constraint_target: string) => store.commit("removeConstraint", constraint_target)

const entity_grouped_view: Ref<any> = ref(undefined)
const target_articles: Ref<Article[]> = ref([])
vue.onMounted(() => {
    const article_ids = selected_cooccurr_entity.value.cooccurr_article_ids
    const promiseArray: any[] = []
    promiseArray.push(new Promise(async (resolve) => {
        await fetch_articles(article_ids)
        resolve("success")
    }))
    promiseArray.push(new Promise(async (resolve) => {
        await fetch_entity_grouped_node(selected_entity.value.name)
        resolve("success")
    }))
    Promise.all(promiseArray)
})

const sentiment_options = [
    {type: SentimentType.neu, value: "neu"}, 
    {type: SentimentType.neg, value: "neg"}, 
    {type: SentimentType.pos, value: "pos"}, 
    {type: SentimentType.mix, value: "mix"}, 
]
const intensity: Ref<number> = ref(0.5)
const selectedCategory: Ref<any> = ref({})
vue.watch(selectedCategory, (new_value, old_value) => {
    const adjust_target: Sentiment2D = selected_entity.value.sst_ratio || {pos: 0.5, neg: 0.5}
    // const offset = 0.05
    const offset = d3.scaleLinear()
        .domain([0, 1])
        .range([0.05, Math.min(adjust_target.pos, adjust_target.neg)])
        (intensity.value)
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
    const new_constraint: Constraint = {
        target: selected_entity.value.name,
        outlet: selected_entity.value.outlet,
        sentiment: new_value.type,
    }
    addConstraint(new_constraint)
    checkConflict(constraint_dict.value)
})

function checkConflict(constraint_dict) {
    // TODO: check if constraints conflict with each other
    return
}

async function fetch_articles(article_ids) {
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

async function fetch_entity_grouped_node(entity) {
    await fetch(`${server_address}/processed_data/scatter_node/grouped/${entity}`)
    .then(res => res.json())
    .then(json => {
        entity_grouped_view.value = {
            title: entity,
            data: {
                nodes: json,
                max_articles: Math.max(...json.map(node => node.article_ids.length)),
                min_articles: Math.min(...json.map(node => node.article_ids.length)),
            }
            
        }
        console.log("🚀 ~ file: InspectionView.vue ~ line 126 ~ fetch_entity_grouped_node ~ entity_grouped_view", entity_grouped_view.value)
    })
}


function updateSegmentation({pos, neg}) {
  setSegmentation({pos, neg})
}

</script>

<template>
    <Splitter class="splitter-outmost">
        <SplitterPanel id="article_view_section" class="articleview-section flex align-items-center justify-content-center" :size="left_section_size">
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
                <div class="selection-container">
                    <SelectButton
                        v-model="selectedCategory"
                        :options="sentiment_options"
                        option-label="value"
                        data-key="type" >
                    </SelectButton>
                    <Slider
                        v-model="intensity"
                        :step="0.01"
                        :min="0"
                        :max="1" >
                    </Slider>
                </div>
            </div>
            <div class="hexview-container"> 
                <HexCooccurrence
                  v-if="data_fetched"
                    class="compare-co-hexview"
                    :title="clicked_hexview.title"
                    :id="`compare-co-hex-inpection`"
                    :entity_cooccurrences="clicked_hexview.data"
                    :segmentation="segmentation">
                </HexCooccurrence>
            </div>
            <div class="constaints-outlet-scatter-container">
                <div class="constraints-view">
                    <ol v-if="constraint_dict[selected_entity.name]">
                        <li v-for="outlet in Object.keys(constraint_dict[selected_entity.name])"> 
                            {{outlet}} - {{constraint_dict[selected_entity.name][outlet]}}
                        </li>
                    </ol> 
                </div>
                <OutletScatterplot
                    v-if="entity_grouped_view"
                    :view="entity_grouped_view"
                    id="outlet-scatter"
                    :segment_mode="true"
                    :segmentation="segmentation"
                    @update:segmentation="updateSegmentation" >
                </OutletScatterplot>
            </div>
            <div class='navigation-container'>
                <router-link v-if="data_fetched" :to="{ name: 'compare', params: { entity: selected_entity.name }}">Back</router-link>
            </div>
        </SplitterPanel>
    </Splitter>

</template>
<style scoped lang="scss">

// ---------------------
// css for split-panel layout
// ---------------------
.splitter-outmost {
  width: 99vw;
  height: 98vh;
  display: flex;
}

// divider style 
:deep(.p-divider.p-divider-vertical::before) {
  border-left: 1px solid #dee2e6 !important;
}


// ---------------------
// entity info section
// ---------------------
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

// ---------------------
// Sentiment category selection section
// ---------------------
.selection-container {
    display: flex;
    align-items: center;
}


// ---------------------
//  Hexview section
// ---------------------
.hexview-container {
  height: 59%;
}

// ---------------------
// Constaints & Outlet Scatterplot Section
// ---------------------
.constaints-outlet-scatter-container {
  display: flex;
}
.constraints-view {
  width: fit-content;
}

#outlet-scatter {
  width: 21%;
}

</style>