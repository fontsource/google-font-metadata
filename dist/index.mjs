import jsonfile from 'jsonfile';
import 'consola';
import 'got';

const APIDirect = jsonfile.readFileSync("../data/api-response.json");

export { APIDirect };
