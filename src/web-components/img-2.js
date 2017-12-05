/**
 * Created by Leon.Revill on 06/09/2017.
 */
const __style__ = Symbol();

export class Img2 extends HTMLElement {

    constructor() {
        super();

        // Private class variables
        this._root = null;
        this._$img = null;
        this._$preview = null;
        this._preview = null;
        this._src = null;
        this._width = null;
        this._height = null;
        this._rendered = false;
        this._loading = false;
        this._loaded = false;
        this._preCaching = false;
        this._preCached = false;
        this._srcReady = false;

        // Settings
        this._renderOnPreCached = Img2.settings.RENDER_ONCE_PRECACHED;

        // Bound class methods
        this._precache = this._precache.bind(this);
        this._onImgLoad = this._onImgLoad.bind(this);
        this._onImgPreCached = this._onImgPreCached.bind(this);
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
        // Override any global settings
        const ropc = this.getAttribute("render-on-pre-cached");
        if (ropc === "false") {
            this._renderOnPreCached = false;
        }

        if (!this._src || !this._width || !this._height) return;

        // Set the height and width of the element so that we can figure out if it is on the screen or not
        this.style.width = `${this._width}px`;
        this.style.height = `${this._height}px`;

        // Figure out if this image is within view
        Img2.addIntersectListener(this, () => {
            Img2._removePreCacheListener(this._precache);
            this._render();
            this._load();
            Img2.removeIntersectListener(this);
        });

        // Listen for precache instruction
        Img2._addPreCacheListener(this._precache, this._src);

    }

    _load() {
        if (this._preCached === false) Img2._priorityCount += 1;
        this._$img.onload = this._onImgLoad;
        this._loading = true;
        this._$img.src = this._src;
    }

    _onImgLoad() {
        this._loading = false;
        this._loaded = true;
        if (this._$preview !== null) {
            this._root.removeChild(this._$preview);
            this._$preview = null;
        }
        this._$img.onload = null;
        if (this._preCached === false) Img2._priorityCount -= 1;
    }

    _onImgPreCached() {
        this._preCaching = false;
        this._preCached = true;
        if (this._renderOnPreCached !== false) {
            this._render();
            this._load();
        }
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
        this._root = this.attachShadow({mode: "open"});
        // Create the initial template with styles
        this._root.innerHTML = `${this[__style__]()}`;
        // If a preview image has been specified
        if (this._preview !== null && this._preCached === false && this._loaded === false) {
            // Create the element
            this._$preview = document.createElement("img");
            this._$preview.classList.add("img2-preview");
            this._$preview.src = this._preview;
            // Add the specified width and height
            this._$preview.width = this._width;
            this._$preview.height = this._height;
            // Add it to the Shadow Root
            this._root.appendChild(this._$preview);
        }
        // Create the actual image element to be used to display the image
        this._$img = document.createElement("img");
        this._$img.classList.add("img2-src");
        // add the specified width and height to the image element
        this._$img.width = this._width;
        this._$img.height = this._height;
        // Add the image to the Shadow Root
        this._root.appendChild(this._$img);
        // Flag as rendered
        this._rendered = true;

    }

    _precache() {
        this._preCaching = true;
        Img2._preCache(this._src, this._onImgPreCached);
    }


    static _preCacheListeners = new Map();
    static _addPreCacheListener(cb, url) {
        Img2._preCacheListeners.set(cb, url);
    }

    static _removePreCacheListener(cb) {
        Img2._preCacheListeners.delete(cb);
    }

    static _startPreCache() {
        for (let cb of Img2._preCacheListeners.keys()) cb();
    }

    /**
     * Methods used to determine when currently visible (priority) elements have finished download to then inform other elements to pre-cache
     */

    static __priorityCount = 0;
    static _startPreCacheDebounce = null;
    static get _priorityCount() {
        return Img2.__priorityCount;
    }
    static set _priorityCount(value) {
        Img2.__priorityCount = value;
        if (Img2.__priorityCount < 1) {
            // Inform components that they can start to pre-cache their images
            // Debounce in case the user scrolls because then there will be more priority images
            if (Img2._startPreCacheDebounce !== null) {
                clearTimeout(Img2._startPreCacheDebounce);
                Img2._startPreCacheDebounce = null;
            }
            Img2._startPreCacheDebounce = setTimeout(function(){
                if (Img2.__priorityCount < 1) Img2._startPreCache();
            }, 500);
        }
    }

    /**
     * Methods used to determine when this element is in the visible viewport
     */
    static _intersectListeners = new Map();
    static _observer = new IntersectionObserver(Img2._handleIntersect, {
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

    static _handleIntersect(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting === true) {
                const cb = Img2._intersectListeners.get(entry.target);
                if (cb !== undefined) cb(entry);
            }
        });
    }

    static _preCacheCallbacks = {};
    static _preCache(url, cb) {

        let slot = Img2._preCacheCallbacks[url];
        if (slot === undefined) {
            Img2._preCacheCallbacks[url] = {
                cached: false,
                cbs: [cb]
            };
            const location = (url.indexOf("http") > -1) ? url : window.location.href + url;
            Img2._worker.postMessage({ location: location, url: url });
        } else {
            if (slot.cached === true) {
                cb();
            } else {
                slot.cbs.push(cb);
            }
        }
    }
}

/**
 * Methods used to pre-cache images using a WebWorker
 */

Img2._worker = new Worker(window.URL.createObjectURL(
    new Blob([`self.onmessage=${function (e) {
        fetch(e.data.location).then((response) => {
            if (response.status === 200 || response.status === 0) {
                return Promise.resolve(response)
            } else {
                return Promise.reject(new Error(`Couldn't pre-cache URL '${e.data.url}'.`));
            }
        }).then((response) => {
            return response.blob();
        }).then(() => {
            self.postMessage(e.data.url);
        }).catch(console.error);
    }.toString()};`], { type: "text/javascript"})
));

Img2._worker.onmessage = function (e) {
    const slot = Img2._preCacheCallbacks[e.data];
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

/** Img2 Settings **/
Img2.settings = {
    "RENDER_ONCE_PRECACHED": true // Set this to false to save memory but can cause jank during scrolling
};

window.customElements.define("img-2", Img2);
