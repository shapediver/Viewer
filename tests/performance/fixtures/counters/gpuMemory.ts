/**
 * GPU memory the viewer allocates (SS-10582). Runs in the page. Adds
 * `window.__probe.counters.gpuMemory`.
 * It must not reference anything outside its own body.
 *
 * Wraps the WebGL calls that create, size and delete buffers, textures,
 * renderbuffers and framebuffers, so it sees what three.js allocates on the
 * viewer's context. It wraps the context prototypes when it is installed,
 * before the viewport exists, so allocations made while the viewport is
 * created are counted too. Every context is counted on its own; `read()`
 * reports the viewer's (`__probe.gl`).
 *
 * The bytes are what the viewer asks for: width x height x depth x bytes per
 * texel, summed over mip levels, cube faces and samples, and the byte length
 * of each buffer. The driver uses more (alignment, padding, its own copies)
 * and the canvas' own drawing buffer is not a WebGL allocation, so it is not
 * in here. A format the tables below do not know is counted at 4 bytes per
 * texel and in `unknownFormats`, so it is visible.
 *
 * The figures are a state, not events: `reset()` changes nothing, and
 * `read()` gives what is alive at that moment:
 * - `buffers`, `bufferBytes`: vertex, index and uniform buffers
 * - `textures`, `textureBytes`: textures never attached to a framebuffer
 * - `renderTargetTextures`, `renderTargetTextureBytes`: textures attached to
 *   a framebuffer (render targets, shadow maps, PMREM)
 * - `renderbuffers`, `renderbufferBytes`: depth, stencil and multisample
 *   buffers of render targets
 * - `framebuffers`
 * - `unknownFormats`: live textures and renderbuffers of an unknown format
 * - `totalBytes`: the sum of the byte counts above
 */
