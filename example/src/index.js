import { Core } from './DemoCore'
import { loadDemoModule } from './DemoWasm'

const defaultConfig = {
    debug: false
}

export async function Demo(config = defaultConfig) {
    return loadDemoModule(Core(), config)
}
