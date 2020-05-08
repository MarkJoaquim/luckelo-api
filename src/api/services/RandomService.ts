import axios from 'axios';
import { Service } from 'typedi';
import { env } from '../../env';

class RandomIntegerRequest {
    public jsonrpc = '2.0';
    public method = 'generateIntegers';
    public params = {};
    public id: number;

    constructor(key: string, min: number, max: number, n: number = 1) {
        this.params = {
            apiKey: key,
            n,
            min,
            max,
            replacement: true,
            base: 10,
        };
        this.id = Math.floor(Math.random() * 1000);
    }
}

@Service()
export class RandomService {

    public apiKey: string;

    constructor() {
        this.apiKey = env.app.randomOrgKey;
    }

    public async getRandomNumbers(min: number, max: number, n: number = 1): Promise<number[]> {
        const response = await axios.post('https://api.random.org/json-rpc/2/invoke', new RandomIntegerRequest(this.apiKey, min, max, n));

        const data: number[] = response.data.result.random.data;

        return data;
    }
}
