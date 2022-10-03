<script setup lang="ts">
/**
 * primevue components
 */
import Splitter from 'primevue/splitter';
import SplitterPanel from "primevue/splitterpanel"
import SelectButton from "primevue/selectbutton"
import Slider from "primevue/slider"
import Dropdown from 'primevue/dropdown';


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
const setEntity = (entity) => store.commit("setEntity", entity) 
const selected_cooccurr_entity = vue.computed(() => store.state.selected_cooccurr_entity)
const setCooccurrEntity = (cooccurr_entity) => store.commit("setCooccurrEntity", cooccurr_entity) 
const segmentation = vue.computed(() => store.state.segmentation)
const setSegmentation = (segmentation) => store.commit("setSegmentation", segmentation) 
const outlet_weight_dict = vue.computed(() => store.state.outlet_weight_dict)
const clicked_hexview = vue.computed(() => store.state.clicked_hexview)
const setClickedHexView = (hexview) => store.commit("setClickedHexView", hexview)
const hexview_grid = vue.computed(() => store.state.hexview_grid)
const constraint_dict = vue.computed(() => store.state.constraints)
const addConstraint = (constraint: Constraint) => store.commit("addConstraint", constraint)
const removeConstraint = (constraint: Constraint) => store.commit("removeConstraint", constraint)
const constraint_statisfaction = ref({})

const selected_outlet: Ref<string> = ref("")
const offsetScale = vue.computed(() => {
    const adjust_target: Sentiment2D = selected_entity.value.sst_ratio || {pos: 0.5, neg: 0.5}
    console.log(adjust_target)
    return d3.scaleLinear()
        .domain([0, 1])
        .range([0.05, Math.min(1-adjust_target.pos, 1-adjust_target.neg)])
})
const entity_grouped_view: Ref<any> = ref(undefined)
const target_articles: Ref<Article[]> = ref([])
const target_article_highlights: Ref<any> = ref({})
const outlet_scatter: Ref<any> = ref(null)
vue.onMounted(() => {
    prepare_data()
})

const sentiment_options = [
    {type: SentimentType.neu, value: "neu"}, 
    {type: SentimentType.neg, value: "neg"}, 
    {type: SentimentType.pos, value: "pos"}, 
    {type: SentimentType.mix, value: "mix"}, 
]

const journal_options = [
    "CNN",
    "FoxNews",
    "Breitbart",
    "ABC News",
    "New York Times",
    "Washington Post"
]
const intensity: Ref<number> = ref(0.5)
const adjust_offset = vue.computed(() => offsetScale.value(intensity.value))
const selectedCategory: Ref<any> = ref({})
vue.watch(selectedCategory, (new_value, old_value) => {
    const adjust_target: Sentiment2D = selected_entity.value.sst_ratio || {pos: 0.5, neg: 0.5}
    // const offset = 0.05
    if(new_value.type === SentimentType.neu) {
        setSegmentation({pos: adjust_target.pos + adjust_offset.value, neg: adjust_target.neg + adjust_offset.value})
    }
    if(new_value.type === SentimentType.neg) {
        setSegmentation({pos: adjust_target.pos + adjust_offset.value, neg: adjust_target.neg - adjust_offset.value})
    }
    if(new_value.type === SentimentType.pos) {
        setSegmentation({pos: adjust_target.pos - adjust_offset.value, neg: adjust_target.neg + adjust_offset.value})
    }
    if(new_value.type === SentimentType.mix) {
        setSegmentation({pos: adjust_target.pos - adjust_offset.value, neg: adjust_target.neg - adjust_offset.value})
    }
    outlet_scatter.value.updateSegmentation(segmentation.value)
    const new_constraint: Constraint = {
        target: selected_entity.value.name,
        outlet: selected_entity.value.outlet,
        sentiment: new_value.type,
    }
    addConstraint(new_constraint)
})

vue.watch(segmentation, (new_value, old_value) => {
    checkConflict(constraint_dict.value[selected_entity.value.name], entity_grouped_view.value.data.nodes)
})

function prepare_data() {
    const article_ids = selected_cooccurr_entity.value.cooccurr_article_ids
    // setSegmentation(selected_entity.value.sst_ratio)
    selected_outlet.value = selected_entity.value.outlet
    const promiseArray: any[] = []
    promiseArray.push(new Promise(async (resolve) => {
        await fetch_articles(article_ids)
        resolve("success")
    }))
    promiseArray.push(new Promise(async (resolve) => {
        await fetch_article_highlights(article_ids)
        resolve("success")
    }))
    promiseArray.push(new Promise(async (resolve) => {
        await fetch_entity_grouped_node(selected_entity.value.name)
        resolve("success")
    }))
    Promise.all(promiseArray)
    .then(() => {
        data_fetched.value = true
        console.log('fetched new articles')
    })

}