export function installGpuMemory() {
	const probe = (window as any).__probe;
	const GL = WebGL2RenderingContext as any;

	type Level = {bytes: number; width: number; height: number; depth: number};
	type Texture = {
		levels: Map<string, Level>;
		bytesPerTexel: number;
		immutable: boolean;
		renderTarget: boolean;
		/** Its format is not in the tables below; counted at 4 bytes per texel. */
		unknown: boolean;
	};
	type Renderbuffer = {bytes: number; unknown: boolean};
	type State = {
		buffers: Map<WebGLBuffer, number>;
		textures: Map<WebGLTexture, Texture>;
		renderbuffers: Map<WebGLRenderbuffer, Renderbuffer>;
		framebuffers: Set<WebGLFramebuffer>;
	};
	const states = new WeakMap<object, State>();
	function stateOf(gl: object) {
		let state = states.get(gl);
		if (!state) {
			state = {
				buffers: new Map(),
				textures: new Map(),
				renderbuffers: new Map(),
				framebuffers: new Set(),
			};
			states.set(gl, state);
		}
		return state;
	}

	const SIZED_FORMATS: Record<number, number> = {
		[GL.R8]: 1,
		[GL.R8_SNORM]: 1,
		[GL.R8UI]: 1,
		[GL.R8I]: 1,
		[GL.RG8]: 2,
		[GL.RG8_SNORM]: 2,
		[GL.RG8UI]: 2,
		[GL.RG8I]: 2,
		[GL.R16F]: 2,
		[GL.R16UI]: 2,
		[GL.R16I]: 2,
		[GL.RGB565]: 2,
		[GL.RGBA4]: 2,
		[GL.RGB5_A1]: 2,
		[GL.RGB8]: 3,
		[GL.SRGB8]: 3,
		[GL.RGB8_SNORM]: 3,
		[GL.RGB8UI]: 3,
		[GL.RGB8I]: 3,
		[GL.RGBA8]: 4,
		[GL.SRGB8_ALPHA8]: 4,
		[GL.RGBA8_SNORM]: 4,
		[GL.RGBA8UI]: 4,
		[GL.RGBA8I]: 4,
		[GL.RGB10_A2]: 4,
		[GL.RGB10_A2UI]: 4,
		[GL.R11F_G11F_B10F]: 4,
		[GL.RGB9_E5]: 4,
		[GL.RG16F]: 4,
		[GL.RG16UI]: 4,
		[GL.RG16I]: 4,
		[GL.R32F]: 4,
		[GL.R32UI]: 4,
		[GL.R32I]: 4,
		[GL.RGB16F]: 6,
		[GL.RGB16UI]: 6,
		[GL.RGB16I]: 6,
		[GL.RGBA16F]: 8,
		[GL.RGBA16UI]: 8,
		[GL.RGBA16I]: 8,
		[GL.RG32F]: 8,
		[GL.RG32UI]: 8,
		[GL.RG32I]: 8,
		[GL.RGB32F]: 12,
		[GL.RGB32UI]: 12,
		[GL.RGB32I]: 12,
		[GL.RGBA32F]: 16,
		[GL.RGBA32UI]: 16,
		[GL.RGBA32I]: 16,
		[GL.DEPTH_COMPONENT16]: 2,
		[GL.DEPTH_COMPONENT24]: 4,
		[GL.DEPTH_COMPONENT32F]: 4,
		[GL.DEPTH24_STENCIL8]: 4,
		[GL.DEPTH32F_STENCIL8]: 8,
		[GL.STENCIL_INDEX8]: 1,
	};
	// Unsized formats (WebGL 1 style): channels x bytes of the type.
	const CHANNELS: Record<number, number> = {
		[GL.RGBA]: 4,
		[GL.RGB]: 3,
		[GL.LUMINANCE_ALPHA]: 2,
		[GL.LUMINANCE]: 1,
		[GL.ALPHA]: 1,
		[GL.DEPTH_COMPONENT]: 1,
		[GL.DEPTH_STENCIL]: 1,
	};
	const TYPE_BYTES: Record<number, number> = {
		[GL.UNSIGNED_BYTE]: 1,
		[GL.BYTE]: 1,
		[GL.UNSIGNED_SHORT]: 2,
		[GL.SHORT]: 2,
		[GL.HALF_FLOAT]: 2,
		[0x8d61]: 2, // HALF_FLOAT_OES
		[GL.UNSIGNED_INT]: 4,
		[GL.INT]: 4,
		[GL.FLOAT]: 4,
	};
	// Packed types: the bytes of the whole texel.
	const PACKED_TYPES: Record<number, number> = {
		[GL.UNSIGNED_SHORT_5_6_5]: 2,
		[GL.UNSIGNED_SHORT_4_4_4_4]: 2,
		[GL.UNSIGNED_SHORT_5_5_5_1]: 2,
		[GL.UNSIGNED_INT_24_8]: 4,
		[GL.UNSIGNED_INT_2_10_10_10_REV]: 4,
		[GL.UNSIGNED_INT_10F_11F_11F_REV]: 4,
		[GL.UNSIGNED_INT_5_9_9_9_REV]: 4,
		[GL.FLOAT_32_UNSIGNED_INT_24_8_REV]: 8,
	};

	// Compressed formats with 4 x 4 blocks: the bytes of one block.
	const BLOCK_BYTES: Record<number, number> = {
		[0x83f0]: 8, // RGB_S3TC_DXT1
		[0x83f1]: 8, // RGBA_S3TC_DXT1
		[0x83f2]: 16, // RGBA_S3TC_DXT3
		[0x83f3]: 16, // RGBA_S3TC_DXT5
		[0x8c4c]: 8, // SRGB_S3TC_DXT1
		[0x8c4d]: 8, // SRGB_ALPHA_S3TC_DXT1
		[0x8c4e]: 16, // SRGB_ALPHA_S3TC_DXT3
		[0x8c4f]: 16, // SRGB_ALPHA_S3TC_DXT5
		[0x8dbb]: 8, // RED_RGTC1
		[0x8dbc]: 8, // SIGNED_RED_RGTC1
		[0x8dbd]: 16, // RED_GREEN_RGTC2
		[0x8dbe]: 16, // SIGNED_RED_GREEN_RGTC2
		[0x8e8c]: 16, // RGBA_BPTC_UNORM
		[0x8e8d]: 16, // SRGB_ALPHA_BPTC_UNORM
		[0x8e8e]: 16, // RGB_BPTC_SIGNED_FLOAT
		[0x8e8f]: 16, // RGB_BPTC_UNSIGNED_FLOAT
		[0x9270]: 8, // R11_EAC
		[0x9271]: 8, // SIGNED_R11_EAC
		[0x9272]: 16, // RG11_EAC
		[0x9273]: 16, // SIGNED_RG11_EAC
		[0x9274]: 8, // RGB8_ETC2
		[0x9275]: 8, // SRGB8_ETC2
		[0x9276]: 8, // RGB8_PUNCHTHROUGH_ALPHA1_ETC2
		[0x9277]: 8, // SRGB8_PUNCHTHROUGH_ALPHA1_ETC2
		[0x9278]: 16, // RGBA8_ETC2_EAC
		[0x9279]: 16, // SRGB8_ALPHA8_ETC2_EAC
		[0x93b0]: 16, // RGBA_ASTC_4x4
		[0x93d0]: 16, // SRGB8_ALPHA8_ASTC_4x4
	};

	/** Bytes of one texel, or undefined for a format the tables miss. */
	function bytesPerTexel(internalFormat: number, type?: number) {
		const sized = SIZED_FORMATS[internalFormat];
		if (sized) return sized;
		if (type !== undefined && PACKED_TYPES[type]) return PACKED_TYPES[type];
		const channels = CHANNELS[internalFormat];
		const typeBytes = type === undefined ? undefined : TYPE_BYTES[type];
		if (channels && typeBytes) return channels * typeBytes;
		return undefined;
	}

	/** Bytes of a w x h x d image of `internalFormat` (sized or compressed). */
	function imageBytes(
		internalFormat: number,
		width: number,
		height: number,
		depth: number,
	) {
		const block = BLOCK_BYTES[internalFormat];
		if (block)
			return {
				bytes:
					Math.ceil(width / 4) *
					Math.ceil(height / 4) *
					depth *
					block,
				unknown: false,
			};
		const texel = bytesPerTexel(internalFormat);
		return {
			bytes: width * height * depth * (texel ?? 4),
			unknown: texel === undefined,
		};
	}

	const BUFFER_BINDINGS: Record<number, number> = {
		[GL.ARRAY_BUFFER]: GL.ARRAY_BUFFER_BINDING,
		[GL.ELEMENT_ARRAY_BUFFER]: GL.ELEMENT_ARRAY_BUFFER_BINDING,
		[GL.UNIFORM_BUFFER]: GL.UNIFORM_BUFFER_BINDING,
		[GL.COPY_READ_BUFFER]: GL.COPY_READ_BUFFER_BINDING,
		[GL.COPY_WRITE_BUFFER]: GL.COPY_WRITE_BUFFER_BINDING,
		[GL.PIXEL_PACK_BUFFER]: GL.PIXEL_PACK_BUFFER_BINDING,
		[GL.PIXEL_UNPACK_BUFFER]: GL.PIXEL_UNPACK_BUFFER_BINDING,
		[GL.TRANSFORM_FEEDBACK_BUFFER]: GL.TRANSFORM_FEEDBACK_BUFFER_BINDING,
	};

	/** The binding a texture target (or a cube face) reads from. */
	function textureBinding(target: number) {
		if (
			target >= GL.TEXTURE_CUBE_MAP_POSITIVE_X &&
			target <= GL.TEXTURE_CUBE_MAP_NEGATIVE_Z
		)
			return GL.TEXTURE_BINDING_CUBE_MAP;
		if (target === GL.TEXTURE_CUBE_MAP) return GL.TEXTURE_BINDING_CUBE_MAP;
		if (target === GL.TEXTURE_3D) return GL.TEXTURE_BINDING_3D;
		if (target === GL.TEXTURE_2D_ARRAY) return GL.TEXTURE_BINDING_2D_ARRAY;
		return GL.TEXTURE_BINDING_2D;
	}

	function boundTexture(gl: any, target: number): Texture | undefined {
		const handle = gl.getParameter(textureBinding(target));
		return handle ? stateOf(gl).textures.get(handle) : undefined;
	}

	/** Width and height of an image source (texImage2D without sizes). */
	function sourceSize(source: any) {
		if (!source) return {width: 0, height: 0};
		const width =
			source.videoWidth ??
			source.naturalWidth ??
			source.displayWidth ??
			source.width ??
			0;
		const height =
			source.videoHeight ??
			source.naturalHeight ??
			source.displayHeight ??
			source.height ??
			0;
		return {width, height};
	}

	function setLevel(
		texture: Texture,
		target: number,
		level: number,
		width: number,
		height: number,
		depth: number,
		bytes: number,
	) {
		texture.levels.set(`${target}:${level}`, {
			bytes,
			width,
			height,
			depth,
		});
	}

	function wrap(
		proto: any,
		name: string,
		after: (gl: any, args: any[]) => void,
	) {
		const original = proto[name];
		if (typeof original !== "function") return;
		proto[name] = function (this: any, ...args: any[]) {
			const result = original.apply(this, args);
			after(this, args);
			return result;
		};
	}

	function wrapCreate(
		proto: any,
		name: string,
		add: (state: State, handle: any) => void,
	) {
		const original = proto[name];
		if (typeof original !== "function") return;
		proto[name] = function (this: any, ...args: any[]) {
			const handle = original.apply(this, args);
			if (handle) add(stateOf(this), handle);
			return handle;
		};
	}

	function install(proto: any) {
		wrapCreate(proto, "createBuffer", (state, handle) =>
			state.buffers.set(handle, 0),
		);
		wrap(proto, "deleteBuffer", (gl, [handle]) =>
			stateOf(gl).buffers.delete(handle),
		);
		wrap(proto, "bufferData", (gl, [target, data, , srcOffset, length]) => {
			const binding = BUFFER_BINDINGS[target];
			const handle = binding ? gl.getParameter(binding) : null;
			if (!handle) return;
			let bytes = 0;
			if (typeof data === "number") bytes = data;
			else if (data && ArrayBuffer.isView(data)) {
				const element = (data as any).BYTES_PER_ELEMENT ?? 1;
				bytes = length
					? length * element
					: data.byteLength - (srcOffset ?? 0) * element;
			} else if (data) bytes = (data as ArrayBuffer).byteLength;
			stateOf(gl).buffers.set(handle, bytes);
		});

		wrapCreate(proto, "createTexture", (state, handle) =>
			state.textures.set(handle, {
				levels: new Map(),
				bytesPerTexel: 0,
				immutable: false,
				renderTarget: false,
				unknown: false,
			}),
		);
		wrap(proto, "deleteTexture", (gl, [handle]) =>
			stateOf(gl).textures.delete(handle),
		);
		wrap(proto, "texImage2D", (gl, args) => {
			const [target, level, internalFormat] = args;
			const texture = boundTexture(gl, target);
			if (!texture || texture.immutable) return;
			// (target, level, internalformat, format, type, source) or
			// (target, level, internalformat, width, height, border, format, type, ...)
			const withSize = args.length >= 8;
			const {width, height} = withSize
				? {width: args[3], height: args[4]}
				: sourceSize(args[5]);
			const type = withSize ? args[7] : args[4];
			const known = bytesPerTexel(internalFormat, type);
			const texel = known ?? 4;
			texture.bytesPerTexel = texel;
			texture.unknown = known === undefined;
			setLevel(
				texture,
				target,
				level,
				width,
				height,
				1,
				width * height * texel,
			);
		});
		wrap(proto, "texImage3D", (gl, args) => {
			const [target, level, internalFormat, width, height, depth] = args;
			const texture = boundTexture(gl, target);
			if (!texture || texture.immutable) return;
			const known = bytesPerTexel(internalFormat, args[8]);
			const texel = known ?? 4;
			texture.bytesPerTexel = texel;
			texture.unknown = known === undefined;
			setLevel(
				texture,
				target,
				level,
				width,
				height,
				depth,
				width * height * depth * texel,
			);
		});
		const storage = (
			gl: any,
			target: number,
			levels: number,
			internalFormat: number,
			width: number,
			height: number,
			depth: number,
		) => {
			const texture = boundTexture(gl, target);
			if (!texture) return;
			texture.levels.clear();
			texture.immutable = true;
			texture.unknown = false;
			const faces = target === GL.TEXTURE_CUBE_MAP ? 6 : 1;
			const layered = target === GL.TEXTURE_3D;
			for (let level = 0; level < levels; level++) {
				const w = Math.max(1, width >> level);
				const h = Math.max(1, height >> level);
				// An array keeps its layers; a 3D texture halves its depth.
				const d = layered ? Math.max(1, depth >> level) : depth;
				const image = imageBytes(internalFormat, w, h, d);
				if (image.unknown) texture.unknown = true;
				setLevel(texture, target, level, w, h, d, image.bytes * faces);
			}
		};
		wrap(proto, "texStorage2D", (gl, [target, levels, format, w, h]) =>
			storage(gl, target, levels, format, w, h, 1),
		);
		wrap(proto, "texStorage3D", (gl, [target, levels, format, w, h, d]) =>
			storage(gl, target, levels, format, w, h, d),
		);
		/**
		 * `dataIndex`: the argument after the border, the data or (from a
		 * pixel buffer) imageSize. Then srcOffset and srcLengthOverride.
		 */
		const compressed = (
			gl: any,
			args: any[],
			depth: number,
			dataIndex: number,
		) => {
			const [target, level, internalFormat, width, height] = args;
			const texture = boundTexture(gl, target);
			if (!texture || texture.immutable) return;
			const data = args[dataIndex];
			let bytes = 0;
			if (typeof data === "number") bytes = data;
			else if (data && ArrayBuffer.isView(data)) {
				const element = (data as any).BYTES_PER_ELEMENT ?? 1;
				const offset = args[dataIndex + 1] ?? 0;
				const length = args[dataIndex + 2];
				bytes = length
					? length * element
					: data.byteLength - offset * element;
			}
			texture.unknown = !BLOCK_BYTES[internalFormat];
			setLevel(texture, target, level, width, height, depth, bytes);
		};
		wrap(proto, "compressedTexImage2D", (gl, args) =>
			compressed(gl, args, 1, 6),
		);
		wrap(proto, "compressedTexImage3D", (gl, args) =>
			compressed(gl, args, args[5], 7),
		);
		wrap(proto, "generateMipmap", (gl, [target]) => {
			const texture = boundTexture(gl, target);
			if (!texture || texture.immutable) return;
			// The levels below each face's level 0 that the call creates.
			for (const [key, base] of [...texture.levels]) {
				const [face, level] = key.split(":").map(Number);
				if (level !== 0) continue;
				const layered = target === GL.TEXTURE_3D;
				let w = base.width;
				let h = base.height;
				let d = base.depth;
				for (
					let next = 1;
					w > 1 || h > 1 || (layered && d > 1);
					next++
				) {
					w = Math.max(1, w >> 1);
					h = Math.max(1, h >> 1);
					if (layered) d = Math.max(1, d >> 1);
					setLevel(
						texture,
						face,
						next,
						w,
						h,
						d,
						w * h * d * texture.bytesPerTexel,
					);
				}
			}
		});
		const attach = (gl: any, handle: any) => {
			const texture = handle && stateOf(gl).textures.get(handle);
			if (texture) texture.renderTarget = true;
		};
		wrap(proto, "framebufferTexture2D", (gl, [, , , handle]) =>
			attach(gl, handle),
		);
		wrap(proto, "framebufferTextureLayer", (gl, [, , handle]) =>
			attach(gl, handle),
		);

		wrapCreate(proto, "createRenderbuffer", (state, handle) =>
			state.renderbuffers.set(handle, {bytes: 0, unknown: false}),
		);
		wrap(proto, "deleteRenderbuffer", (gl, [handle]) =>
			stateOf(gl).renderbuffers.delete(handle),
		);
		const renderbuffer = (
			gl: any,
			samples: number,
			internalFormat: number,
			width: number,
			height: number,
		) => {
			const handle = gl.getParameter(GL.RENDERBUFFER_BINDING);
			if (!handle) return;
			// WebGL 1's unsized DEPTH_STENCIL is a 24-bit depth plus stencil.
			const known =
				internalFormat === GL.DEPTH_STENCIL
					? 4
					: bytesPerTexel(internalFormat);
			stateOf(gl).renderbuffers.set(handle, {
				bytes: width * height * Math.max(1, samples) * (known ?? 4),
				unknown: known === undefined,
			});
		};
		wrap(proto, "renderbufferStorage", (gl, [, format, w, h]) =>
			renderbuffer(gl, 1, format, w, h),
		);
		wrap(
			proto,
			"renderbufferStorageMultisample",
			(gl, [, samples, format, w, h]) =>
				renderbuffer(gl, samples, format, w, h),
		);

		wrapCreate(proto, "createFramebuffer", (state, handle) =>
			state.framebuffers.add(handle),
		);
		wrap(proto, "deleteFramebuffer", (gl, [handle]) =>
			stateOf(gl).framebuffers.delete(handle),
		);
	}

	install(WebGL2RenderingContext.prototype);
	install(WebGLRenderingContext.prototype);

	function read() {
		const result = {
			buffers: 0,
			bufferBytes: 0,
			textures: 0,
			textureBytes: 0,
			renderTargetTextures: 0,
			renderTargetTextureBytes: 0,
			renderbuffers: 0,
			renderbufferBytes: 0,
			framebuffers: 0,
			unknownFormats: 0,
			totalBytes: 0,
		};
		const state = probe.gl && states.get(probe.gl);
		if (!state) return result;
		for (const bytes of state.buffers.values()) {
			result.buffers++;
			result.bufferBytes += bytes;
		}
		for (const texture of state.textures.values()) {
			let bytes = 0;
			for (const level of texture.levels.values()) bytes += level.bytes;
			if (texture.unknown) result.unknownFormats++;
			if (texture.renderTarget) {
				result.renderTargetTextures++;
				result.renderTargetTextureBytes += bytes;
			} else {
				result.textures++;
				result.textureBytes += bytes;
			}
		}
		for (const renderbuffer of state.renderbuffers.values()) {
			result.renderbuffers++;
			result.renderbufferBytes += renderbuffer.bytes;
			if (renderbuffer.unknown) result.unknownFormats++;
		}
		result.framebuffers = state.framebuffers.size;
		result.totalBytes =
			result.bufferBytes +
			result.textureBytes +
			result.renderTargetTextureBytes +
			result.renderbufferBytes;
		return result;
	}

	probe.counters.gpuMemory = {
		// Wrapped at install time, see above.
		attach() {},
		reset() {},
		read,
	};
}
