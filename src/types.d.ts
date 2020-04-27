interface CacheOptions {
  /**
   * Consider the request method a GET regardless of its actual value.
   */
  ignoreMethod?: boolean;
}

export interface Caches {
  default: {
    /**
     * Adds to the cache a response keyed to the given request.
     * Returns a promise that resolves to undefined once the cache stores the response.
     */
    put(request: Request | string, response: Response): Promise<undefined>;
    /**
     * Returns a promise wrapping the response object keyed to that request.
     */
    match(
      request: Request | string,
      options?: CacheOptions
    ): Promise<Response | undefined>;
    /**
     * Deletes the Response object from the cache and
     * returns a Promise for a Boolean response
     */
    delete(request: Request | string, options?: CacheOptions): Promise<boolean>;
  };
}

declare let caches: Caches;

declare global {
  const NOTION_TOKEN: string | undefined;
}
