<script setup lang="ts">
import * as vue from "vue"
import SelectButton from "primevue/selectbutton"
const props = defineProps({
    outlet_leaning: Object as () => { [id: string]: number},
    fontSize: String
})

const outlet_list = vue.computed(() => {
    if(props.outlet_leaning == undefined) return []
    return Object.keys(props.outlet_leaning)
})

const mark_options = [
  {leaning: 'Left', value: 0},
  {leaning: 'Neutral', value: 1},
  {leaning: 'Right', value: 2},
]

function outletIconStyle(name: string) {
    let className = name.replaceAll(' ', '-') + '-icon';
    className = (className.includes("FoxNews") || className.includes("Breitbart")) ? className : 'icon';
    return className;
}

</script>

<template>
    <div class="outlet-weight-grid-container">
        <div class="outlet-weight-grid-cell" v-for="outlet in outlet_list" >
            <div :class="['journal-style']">
                <img :src="`/${outlet}.png`"
                :class="['journal-image',`${outletIconStyle(outlet)}`]" />
            </div>
            <div class="wrapper">
                <span class="outletName" :style="{'font-size':fontSize}">{{outlet}}</span>
                <SelectButton v-model="outlet_leaning[outlet]" 
                    class='leaning-button'
                    optionValue="value" optionLabel="leaning" :options="mark_options"/>
            </div>
        </div>
    </div>
</template>
<style scoped>
.slider-label {
    margin-left: auto;
    margin-right: auto;
    position: absolute;
bottom: -20px;
font-size: 0.8rem;
width: 100%;
text-align: center;
}
.outlet-weight-grid-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, auto);
  /* grid-column-gap: 22px; */
  height: max-content;
}
.outlet-weight-grid-cell {
  display: flex;
  flex-direction: row;
  align-items: center;
  text-align: center;
  /* margin: 5%; */
}


.journal-style {
    width: 40px;
    height: 40px;
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
    flex-direction: column;
    text-align: center;
    align-items: center;
    margin-left: 3px;
}

.outletName{
    position: relative;
    width: 70%;
    color: black;
    text-align: center;
    margin-bottom: -5px;
}

/**
    leaning button
 */
:deep(.p-button) {
    padding: 0rem 0.3rem;
    font-size: 0.7rem;
}
</style>