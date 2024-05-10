
import {map} from './index'
map(__dirname + '/data.csv', 0, 2).then(() => {
    process.exit(0);
})
