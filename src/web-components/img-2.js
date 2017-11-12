/**
 * Created by Leon.Revill on 06/09/2017.
 */
const __style__ = Symbol();

export class Img2 extends HTMLElement {

    constructor() {
        super();
        this._$img = null;
        this._$preview = null;
        this._preview = null;
        this._src = null;
        this._width = null;
        this._height = null;
        this._rendered = false;
        this._loading = false;
        this._loaded = false;
        this._preloading = false;
        this._preloaded = false;
        this._srcReady = false;

        this._preload = this._preload.bind(this);
        this._onImgLoad = this._onImgLoad.bind(this);
    }

    [__style__]() {
        return `
            <style>
                :host {
                    position: relative;
                    overflow: hidden;
                    display: inline-block;
                    outline: none;
                }
                img {
                    position: absolute;
                }
                img.img2-src {
                    z-index: 1;
                }
                img.img2-preview {
                    z-index: 2;
                    filter: blur(2vw);
                    transform: scale(1.1);
                    width: 100%;
                    height: 100%;
                    top: 0;
                    left: 0;
                }
            </style>
        `;
    }

    connectedCallback() {

        // Check to see if we have a src, if not return and do nothing else
        this._src = this.getAttribute("src");
        // Grab the initial attribute values
        this._preview = this.getAttribute("src-preview");
        this._width = this.getAttribute("width");
        this._height = this.getAttribute("height");

        if (!this._src || !this._width || !this._height) return;

        // Set the height and width of the element so that we can figure out if it is on the screen or not
        this.style.width = `${this._width}px`;
        this.style.height = `${this._height}px`;

        // Figure out if this image is within view
        Img2.addIntersectListener(this, () => {
            Img2._removePreloadListener(this._preload);
            this._render();
            this._$preview.src = this._preview;
            this._load();
            Img2.removeIntersectListener(this);
        });

        // Listen for preload instruction
        Img2._addPreloadListener(this._preload, this._src);

    }

    _load() {
        if (this._preloaded === false) Img2._priorityCount += 1;
        this._$img.onload = this._onImgLoad;
        this._loading = true;
        this._$img.src = this._src;
    }

    _onImgLoad() {
        this._loading = false;
        this._loaded = true;
        this.shadowRoot.removeChild(this._$preview);
        this._$img.onload = null;
        if (this._preloaded === false) Img2._priorityCount -= 1;
    }

    _onImgPreload() {
        this._preloading = false;
        this._preloaded = true;
        this._load();
    }

    static get observedAttributes() {
        return ["src", "src-preview"];
    }
    attributeChangedCallback(name) {
        switch (name) {
            case "src":
                break;
            case "src-preview":
                break;
        }
    }

    _render() {

        if (this._rendered === true) return;

        // Attach the Shadow Root to the element
        this.attachShadow({mode: "open"});
        // Create the initial template with styles
        this.shadowRoot.innerHTML = `${this[__style__]()}`;
        if (this._preview !== null) {
            this._$preview = document.createElement("img");
            this._$preview.classList.add("img2-preview");
            this.shadowRoot.appendChild(this._$preview);
        }
        // Create the actual image element to be used to display the image
        this._$img = document.createElement("img");
        this._$img.classList.add("img2-src");
        // Add the image to the Shadow Root
        this.shadowRoot.appendChild(this._$img);

        // If some dimensions have been specified then add them to the image element
        this._$img.width = this._width;
        this._$img.height = this._height;
        this._$preview.width = this._width;
        this._$preview.height = this._height;

        this._rendered = true;

    }

    _preload() {
        this._preloading = true;
        console.log("START PRELOAD:", this);
    }


    static _preloadListeners = new Map();
    static _addPreloadListener(cb, url) {
        Img2._preloadListeners.set(cb, url);
    }

    static _removePreloadListener(cb) {
        Img2._preloadListeners.delete(cb);
    }

    static _startPreload() {
        for (let cb of Img2._preloadListeners.keys()) {
            cb();
        }
    }

    /**
     * Methods used to determine when currently visible (priority) elements have finished download to then inform other elements to preload
     */

    static __priorityCount = 0;
    static _startPreloadDebounce = null;
    static get _priorityCount() {
        return Img2.__priorityCount;
    }
    static set _priorityCount(value) {
        Img2.__priorityCount = value;
        if (Img2.__priorityCount < 1) {
            // Inform components that they can start to preload their images
            // Debounce in case the user scrolls because then there will be more priority images
            if (Img2._startPreloadDebounce !== null) {
                clearTimeout(Img2._startPreloadDebounce);
                Img2._startPreloadDebounce = null;
            }
            Img2._startPreloadDebounce = setTimeout(function(){
                if (Img2.__priorityCount < 1) Img2._startPreload();
            }, 500);
        }
    }

    /**
     * Methods used to determine when this element is in the visible viewport
     */
    static _intersectListeners = new Map();
    static _observer = new IntersectionObserver(Img2.handleIntersect, {
        root: null,
        rootMargin: "0px",
        threshold: 0
    });

    static addIntersectListener($element, intersectCallback) {
        Img2._intersectListeners.set($element, intersectCallback);
        Img2._observer.observe($element);
    }

    static removeIntersectListener($element) {
        if ($element) Img2._observer.unobserve($element);
    }

    static handleIntersect(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting === true) {
                const cb = Img2._intersectListeners.get(entry.target);
                if (cb !== undefined) cb(entry);
            }
        });
    }

    /**
     * Methods used to preload/precache images using a WebWorker
     */
    static _worker = new Worker(window.URL.createObjectURL(
        new Blob([`self.onmessage=${function (e) { caches.open("img-2").then((cache) => { cache.add(e.data.location + e.data.url).then(() => { self.postMessage(e.data.url); }).catch(console.error); }); }.toString()};`], { type: "text/javascript"})
    ));

}

Img2._worker.onmessage = function (e) {
    const slot = proto._callbacks[e.data];
    if (slot !== undefined) {
        slot.cached = true;
        slot.cbs = slot.cbs.filter(cb => {
            // Call the callback
            cb();
            // Remove the callback
            return false;
        });
    }
};

window.customElements.define("img-2", Img2);
