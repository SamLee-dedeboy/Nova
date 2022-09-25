<script setup lang="ts">
import * as vue from "vue"
import Slider from "primevue/slider"
const props = defineProps({
    outlet_weight_dict: Object as () => { [id: string]: number}
})

const emit = defineEmits(["update_outlet_weight"])

const outlet_list = vue.computed(() => {
    if(!props.outlet_weight_dict) return undefined
    return Object.keys(props.outlet_weight_dict)
})

function handleChange(outlet) {
    emit("update_outlet_weight", {outlet: outlet, value: props.outlet_weight_dict![outlet] })
}

</script>

<template>
    <div class="outlet-weight-grid-container">
        <div class="outlet-weight-grid-cell" v-for="outlet in outlet_list" >
            <Slider 
            v-model="outlet_weight_dict![outlet]"
            :step="0.01"
            :min="0"
            :max="1"
            @slideend="handleChange(outlet)"
            >
            </Slider> 
            <span class="slider-label" style="font-size:small">{{outlet}}</span>
        </div>
    </div>
</template>
<style scoped>
.slider-label {
    margin-left: auto;
    margin-right: auto;
}
.outlet-weight-grid-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, auto);
  grid-column-gap: 22px;
  height: max-content;
}
.outlet-weight-grid-cell {
  display: flex;
  flex-direction: column;
}
</style>