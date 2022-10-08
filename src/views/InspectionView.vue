<script setup lang="ts">
/**
 * primevue components
 */
import Splitter from 'primevue/splitter';
import SplitterPanel from "primevue/splitterpanel"
import SelectButton from "primevue/selectbutton"
import Slider from "primevue/slider"
import Dropdown from 'primevue/dropdown';
import Divider from 'primevue/divider';
import ScrollPanel from 'primevue/scrollpanel'
import Textarea from 'primevue/textarea'


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
import { Article, SentimentType, Constraint } from "../types"

/**
 * vue components
 */
import ArticleView from "../components/ArticleView.vue";
import HexCooccurrence from "../components/HexCooccurrence.vue"

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
const original_segmentation = segmentation.value
const outlet_weight_dict = vue.computed(() => store.state.outlet_weight_dict)
const clicked_hexview = vue.computed(() => store.state.clicked_hexview)
const setClickedHexView = (hexview) => store.commit("setClickedHexView", hexview)
const hexview_grid = vue.computed(() => store.state.hexview_grid)
const constraint_dict = vue.computed(() => store.state.constraints)
const addConstraint = (constraint: Constraint) => store.commit("addConstraint", constraint)
const ranked_outlets = vue.computed(() => {
    return Object.keys(outlet_weight_dict.value).sort(
        (o1, o2) => outlet_weight_dict.value[o1] - outlet_weight_dict.value[o2]
    )
})

