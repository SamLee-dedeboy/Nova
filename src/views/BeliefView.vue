<script setup lang=ts>
import { useUserDataStore } from '../store/userStore'

import { Ref, ref } from "vue"
import * as vue from "vue"

import RadioButton from 'primevue/radiobutton';
import HexCooccurrence from "../components/HexCooccurrence.vue";


const store = useUserDataStore()
const server_address = vue.inject("server_address")
const segmentation = vue.computed(() => store.segmentation)

const selected_hex: Ref<string> = ref("") 
const random_hex_data: Ref<Any> = ref() 
const cells = [0, 1, 2, 3, 4]

vue.watch(selected_hex, () => {
    console.log("selected hex changed: ", selected_hex.value)
})
vue.onMounted(() => {
    fetch_random_hex("CNN", "Donald_Trump")
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
            random_hex_data.value = json
            console.log("random hex fetched", json)
        })
}


</script>
<template>
    <div class='selection-grid'>
        <div class=hex-cell v-for="(hex, index) in random_hex_data"> 
            <div class=test-hex> {{ hex.title }}</div>
            <HexCooccurrence class="belief-hexview" title="belief-hexview" :id="`belief-hex-${index}`"
                :entity_cooccurrences="hex.data" :segmentation="segmentation"
                :show_blink="true">
            </HexCooccurrence>
            <RadioButton :value="index" v-model="selected_hex" />
            <svg>
                <pattern id="diagonalHatch" width="10" height="10" patternTransform="rotate(45 0 0)"
                    patternUnits="userSpaceOnUse">
                    <rect x="0" y="0" width="10" height="10" style="fill:#baf0f5" />
                    <line x1="0" y1="0" x2="0" y2="10" style="stroke:#f4c49c; stroke-width:8" />
                </pattern>
            </svg>
        </div>
    </div>
</template>

<style scoped>
.selection-grid {
  width: 100%;
  height: 100%;
  display: flex;
  flex-wrap: wrap;
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
}

.p-radiobutton {
 display:inline-flex;
 cursor:pointer;
 user-select:none;
 vertical-align:bottom;
 position: absolute;
 top: 94%;
 left: 48%;
}

.test-hex {
  text-align: center;
  top: 3%;
  z-index: 100;
}
</style>