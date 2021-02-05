import { singleton } from 'tsyringe';

@singleton()
export class ImageLoader {
  private readonly _imageCache: { [key: string]: HTMLImageElement } = {};

  public async load(url: string): Promise<HTMLImageElement> {
    if (this._imageCache[url]) return this._imageCache[url];
    this._imageCache[url] = <HTMLImageElement>document.createElementNS('http://www.w3.org/1999/xhtml', 'img');
    const imagePromise: Promise<HTMLImageElement> = new Promise((resolve) => {
      this._imageCache[url].onload = (e) => {
        resolve(this._imageCache[url]);
      }
    })
    if ( url.substr( 0, 5 ) !== 'data:' ) {
			this._imageCache[url].crossOrigin = 'anonymous';
		}
    this._imageCache[url].src = url;
    await imagePromise;
    return this._imageCache[url];
  }

  // #endregion Public Methods (1)
}

export default {
  ImageLoader
}