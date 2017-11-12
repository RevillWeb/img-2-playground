/**
 * Created by Leon Revill on 7/27/2017.
 * Blog: blog.revillweb.com
 * Twitter: @RevillWeb
 * GitHub: github.com/RevillWeb
 */
import Vue from "vue";
import VueRouter from "vue-router";
import { Img2, PRELOAD_MODES } from "./web-components/img-2";

// Img2.prototype.mode = PRELOAD_MODES.WHEN_VISIBLE;

Vue.config.ignoredElements = [
    "img-2"
];

Vue.use(VueRouter);

import Search from "./pages/Search.vue";

const routes = [
    { path: "/search", name: "search-with", component: Search },
    { path: "*", redirect: "/search" }
];

const router = new VueRouter({
    mode: "history",
    routes,
    scrollBehavior () {
        return { x: 0, y: 0 }
    }
});

const app = new Vue({
    router
}).$mount("#app");
