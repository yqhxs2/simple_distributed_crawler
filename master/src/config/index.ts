import devConfig from "./dev"
import prodConfig from "./prod"


const config = process.env.NODE_ENV === 'dev' ? devConfig : prodConfig

export default config