<script setup lang="ts">
import * as vue from "vue"
import Slider from "primevue/slider"
const props = defineProps({
    outlet_weight_dict: Object as () => { [id: string]: number},
    fontSize: String
})
let dragging = false;
const emit = defineEmits(["update_outlet_weight"])

const outlet_list = vue.computed(() => {
    if(!props.outlet_weight_dict) return undefined
    return Object.keys(props.outlet_weight_dict)
})

function handleChange(outlet) {
    emit("update_outlet_weight", {outlet: outlet, value: props.outlet_weight_dict![outlet] })
}

function outletIconStyle(name: string) {
    let className = name.replaceAll(' ', '-') + '-icon';
    className = (className.includes("FoxNews") || className.includes("Breitbart")) ? className : 'icon';
    return className;
}

</script>

<template>
    <div class="outlet-weight-grid-container">
        <div class="outlet-weight-grid-cell" v-for="outlet in outlet_list" >
            <div class="wrapper">
                <div :class="['journal-style']">
                    <img :src="`../src/assets/${outlet}.png`"
                    :class="['journal-image',`${outletIconStyle(outlet)}`]" />
                </div>
                <span class="outletName" :style="{'font-size':fontSize}">{{outlet}}</span>
            </div>

            <slider 
            v-model="outlet_weight_dict![outlet]"
            :step="0.01"
            :min="0"
            :max="1"
            @mouseup="handleChange(outlet)"
            />
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
  margin: 5%;
}


.journal-style {
    width: 30px;
    height: 30px;
    position: relative;
    overflow: hidden;
    border-radius: 50%;
    border: #d7d7d7 3px solid;
}

.FoxNews-icon {
    height: 85%;
    right: 30%;
    bottom: 2%;
}

.Breitbart-icon {
    height: 65%;
    top: 10%;
    left: 10%;
}

.icon {
    height: 100%;
}

.wrapper{
    display: flex;
}

.outletName{
    position: relative;
    width: 70%;
    color: black;
    text-align: center;
}

</style>