function checkConflict(constraint_dict, outlet_nodes) {
    Object.keys(constraint_dict).forEach(outlet => {
        console.log(outlet)
        const target_node = outlet_nodes.find(node => node.text === outlet)
        constraint_statisfaction.value[outlet] = checkConstraint(
            constraint_dict[outlet], 
            {pos: target_node.pos_sst, neg: target_node.neg_sst},
            segmentation.value
        )
    })    
}

function checkConstraint(type: SentimentType, target: Sentiment2D, segmentation: Sentiment2D): boolean {
    if(type === SentimentType.neu) {
        return target.pos <= segmentation.pos && target.neg <= segmentation.neg 
    }
    if(type === SentimentType.neg) {
        return target.pos <= segmentation.pos && target.neg >= segmentation.neg 
    }
    if(type === SentimentType.pos) {
        return target.pos >= segmentation.pos && target.neg <= segmentation.neg 
    }
    if(type === SentimentType.mix) {
        return target.pos >= segmentation.pos && target.neg >= segmentation.neg 
    }
    return true
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
    })
}

async function fetch_article_highlights(article_ids) {
    await fetch(`${server_address}/processed_data/ids_to_articles_highlights`,{
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(article_ids)
    })
    .then(res => res.json())
    .then(json => {
        console.log("highlights fetched")
        target_article_highlights.value = json
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
        console.log("entity grouped view fetched")
    })
}

async function handleChangeJournal(e) {
    const outlet = e.target.value
    selected_outlet.value = outlet
    const entity = selected_entity.value.name
    const co_occurr_entity = selected_cooccurr_entity.value.name
    const view = hexview_grid.value.find(view => view.title.split("-")[2] === outlet)
    setClickedHexView(view)
    await fetch_cooccurr_into(outlet, entity, co_occurr_entity)
    prepare_data()
}

async function handleHexClicked({target, co_occurr_entity}, view) {
    const entity = target.split("-")[0]
    const outlet = target.split("-")[1] 
    await fetch_cooccurr_into(outlet, entity, co_occurr_entity)
    prepare_data()
}

async function fetch_cooccurr_into(outlet, entity, co_occurr_entity) {
    await fetch(`${server_address}/processed_data/cooccurr_info/grouped/${outlet}/${entity}/${co_occurr_entity}`)
        .then(res => res.json())
        .then(json => {
            console.log("cooccurr_info fetched")
            const target_entity = {
                name: json.target,
                outlet: outlet,
                num_of_mentions: json.target_num,
                articles_topic_dict: json.target_articles_topic_dict, 
                sst_ratio: clicked_hexview.value.data.target.sst
            }
            setEntity(target_entity)
            const cooccurr_entity = {
                target: json.target,
                name: json.cooccurr_entity,
                outlet: outlet,
                num_of_mentions: json.cooccurr_num,
                target_num_of_mentions: json.target_num_of_mentions,
                articles_topic_dict: json.cooccurr_articles_topic_dict,
                cooccurr_article_ids: json.cooccurr_article_ids
            }
            setCooccurrEntity(cooccurr_entity)
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
            :articles="target_articles"
            :article_highlights="target_article_highlights">
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
                        <!-- <Dropdown :modelValue="selected_outlet"
                         :options="journal_options" 
                         placeholder="Select an journal"
                         @change="handleChangeJournal" /> -->
                         <label for="journals"> Journal </label>
                         <select name="journals" id="journals"
                         @change="handleChangeJournal">
                            <option v-for="journal in journal_options" 
                                :value="journal"
                                :selected="journal == selected_outlet">{{journal}}</option>
                        </select>
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
                    :segmentation="segmentation"
                    @hex-clicked="handleHexClicked">
                </HexCooccurrence>
            </div>
            <div class="constaints-outlet-scatter-container">
                <div class="constraints-view">
                    <ol v-if="constraint_dict[selected_entity.name]">
                        <li v-for="outlet in Object.keys(constraint_dict[selected_entity.name])"
                            :class="{not_satisfied: !constraint_statisfaction[outlet] }"> 
                            {{outlet}} - {{constraint_dict[selected_entity.name][outlet]}}
                            <i class="pi pi-times-circle" style="cursor:pointer" 
                            @click="removeConstraint({target: selected_entity.name, outlet: outlet})"></i> 
                        </li>
                    </ol> 
                </div>
                <OutletScatterplot
                    ref="outlet_scatter"
                    v-if="entity_grouped_view"
                    :view="entity_grouped_view"
                    :highlight_node_text="selected_entity.outlet"
                    :adjust_offset="adjust_offset"
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
:deep(.p-dropdown-panel.p-component){
    position: absolute !important;
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
  height: 54%;
}

// ---------------------
// Constaints & Outlet Scatterplot Section
// ---------------------
.constaints-outlet-scatter-container {
  display: flex;
  justify-content: space-between;
}
.constraints-view {
  width: fit-content;
}

#outlet-scatter {
  width: 31%;
}
.not_satisfied {
    background: #f88e8e;
}

</style>