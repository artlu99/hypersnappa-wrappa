export const firstNUnique = <T, K>(xs: T[], key: (x: T) => K, n: number) => {
	const seen = new Set<K>();
	const out: T[] = [];
	for (const x of xs) {
		const k = key(x);
		if (seen.has(k)) continue;
		seen.add(k);
		out.push(x);
		if (out.length >= n) break;
	}
	return out;
};

const charCodeMap = {
	zero: 48,
	nine: 57,
	A: 65,
	F: 70,
	a: 97,
	f: 102,
} as const;

const charCodeToBase16 = (char: number) => {
	if (char >= charCodeMap.zero && char <= charCodeMap.nine)
		return char - charCodeMap.zero;
	if (char >= charCodeMap.A && char <= charCodeMap.F)
		return char - (charCodeMap.A - 10);
	if (char >= charCodeMap.a && char <= charCodeMap.f)
		return char - (charCodeMap.a - 10);
	return undefined;
}

export const hexToBytes = (hex_: `0x${string}`): Uint8Array => {
	const hex = hex_;
	let hexString = hex.slice(2) as string;
	if (hexString.length % 2) hexString = `0${hexString}`;
	const length = hexString.length / 2;
	const bytes = new Uint8Array(length);
	for (let index = 0, j = 0; index < length; index++) {
		const nibbleLeft = charCodeToBase16(hexString.charCodeAt(j++));
		const nibbleRight = charCodeToBase16(hexString.charCodeAt(j++));
		if (nibbleLeft === undefined || nibbleRight === undefined) {
			throw new Error(
				`Invalid byte sequence ("${hexString[j - 2]}${
					hexString[j - 1]
				}" in "${hexString}").`,
			);
		}
		bytes[index] = nibbleLeft * 16 + nibbleRight;
	}
	return bytes;
}

export const shortenAddress = (address: string) => {
	return `${address.slice(0, 6)}...${address.slice(-4)}`;
}