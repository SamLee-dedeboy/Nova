<script>
import { defineComponent } from '@vue/composition-api'
import TieredMenu from 'primevue/tieredmenu';
export default defineComponent({
    components: {
        TieredMenu
    },
    props:['targets'],
    data() {
        return {
            items:[]
        }
    },
    watch: {
        targets: function() {
            this.items = this.targets.map(target => Object({label: target}))
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
    <Button type="button" label="Target" @click="toggle" />
    <TieredMenu id="target_selection" ref="menu" :model="items" :popup="true"
        style="width: auto"
    >
        
    </TieredMenu>
</template>
