/* eslint-disable @typescript-eslint/no-explicit-any */
export interface HttpResponse<T = any> {
	data: T;
	headers: any;
	size?: number;
}
