<template>
    <Steps :model="stages" :readonly="false" aria-label="Form Steps"/>
</template>

<script setup lang="ts">
import Steps from 'primevue/steps';
import router from '../router'
import { useUserDataStore } from '../store/userStore'
import { useRoute , useRouter} from 'vue-router'
import * as vue from "vue"

const store = useUserDataStore()
const route = useRoute()
const selected_entity = vue.computed(() => store.selected_entity)
const random_outlet = vue.inject("random_outlet")

const disabled_item_array = vue.computed(() => {
    switch (route.name) {
        case "home": return [true, selected_entity.value == undefined, true, true, true]
        case "belief": return [false, false, true, true, true]
        case "compare": return [false, false, false, false, false]
        case "inspection": return [false, false, false, false, false]
        default: return [true, true, true, true, true]
    }
})
const stages = vue.computed(() => [
    {
      to: `/`,
      label: "Home",
      disabled: disabled_item_array.value[0],
    },
    {
      to: `/belief/first/${random_outlet[0]}/${selected_entity.value?.name}`,
      label: "Belief",
      disabled: disabled_item_array.value[1],
    },
    {
      to: `/belief/second/${random_outlet[1]}/${selected_entity.value?.name}`,
      label: "Belief",
      disabled: disabled_item_array.value[2],
    },
    {
      to: `/compare/${selected_entity.value?.name}/`,
      label: "Compare",
      disabled: disabled_item_array.value[3],
    },
    {
      to: `/inspection/${selected_entity.value?.name}`,
      label: "Inspection",
      disabled: disabled_item_array.value[4],
    },
    // {
    //   to: `/summary/${selected_entity.value?.name}`,
    //   label: "Summary",
    // },
  ]
)

</script>


<style>

</style>