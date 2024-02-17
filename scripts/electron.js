import { build, createServer } from 'vite';
import electronPath from 'electron';
import { spawn } from 'child_process';
const mode = process.env.MODE === 'development' ? 'development' : 'production';
const logLevel = 'warn';
/**
 * Setup watcher for `main` package
 * On file changed it totally re-launch electron app.
 * @param {import('vite').ViteDevServer} watchServer Renderer watch server instance.
 * Needs to set up `VITE_DEV_SERVER_URL` environment variable from {@link import('vite').ViteDevServer.resolvedUrls}
 */
function setupMainPackageWatcher() {
    console.log('build main');
    const electronApp = {
        current: undefined
    };
    return build({
        mode,
        logLevel,
        configFile: 'projects/main/vite.config.js',
        build: {
            /**
             * Set to {} to enable rollup watcher
             * @see https://vitejs.dev/config/build-options.html#build-watch
             */
            watch: {},
        },
        plugins: [
            {
                name: 'reload-app-on-main-package-change',
                closeBundle: () => {
                    console.log('**** close main bundle');
                },
                writeBundle: () => {
                    console.log('**** write main bundle');
                    /** Kill electron if process already exist */
                    if (electronApp.current) {
                        electronApp.current.removeListener('exit', process.exit);
                        electronApp.current.kill('SIGINT');
                        electronApp.current = undefined;
                    }
                    /** Spawn new electron process */
                    electronApp.current = spawn(String(electronPath), ['--inspect', '--serve', '.'], {
                        stdio: 'inherit',
                    });
                    /** Stops the watch script when the application has been quit */
                    electronApp.current.addListener('exit', process.exit);
                },
            },
        ],
    });
}
/**
 * Setup watcher for `preload` package
 * On file changed it reload web page.
 * @param {import('vite').ViteDevServer} watchServer Renderer watch server instance.
 * Required to access the web socket of the page. By sending the `full-reload` command to the socket, it reloads the web page.
 */
function setupPreloadPackageWatcher({ onBundle, onBundled }) {
    console.log('build preload');
    return build({
        mode,
        logLevel,
        configFile: 'projects/preload/vite.config.js',
        build: {
            /**
             * Set to {} to enable rollup watcher
             * @see https://vitejs.dev/config/build-options.html#build-watch
             */
            watch: {},
        },
        plugins: [
            {
                name: 'reload-page-on-preload-package-change',
                buildStart: () => {
                    console.log('++++ preload buildStart');
                    onBundle();
                },
                resolveId: () => console.log('++++ preload resolveId'),
                load: () => console.log('++++ preload load'),
                transform: () => console.log('++++ preload transform'),
                handleHotUpdate: () => console.log('++++ preload handleHotUpdate'),
                buildEnd: () => console.log('++++ preload buildEnd'),
                closeBundle: () => {
                    console.log('++++ preload closeBundle');
                },
                writeBundle: () => {
                    console.log('++++ preload writeBundle');
                    onBundled();
                }
            },
        ],
    });
}
async function electronBuilder() {
    console.log('_ electronBuilder start process.env.MODE', process.env.MODE);
    const rendererWatchServer = await createServer({
        mode,
        logLevel,
        root: 'dist/renderer/browser',
        configFile: false,
    }).then(s => s.listen());
    const onPreloadBundle = () => {
        console.log('_ electronBuilder onPreloadBundle cb');
    };
    const onPreloadBundled = () => {
        console.log('_ electronBuilder onPreloadBundled cb');
        rendererWatchServer.ws.send({
            type: 'full-reload',
        });
    };
    console.log('_ electronBuilder resolvedUrls', rendererWatchServer.resolvedUrls);
    process.env.VITE_DEV_SERVER_URL = rendererWatchServer.resolvedUrls?.local[0];
    setupPreloadPackageWatcher({ onBundle: onPreloadBundle, onBundled: onPreloadBundled });
    setupMainPackageWatcher();
}
electronBuilder();
/*
function buildElectronBuilder(
    options: Options,
    context: BuilderContext,
): Observable<BuilderOutput> {
    

    electronBuilder()

    // TODO: process.env.VITE_DEV_SERVER_URL

    
    const electronObserver = new Observable<BuilderOutput>(({ next }) => {
        next({ success: true })
    })
    return electronObserver;
}

export default createBuilder(buildElectronBuilder);
*/
