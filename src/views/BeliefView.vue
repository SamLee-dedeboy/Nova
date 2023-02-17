<script setup lang=ts>
import { useUserDataStore } from '../store/userStore'
import { useRoute , useRouter} from 'vue-router'

import { Ref, ref } from "vue"
import * as vue from "vue"

import RadioButton from 'primevue/radiobutton';
import Slider from 'primevue/slider';
import HexCooccurrence from "../components/HexCooccurrence.vue";


const store = useUserDataStore()
const selected_entity = vue.computed(() => store.selected_entity)
const selected_cooccurr_entity = vue.computed(() => store.selected_cooccurr_entity)
const setUserOutletSegmentations = (segmentation, outlet) => store.setUserOutletSegmentations(segmentation, outlet)
const route = useRoute()
const router = useRouter()
const server_address = vue.inject("server_address")
// const left_most_outlet = vue.inject("left_most_outlet")
// const right_most_outlet = vue.inject("right_most_outlet")
const random_outlet = vue.inject("random_outlet")
const outlet_leaning_scale = vue.inject("outlet_leaning_scale")
const outlet_leaning_scale_dict = vue.inject("outlet_leaning_scale_dict")

const target_outlet = vue.computed(() => route.params.outlet as string)
const target_entity = vue.computed(() => route.params.entity as string)
const order = vue.computed(() => route.params.order as string)
const true_hex_data: Ref<Any> = ref() 
const true_hex_fetched: Ref<Boolean> = ref(false)
const offset: Ref<number> = ref(0.1)
const segmentations = vue.computed(() => {
    const pos_center = 0.5
    const neg_center = 0.5
    // const pos_offset = 0.25
    // const neg_offset = 0.25
    const pos_offset = offset.value
    const neg_offset = offset.value
    return [
        // center
        {
            "pos": pos_center,
            "neg": neg_center,
        },
        // top left
        {
            "pos": pos_center - pos_offset,
            "neg": neg_center + neg_offset,
        },
        // bottom left
        {
            "pos": pos_center - pos_offset,
            "neg": neg_center - neg_offset,
        },
        // top right
        {
            "pos": pos_center + pos_offset,
            "neg": neg_center + neg_offset,
        },
        // bottom right
        {
            "pos": pos_center + pos_offset,
            "neg": neg_center - neg_offset,
        },
    ]
})

vue.watch(order, (old_value, new_value) => {
    document.querySelectorAll(".hex-cell").forEach(cell => {
        cell.classList.remove("clicked-cell")
    })
    // target outlet should have changed
    // add 'if' to avoid extra fetching
    if(order.value) fetch_outlet_hex(target_outlet.value, target_entity.value)
})

vue.onBeforeMount(() => {
    fetch_outlet_hex(target_outlet.value, target_entity.value)
})

async function fetch_outlet_hex(outlet, center_entity) {
    const random_hex_parameters = {
        "outlet": outlet,
        "center_entity": center_entity,
    }
    await fetch(`${server_address}/hexview/grouped/${center_entity}/${outlet}`)
        .then(res => res.json())
        .then(json => {
            true_hex_data.value = json
            true_hex_fetched.value = true
            //console.log("hex fetched", json)
        })
}

function handleCellClicked(e, segmentation, index) {
    document.querySelectorAll(".hex-cell").forEach(cell => {
        cell.classList.remove("clicked-cell")
    })
    e.target.classList.add("clicked-cell")
    //console.log(e.target, segmentation) // or segmentations.value[index]
    setUserOutletSegmentations(segmentation, route.params.outlet as string)
    if(route.params.order == "second") {
        // begin interpolation / extrapolation
        const first_segmentation = store.user_outlet_segmentations[random_outlet[0]]
        const second_segmentation = store.user_outlet_segmentations[random_outlet[1]]
        const first_base_score = outlet_leaning_scale_dict[random_outlet[0]]
        const second_base_score = outlet_leaning_scale_dict[random_outlet[1]]
        const unit_pos = (first_segmentation.pos - second_segmentation.pos) / (first_base_score - second_base_score)
        const unit_neg = (first_segmentation.neg - second_segmentation.neg) / (first_base_score - second_base_score)
        Object.keys(outlet_leaning_scale_dict).forEach(outlet => {
            const leaning_score = outlet_leaning_scale_dict[outlet]
            // interpolation / extrapolation
            const interpolated_segmentation = {
                pos: unit_pos * (leaning_score - first_base_score) + first_segmentation.pos,
                neg: unit_neg * (leaning_score - first_base_score) + first_segmentation.neg
            }
            setUserOutletSegmentations(interpolated_segmentation, outlet)
        })
        //Route to Comparision Page
        // const ccEntity = selected_cooccurr_entity.value?.name || '';
        const entityName : string = selected_entity.value?.name;
        // console.log("ROUTER PARAMS to Compare",{ entity: entityName, cooccurr_entity: ccEntity } )
        router.push({name:'compare', params:  { entity: selected_entity.value.name } })
    }else{
        const randomOutlet : string = random_outlet[1]; //selected_cooccurr_entity?.name || '';
        const entityName : string = selected_entity.value.name;
        router.push({name:'belief', params: { order: 'second', outlet: randomOutlet, entity: target_entity.value } } )
    }
}


