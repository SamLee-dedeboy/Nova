<script setup lang=ts>
import { useUserDataStore } from '../store/userStore'
import { useRoute } from 'vue-router'

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
const server_address = vue.inject("server_address")
const left_most_outlet = vue.inject("left_most_outlet")
const right_most_outlet = vue.inject("right_most_outlet")
const outlet_leaning_scale = vue.inject("outlet_leaning_scale")

const target_outlet = vue.computed(() => route.params.outlet as string)
const target_entity = vue.computed(() => route.params.entity as string)
const leaning = vue.computed(() => route.params.leaning as string)
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

vue.watch(leaning, (old_value, new_value) => {
    document.querySelectorAll(".hex-cell").forEach(cell => {
        cell.classList.remove("clicked-cell")
    })
    // target outlet should have changed
    // add 'if' to avoid extra fetching
    if(leaning.value) fetch_random_hex(target_outlet.value, target_entity.value)
})

vue.onBeforeMount(() => {
    fetch_random_hex(target_outlet.value, target_entity.value)
})

async function fetch_random_hex(outlet, center_entity, num=5) {
    console.log('fetching random hex of: ', outlet, center_entity)
    const random_hex_parameters = {
        "outlet": outlet,
        "center_entity": center_entity,
        "num": num,
    }
    await fetch(`${server_address}/hex/random`, {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify(random_hex_parameters)
    })
        .then(res => res.json())
        .then(json => {
            true_hex_data.value = json
            true_hex_fetched.value = true
            console.log("random hex fetched", json)
        })
}

function handleCellClicked(e, segmentation, index) {
    document.querySelectorAll(".hex-cell").forEach(cell => {
        cell.classList.remove("clicked-cell")
    })
    e.target.classList.add("clicked-cell")
    console.log(e.target, segmentation) // or segmentations.value[index]
    setUserOutletSegmentations(segmentation, route.params.outlet as string)
    if(route.params.leaning == "right") {
        // begin interpolation 
        const left_most_segmentation = store.user_outlet_segmentations[left_most_outlet]
        const right_most_segmentation = store.user_outlet_segmentations[right_most_outlet]
        outlet_leaning_scale.forEach(outlet_leaning => {
            const outlet = outlet_leaning.outlet
            const leaning_score = outlet_leaning.leaning
            // linear interpolation
            const interpolated_segmentation = {
                pos: left_most_segmentation.pos * (1-leaning_score) + right_most_segmentation.pos * leaning_score, 
                neg: left_most_segmentation.neg * (1-leaning_score) + right_most_segmentation.neg * leaning_score, 
            }
            setUserOutletSegmentations(interpolated_segmentation, outlet)
        })
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
        <img :src="`/${target_outlet}.png`"
            :class="['journal-image',`${outletIconStyle(target_outlet)}`]" />
        <div v-if="true_hex_fetched" class=hex-cell 
        v-for="(segmentation, index) in segmentations"
        @click='handleCellClicked($event, segmentation, index)'> 
            <!-- <div class=test-hex> {{ index }}</div> -->
            <HexCooccurrence class="belief-hexview" title="belief-hexview" :id="`belief-hex-${index}`"
                :entity_cooccurrences="true_hex_data.data" :segmentation="segmentation"
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
    <div class=navigate-container>
        <router-link class="goNext"
            v-if="route.params.leaning == 'left'"
            :to="{ name: 'belief', params: { leaning: 'right', outlet: right_most_outlet, entity: target_entity } }">
            <p class="next">go next</p>
        </router-link>
        <router-link class="goNext"
            v-else
            :to="{ name: 'compare', params: { entity: selected_entity.name, cooccurr_entity: selected_cooccurr_entity?.name || '' } }">
            <p class="next">go next</p>
        </router-link>
    </div>

</template>

<style scoped>
.selection-grid {
  width: 100%;
  height: 99%;
  display: flex;
  flex-wrap: wrap-reverse;
  justify-content: center;
}

.hex-cell {
  width: 30%;
  height: 48%;
  justify-content: center;
  display: flex;
  flex-direction: column;
  border: solid 1px black;
  margin: 0px 1px;
  cursor:pointer;
}
.hex-cell:hover {
    border: solid 5px black;
}
.clicked-cell {
    border: solid 5px black;
}


.belief-hexview {
    pointer-events: none;
}

.journal-image {
    display: inline;
    margin: 0 auto;
    width: auto;
    height: 50px;
    position: absolute;
    left: 4%;
    top: 17%;
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
    position:absolute;
    left:3%;
    top:31%;
    width:200px;
}
.test-slider {
    width: inherit;
}
</style>