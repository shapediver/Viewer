export type ObservableArrayView<T> = T[] & {
	push(...items: T[]): number;
	pop(): T | undefined;
};

interface ObservableArrayOptions<T> {
	initialData?: Iterable<T>;
	onChanged?: (data: readonly T[]) => void;
}

export class ObservableArray<T> {
	private target: T[];
	private readonly proxy: ObservableArrayView<T>;
	private onChanged?: (data: readonly T[]) => void;

	constructor(options: ObservableArrayOptions<T> = {}) {
		const {initialData = [], onChanged} = options;

		this.target = Array.from(initialData);
		this.onChanged = onChanged;
		this.proxy = this.createProxy(this.target);
	}

	private notifyChanged() {
		if (this.onChanged) {
			this.onChanged(this.target);
		}
	}

	private createProxy(target: T[]): ObservableArrayView<T> {
		const self = this;

		return new Proxy(target, {
			get(target, prop, receiver) {
				if (prop === "push") {
					return (...items: T[]) => {
						const result = Array.prototype.push.apply(
							target,
							items,
						);
						self.notifyChanged();
						return result;
					};
				}

				if (prop === "pop") {
					return () => {
						const result = Array.prototype.pop.call(target);
						self.notifyChanged();
						return result;
					};
				}

				if (
					["splice", "shift", "unshift", "sort", "reverse"].includes(
						String(prop),
					)
				) {
					return () => {
						throw new Error(`${String(prop)} not allowed`);
					};
				}

				return Reflect.get(target, prop, receiver);
			},

			// block direct index assignment, e.g. arr[0] = ...
			set() {
				throw new Error("Direct assignment is not allowed.");
			},
		}) as unknown as ObservableArrayView<T>;
	}

	/** Get the array-like view to expose publicly */
	public get value(): ObservableArrayView<T> {
		return this.proxy;
	}

	/**
	 * Replace the entire contents in one go.
	 */
	public setData(newData: Iterable<T>): void {
		this.target.length = 0;
		this.target.push(...newData);
		this.notifyChanged();
	}

	/** Change the callback if needed */
	public setOnChanged(callback?: (data: readonly T[]) => void): void {
		this.onChanged = callback;
	}
}
