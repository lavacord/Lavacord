const structures = {
	Player: require('./Player').Player,
	Node: require('./Node').Node,
};

class Structure {
	/**
	 * Extends a class.
	 * @param name
	 * @param extender
	 */
	static extend(name: string, extender: any) {
		if (!(structures as any)[name])
			throw new TypeError(`${name} is not a valid structure!`);
		const extended = extender((structures as any)[name]);
		(structures as any)[name] = extended;
		return extended;
	}
	/**
	 * Get a structure from available structures by name.
	 * @param name
	 */
	static get(name: string) {
		const structure = (structures as any)[name];
		if (!structure) throw new TypeError('A structure must be provided!');
		return structure;
	}
}
