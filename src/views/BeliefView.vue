<script setup lang=ts>
import RadioButton from 'primevue/radiobutton';
import { Ref, ref } from "vue"
import * as vue from "vue"
const selected_hex: Ref<string> = ref("") 

vue.watch(selected_hex, () => {
    console.log("selected hex changed: ", selected_hex.value)
})

</script>
<template>
    <div class='selection-grid'>
        <div class=hex-cell> 
            <div class=test-hex-1> hex 1</div>
            <RadioButton name="cell-1" value="0" v-model="selected_hex" />
        </div>
        <div class=hex-cell> 
            <div class=test-hex-2> hex 2</div>
            <RadioButton name="cell-2" value="1" v-model="selected_hex" />
        </div>
        <div class=hex-cell> 
            <div class=test-hex-3> hex 3 </div>
            <RadioButton name="cell-3" value="2" v-model="selected_hex" />
        </div>
        <div class=hex-cell> 
            <div class=test-hex-4> hex 4</div>
            <RadioButton name="cell-4" value="3" v-model="selected_hex" />
        </div>
        <div class=hex-cell> 
            <div class=test-hex-5> hex 5</div>
            <RadioButton name="cell-5" value="4" v-model="selected_hex" />
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
  border: solid 1px black;
  margin: 0px 1px;
}

.p-radiobutton {
 display:inline-flex;
 cursor:pointer;
 user-select:none;
 vertical-align:bottom;
 position: absolute;
 top: 80%;
 left: 50%;
}

</style>