function outletIconStyle(name: string) {
    let className = name + '-icon';
    className = (className.includes("FoxNews") || className.includes("Breitbart")) ? className : 'icon';
    return className;
}

</script>
<template>
    <div class='selection-grid'>
        <div class="journal-style">
            <img :src="`/${target_outlet}.png`"
            :class="['journal-image',`${outletIconStyle(target_outlet)}`]" />
        </div>

        <div v-if="true_hex_fetched" class=hex-cell 
        v-for="(segmentation, index) in segmentations"
        @click='handleCellClicked($event, segmentation, index)'> 
            <!-- <div class=test-hex> {{ index }}</div> -->
            <HexCooccurrence class="belief-hexview" title="belief-hexview" :id="`belief-hex-${index}`"
                :entity_cooccurrences="true_hex_data.cooccurrences_data" :segmentation="segmentation"
                :show_blink="true">
            </HexCooccurrence>
            <svg>
                <pattern id="diagonalHatch" width="10" height="10" patternTransform="rotate(45 0 0)"
                    patternUnits="userSpaceOnUse">
                    <rect x="0" y="0" width="10" height="10" style="fill:#baf0f5" />
                    <line x1="0" y1="0" x2="0" y2="10" style="stroke:#f4c49c; stroke-width:8" />
                </pattern>
            </svg>
        </div>
    </div>
    <div class=test-slider-container>
        <div class=slider-label> {{offset}}</div>
        <Slider class='test-slider' v-model="offset" :step="0.01" :min="0" :max="0.25" />
    </div>

</template>

<style scoped>
.selection-grid {
  width: 100%;
  padding: 1%;
  height: 95vh;
  display: flex;
  flex-wrap: wrap-reverse;
  justify-content: space-between;
}

.hex-cell {
  width: 30%;
  height: 48%;
  justify-content: center;
  display: flex;
  flex-direction: column;
  margin: 0px 1px;
  box-shadow: rgba(0, 0, 0, 0.05) 0px 0px 0px 1px;
  cursor:pointer;
  background-color: white;
}
.hex-cell:hover {
    box-shadow: rgba(50, 50, 93, 0.25) 0px 6px 12px -2px, rgba(0, 0, 0, 0.3) 0px 3px 7px -3px;
}
.clicked-cell {
    box-shadow: rgba(50, 50, 93, 0.25) 0px 6px 12px -2px, rgba(0, 0, 0, 0.3) 0px 3px 7px -3px;
}


.belief-hexview {
    pointer-events: none;
}

.journal-style {
    width: 200px;
    height: 200px;
    position: absolute;
    bottom: 68%;
    left: 45%;
    overflow: hidden;
    border-radius: 50%;
    border: #d7d7d7 3px solid;
}

.journal-image {
    display: inline;
    margin: 0 auto;
    width: auto;
}

.icon {
    height: 100%;
}

.FoxNews-icon {
    height: 85%;
    right: 30%;
    bottom: 2%;
}

.Breitbart-icon {
    height: 65%;
    top: 20%;
    left: 10%;
}

/* .p-radiobutton {
 display:inline-flex;
 cursor:pointer;
 user-select:none;
 vertical-align:bottom;
 position: absolute;
 top: 94%;
 left: 48%;
} */

.test-slider-container {
    position: absolute;
    right: 25%;
    top: 38%;
    width: 30%;
}
.test-slider {
    width: inherit;
}
</style>