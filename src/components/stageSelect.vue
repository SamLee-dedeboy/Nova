<template>
    <Steps :model="stages" :readonly="enableNext" aria-label="Form Steps"/>
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
const enableNext = vue.computed(() => {
    console.log(route.name)
    switch (route.name) {
        case "home": return selected_entity.value == undefined
        case "belief": return true
        default: return false;
    }
})
const stages = vue.computed(() => [
    {
      to: `/`,
      label: "Home",
    },
    {
      to: `/belief/first/${random_outlet[0]}/${selected_entity.value?.name}`,
      label: "Belief",
    },
    {
      to: `/belief/secoond/${random_outlet[1]}/${selected_entity.value?.name}`,
      label: "Belief",
    },
    {
      to: `/compare/${selected_entity.value?.name}/`,
      label: "Compare",
    },
    {
      to: `/inspection/${selected_entity.value?.name}`,
      label: "Inspection",
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