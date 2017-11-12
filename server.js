/**
 * Created by Leon Revill on 9/30/2017.
 * Blog: blog.revillweb.com
 * Twitter: @RevillWeb
 * GitHub: github.com/RevillWeb
 */
var browserSync = require("browser-sync");
var spa         = require("browser-sync-spa");

browserSync.use(spa({
    // Options to pass to connect-history-api-fallback.
    // If your application already provides fallback urls (such as an existing proxy server),
    // this value can be set to false to omit using the connect-history-api-fallback middleware entirely.
    history: {
        index: './public/index.html'
    }
}));

browserSync({
    open: false,
    server: "public",
    files:  "./public"
});