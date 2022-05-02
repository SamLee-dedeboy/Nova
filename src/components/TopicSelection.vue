<script>
import { defineComponent } from '@vue/composition-api'
import TieredMenu from 'primevue/tieredmenu';
export default defineComponent({
    components: {
        TieredMenu
    },
    props:['topics'],
    data() {
        return {
            items:[
                {
                    label:'Topic 1'
                },
                {
                    label:'Topic 2'
                }
            ]
        }
    },
    methods: {
        toggle(event) {
            this.$refs.menu.toggle(event);
        }   
    }
})
</script>

<template>
    <Button type="button" label="Topic" @click="toggle" />
    <TieredMenu ref="menu" :model="items" :popup="true" />
</template>