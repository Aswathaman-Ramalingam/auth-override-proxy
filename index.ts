import { loadAppOptions, loadProxyConfig } from "./src/config";
import { startServer } from "./src/server";

const config = await loadProxyConfig();
const options = loadAppOptions();

startServer(config, options);
