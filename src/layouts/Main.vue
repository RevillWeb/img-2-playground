<template>
    <div class="container">
        <content>
            <slot></slot>
        </content>
    </div>
</template>

<script>
    export default {
        computed: {
            currentRoute: function () {
                return this.$router.currentRoute.name;
            }
        }
    }
</script>

<style scoped>
    .container {
        width: 100%;
        height: 100%;
        /*display: flex;*/
        /*flex-direction: column;*/
    }
</style>
