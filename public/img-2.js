/**
 * Created by Leon.Revill on 06/09/2017.
 */
const __style__ = Symbol();

class Img2 extends HTMLElement {

    constructor() {
        super();
        this._$img = null;
        this._preview = null;
        this._src = null;
        this._light = null;
        this._width = null;
        this._height = null;
        this._rendered = false;
        this._srcReady = false;
        this._hasBeenVisible = false;
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
                    filter: blur(2vw);
                    transform: scale(1.05);
                }
                img[loaded] {
                    filter: none;
                }
            </style>
        `;
    }

    connectedCallback() {

        // Check to see if we have a src, if not return and do nothing else
        this._src = this.getAttribute("src");
        // Grab the initial attribute values
        this._light = this.getAttribute("src-light");
        this._preview = this.getAttribute("src-preview");
        this._width = this.getAttribute("width");
        this._height = this.getAttribute("height");


        this._render();
    }

    static get observedAttributes() {
        return ["src", "src-light", "src-preview"];
    }
    attributeChangedCallback(name) {
        switch (name) {
            case "src":
                break;
            case "src-light":
                break;
            case "src-preview":
                break;
        }
    }

    _render() {

        if (!this._src || !this._width || !this._height) return;

        this.style.width = `${this._width}px`;
        this.style.height = `${this._height}px`;

        if (this._rendered === false) {
            // Attach the Shadow Root to the element
            this.attachShadow({mode: "open"});
            // Create the initial template with styles
            this.shadowRoot.innerHTML = `${this[__style__]()}`;
            // Create the actual image element to be used to display the image
            this._$img = document.createElement("img");
            // Add the image to the Shadow Root
            this.shadowRoot.appendChild(this._$img);
            this._rendered = true;
        }

        // If some dimensions have been specified then add them to the image element
        if (this._width !== null) this._$img.width = this._width;
        if (this._height !== null) this._$img.height = this._height;

        // Start to preload the src image
        this.load(this._src, () => {
            // Image preloaded and cached
            this._srcReady = true;
            // If the image has been visible in this time we need to display the image as soon as possible!
            if (this._hasBeenVisible === true) {
                this._displaySrc();
            }
        });

        // Figure out if this image is within view
        this.addIntersectListener(this, () => {
            // Mark image as having been visible on screen
            this._hasBeenVisible = true;
            // Remove the intersect listener as we are now done with it
            this.removeIntersectListener(this);
            // If the src is already ready then lets load it!
            if (this._srcReady === true) {
                this._displaySrc();
            }
        });

        // If the preview image is available load it right away
        if (this._preview !== null) this._$img.src = this._preview;

    }

    _displaySrc() {
        this._$img.setAttribute("loaded", "");
        this._$img.src = this._src;
    }

}

// Prototype methods - added to the class prototype so we only have a single instance of these methods across all instances of Img2

const proto = Img2.prototype;

proto._callbacks = {};
proto._intersectListeners = new Map();

proto.worker = new Worker(window.URL.createObjectURL(
    new Blob([`self.onmessage=${function (e) { caches.open("img-2").then((cache) => { cache.add(e.data.location + e.data.url).then(() => { self.postMessage(e.data.url); }).catch(console.error); }); }.toString()};`], { type: "text/javascript"})
));

proto.worker.onmessage = function (e) {
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

proto.load = function (url, preloadCallback) {

    let slot = proto._callbacks[url];
    if (slot === undefined) {
        proto._callbacks[url] = {
            cached: false,
            cbs: [preloadCallback]
        };
        proto.worker.postMessage({ location: window.location.href, url: url });
    } else {
        if (slot.cached === true) {
            preloadCallback();
        } else {
            slot.cbs.push(preloadCallback);
        }
    }

};


proto.addIntersectListener = function ($element, intersectCallback) {
    proto._intersectListeners.set($element, intersectCallback);
    proto.observer.observe($element);
};
proto.removeIntersectListener = function ($element) {
    console.log("UNOBSERVED:", $element);
    if ($element !== undefined) {
        proto.observer.unobserve($element);
    }
};

proto.handleIntersect = function (entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting === true) {
            const cb = proto._intersectListeners.get(entry.target);
            if (cb !== undefined) cb(entry);
        }
    });
};

proto.observer = new IntersectionObserver(proto.handleIntersect, {
    root: null,
    rootMargin: "0px",
    threshold: 0
});

window.customElements.define("img-2", Img2);
