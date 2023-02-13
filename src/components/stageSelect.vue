<template>
    <Steps :modal="stages" />
</template>

<script setup lang="ts">
import Steps from 'primevue/steps';

const stages = [
    {
        label: 'Topic Selection',
        to: '/'
    },
    {
        label: 'Compare',
        to: '/compare/:entity/'
    },
    {
        label: 'Article Inspection',
        to: '/inspection/:entity'
    }
]
</script>


<style>

</style>