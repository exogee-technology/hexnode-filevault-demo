import got from 'got';

const { API_KEY } = process.env;

if (!API_KEY) throw new Error('You must supply a hexnode API key to use this script.');

const api = got.extend({
	headers: { Authorization: API_KEY },
	responseType: 'json',
	prefixUrl: 'https://exogee.hexnodemdm.com/api/v1',
	hooks: {
		beforeRequest: [
			(options) => {
				// The Hexnode API is silly and 404s if you don't include a trailing slash
				const urlString = options.url?.toString();
				if (urlString && !urlString.endsWith('/')) {
					options.url = `${urlString}/`;
				}
			},
		],
	},
});

interface ArrayResponse<T> {
	count: number;
	next: string | null;
	previous: string | null;
	results: T[];
}

interface HexnodeDevice {
	id: number;
	device_name: string;
	model_name: string;
	os_name: string;
	os_version: string;
}

interface HexnodeDeviceDetail {
	id: number;
	policies: Array<{
		id: number;
		name: string;
		version: number;
	}>;
}

const main = async () => {
	const { body } = await api.get<ArrayResponse<HexnodeDevice>>('devices');

	for (const device of body.results) {
		if (device.os_name === 'macOS') {
			console.log(`macOS device found. Getting: devices/${device.id}`);
			const deviceResult = await api.get<HexnodeDeviceDetail>(`devices/${device.id}`);

			for (const policy of deviceResult.body.policies) {
				if (policy.name === 'FileVault') {
					const policyResult = await api.get(`policy/${policy.id}`);
					console.log(policyResult.body);
				}
			}
		}
	}
};

main();