const selected_outlet: Ref<string> = ref("")
const target_articles: Ref<Article[]> = ref([])
const target_article_highlights: Ref<any> = ref({})
const notes = vue.computed(() => store.state.notes)
const setNotes = (notes) => store.commit("setNotes", notes)
const marked_articles_ids_with_outlet = vue.computed(() => store.state.marked_articles)
const marked_articles_grouped = vue.computed(() => {
    const res = {}
    marked_articles_ids_with_outlet.value.forEach(({article_id, outlet}) => {
        if(!res[outlet]) res[outlet] = []
        res[outlet].push(article_id)
    })
    return res
}) 

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
const selectedCategory: Ref<any> = ref({})
vue.watch(selectedCategory, (new_value, old_value) => {
    if(selectedCategory.value === undefined) return
    // const adjust_target: Sentiment2D = selected_entity.value.sst_ratio || {pos: 0.5, neg: 0.5}
    // // const offset = 0.05
    // if(new_value.type === SentimentType.neu) {
    //     setSegmentation({pos: adjust_target.pos + adjust_offset.value, neg: adjust_target.neg + adjust_offset.value})
    // }
    // if(new_value.type === SentimentType.neg) {
    //     setSegmentation({pos: adjust_target.pos + adjust_offset.value, neg: adjust_target.neg - adjust_offset.value})
    // }
    // if(new_value.type === SentimentType.pos) {
    //     setSegmentation({pos: adjust_target.pos - adjust_offset.value, neg: adjust_target.neg + adjust_offset.value})
    // }
    // if(new_value.type === SentimentType.mix) {
    //     setSegmentation({pos: adjust_target.pos - adjust_offset.value, neg: adjust_target.neg - adjust_offset.value})
    // }
    const new_constraint: Constraint = {
        target: selected_entity.value.name,
        outlet: selected_entity.value.outlet,
        sentiment: new_value.type,
    }
    addConstraint(new_constraint)
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
    Promise.all(promiseArray)
    .then(() => {
        data_fetched.value = true
        console.log('fetched new articles')
    })

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

async function handleChangeJournal(e) {
    // const outlet = e.target.value
    const outlet = e.value
    selected_outlet.value = outlet
    const entity = selected_entity.value.name
    const co_occurr_entity = selected_cooccurr_entity.value.name
    const view = hexview_grid.value.find(view => view.title.split("-")[2] === outlet)
    setClickedHexView(view)
    await fetch_cooccurr_into(outlet, entity, co_occurr_entity)
    prepare_data()
    selectedCategory.value = undefined
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
            <h2 class="component-header article-view-header"> 
                Articles on 
                <span> {{selected_entity?.name}} </span> 
                and 
                <span> {{selected_cooccurr_entity?.name}} </span> 
                by 
                <span> {{selected_entity?.outlet}}</span>
                &nbsp
                <i class='pi pi-info-circle tooltip'>
                    <span class="tooltiptext right-tooltiptext" style="width: 400px">
                        Below are the articles of the selected topics published by {{ selected_entity?.outlet }}. <br/>
                        Click the plus button to expand and see a summary of the article. <br/>
                        Use the Mark button to mark any interesting articles you find.  <br/>
                    </span>
                </i>
            </h2>
            <ArticleView
            class="article-view-container"
            v-if="data_fetched"
            v-model:sst_threshold="segmentation"
            :articles="target_articles"
            :article_highlights="target_article_highlights"
            :entity_pair="[selected_entity?.name as string, selected_cooccurr_entity?.name as string]">
            </ArticleView>
        </SplitterPanel>    
        <SplitterPanel id="entity_info_section" class="entity-info-panel flex align-items-center justify-content-center" :size="right_section_size" >
            <div class="entity-info-container">
                <div class="target-cooccurr-container">
                    <div v-if="Object.keys(constraint_dict[selected_entity?.name]||{}).length > 0" class="navigate-container">
                            <router-link  class="goNext" :to="{ name: 'summary', params: { entity: selected_entity.name }}"> Summary Report </router-link>
                        </div>
                    <h2 class="component-header cooccurr-info-header">
                    Outlet Coverage
                    </h2>
                    <div class="cooccurr-info-content">
                        <div class="num_of_articles">
                            Number of articles about 
                            <span style="font-weight:bolder" :title="selected_entity?.name"> {{selected_entity?.name}} </span>
                            <span v-if="selected_cooccurr_entity"> 
                            and 
                            <span style="font-weight:bolder" :title="selected_cooccurr_entity.name">
                                {{selected_cooccurr_entity.name}}
                            </span> 
                            </span>
                            is {{ selected_cooccurr_entity? selected_cooccurr_entity.num_of_mentions : selected_entity.num_of_mentions }}
                        </div>
                        <Divider layout="vertical"></Divider>
                        <ul class="entity-info-section">
                            <li :title="selected_entity.name"> Main topic: {{ selected_entity.name }} </li>
                            <li v-if='selected_cooccurr_entity' :title="selected_cooccurr_entity.name"> Co-occur topic: {{ selected_cooccurr_entity.name }} </li>
                            <li :title="selected_entity.outlet"> Media outlet: {{selected_entity.outlet}}</li>
                        </ul>
                    </div>
                </div>
                <div class="hexview-container"> 
                    <HexCooccurrence
                    v-if="data_fetched"
                        class="compare-co-hexview"
                        :title="clicked_hexview.title"
                        :id="`compare-co-hex-inpection`"
                        :entity_cooccurrences="clicked_hexview.data"
                        :segmentation="original_segmentation"
                        @hex-clicked="handleHexClicked">
                    </HexCooccurrence>
                </div>
                <div class="select-category-container">
                    <div class="question-container">
                        <span> 
                            How would you describe the coverage on 
                            <span> {{selected_entity?.name}} </span> 
                            by &nbsp 
                        </span>
                        <div class="journal-info-container" style="font-size:small">
                            <Dropdown :modelValue="selected_outlet"
                                :options="journal_options" 
                                placeholder="Select an journal"
                                @change="handleChangeJournal" />
                                <!-- <label for="journals"> Journal </label> -->
                                <!-- <select name="journals" id="journals"
                                @change="handleChangeJournal">
                                <option v-for="journal in journal_options" 
                                    :value="journal"
                                    :selected="journal == selected_outlet">{{journal}}</option>
                            </select> -->
                        </div>
                    </div>
                    <div class="selection-container">
                        <SelectButton
                            v-model="selectedCategory"
                            :options="sentiment_options"
                            option-label="value"
                            data-key="type" >
                        </SelectButton>
                        <!-- <span class="slider-label"> Intensity 
                            <i class='pi pi-info-circle tooltip'>
                                <span class="tooltiptext right-tooltiptext" style="width:300px;">
                                    Use the slider to controll the intensity of the sentiment.
                                </span>
                            </i>
                            :
                        </span>
                        <Slider
                            class="intensity-slider"
                            v-model="intensity"
                            :step="0.01"
                            :min="0"
                            :max="1" >
                        </Slider> -->
                    </div>
                </div>
                <div class="document-container">
                    <div class="notes">
                        <h2 class="component-header notes-header">
                            Notes
                            <i class='pi pi-info-circle tooltip'>
                                <span class="tooltiptext right-tooltiptext" style="width: 145px">
                                    Write down any hypothesis or questions you have.
                                    The system will document that for you.
                                </span>
                            </i>
                        </h2>
                        <Textarea class="notes-style" :model-value="notes" @update:model-value="setNotes"/>
                    </div>
                    <div class="marked-articles-container">
                        <h2 class="component-header marked-articles-header">
                            Conclusions
                        </h2>
                        <table class="mark-table">
                            <colgroup>
                                <col span="1" style="width: 25%;">
                                <col span="1" style="width: 15%;">
                                <col span="1" style="width: 60%;">
                            </colgroup>
                            <tbody>
                                <tr v-for="outlet in ranked_outlets"> 
                                    <td> {{outlet}} </td>
                                    <td> {{constraint_dict[selected_entity.name]?.[outlet] || "unset"}} </td>
                                    <td>
                                        <i v-for="id in marked_articles_grouped[outlet]" 
                                            class="pi pi-file">
                                        </i>
                                    </td>
                                </tr>
                            </tbody>
                        </table> 

                    </div>
                </div>
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
.entity-info-panel {
    overflow: hidden;
}
// divider style 
:deep(.p-divider.p-divider-vertical::before) {
  border-left: 1px solid #dee2e6 !important;
}

// ---------------------
// headers
// ---------------------

.article-view-header {
  background: #f7f7f7;
  margin:0%;
  padding:0.5%;
}

// ---------------------
// articlew view section
// ---------------------

// ---------------------
// entity info section
// ---------------------
.target-cooccurr-container {
  display: flex;
  flex-direction: column;
  padding-left: 10px;
  padding-right: 10px;
  background: #f7f7f7;
  margin-left: 1%;
  margin-right: 1%;
}
:deep(.entity-info-view-container) {
  display: flex;
  flex-direction: column;
  align-content: center;
  width: 100%;
  justify-content: center;
  max-width: unset !important;
}
.entity-info-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
}
.cooccurr-info-content {
  display: flex;
  font-size: 0.8rem;
}
.cooccurr-info-header {
    margin: 1.5%;
}

ol {
    padding-left: 10%;
}
li {
    white-space: pre;
}

:deep(.p-slider.p-component.p-slider-horizontal) {
  width: 50%;
  margin-left: 15px;
}
.entity-info-section {
  padding-left: 1%;
  flex: 2 1 0;
}
.num_of_articles {
  flex: 1 1 0;
}

// ---------------------
// Sentiment category selection section
// ---------------------
.selection-container {
    display: flex;
    align-items: center;
}
.slider-label {
    margin-left: 5px;
    // position:absolute;
    font-family: Lato;
    // left: 41.2%;
    // top: -10%;
}
:deep(.p-slider .p-slider-handle) {
  height: 0.8rem;
  width: 0.8rem;
}
:deep(.p-slider.p-slider-horizontal .p-slider-handle) {
  margin-top: -0.4rem;
  margin-left: -0.4rem;
}


// ---------------------
//  Hexview section
// ---------------------
.hexview-container {
  max-height: 49%;
}

// ---------------------
// Constraints & Outlet Scatterplot Section
// ---------------------
.constraints-outlet-scatter-container {
    display: flex;
//   justify-content: space-between;
    flex: 1 1 0;
    overflow: hidden;
    flex-direction: column;
}

.intensity-slider {
    width: 38% !important;
}
.constraint-table {
    font-size: 0.8rem;
}
.constraints-view {
//   width: fit-content;
  background: #f7f7f7;
//   flex: 1 1 0;
  margin-right: 1%;
}
:deep(.p-button) {
    padding: 0.1rem 1rem;
}
:deep(.p-buttonset, .p-button) {
    margin: 0.3rem 0rem;
}
:deep(.p-inputtext) {
    padding: 0.2rem 0.5rem;
}

:deep(.p-scrollpanel.p-component) {
  width: 100%;
}
.question-container {
    display: flex;
    align-items: center;
    background: #f7f7f7;
    border-bottom: solid 1px #b7b7b7;
    font-family: "Lato";
    padding-left: 1%;
}
.journal-info-container {
  white-space: nowrap;
  margin: 0.3rem 0rem;
}
.notes {
  display: flex;
  flex-direction: column;
}
.notes-style {
    height: 100%;
}
.document-container {
    display: flex;
}

.marked-articles-header {
  margin: 1% 1% 0% 0%;
}
.marked-articles-container {
    width: 100%;
}
.mark-table {
    font-size: 0.7rem;
    width: 100%;
}

:deep(.outlet-scatter) {
    width: 100%;
    // top: -5%;
    // flex: 1 1 auto;
    // width: 26% !important;
}
.outlet-scatter-container {
  display: flex;
  /*! flex-direction: column; */
  background: #f7f7f7;
  height:100%;
  flex: 1 1 0;
}
.outlet-scatter-header {
    // display: flex;
    // flex-direction: column;
    border-bottom: solid 1px #b7b7b7;
    margin: 0%;
    flex: 1 1 25%;
    padding-right: 0%;
}


.navigate-container {
    text-align: center;
    display: flex;
    position: absolute;
    height: 25%;
    width: 25%;
    top: 10%;
    right: 1%;
    z-index: 999;
    box-shadow: 0 0 0 0 rgb(0 0 0);
    transform: scale(1);
    animation: pulse-a39a231a 2s infinite;
}

a.goNext {
    text-decoration: none;
    margin: 1%;
    color: #4caaf5;
    width: 100%;
}


@keyframes pulse {
    0% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 #4caaf5;
    }

    70% {
        transform: scale(1);
        box-shadow: 0 0 0 10px rgba(0, 0, 0, 0);
    }

    100% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
    }
}


</style>