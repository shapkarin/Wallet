declare module 'argon2-browser' {
  interface HashOptions {
    pass: string;
    salt: Uint8Array;
    time: number;
    mem: number;
    hashLen: number;
    parallelism: number;
    type: number;
  }

  interface HashResult {
    hash: ArrayBuffer;
    hashHex: string;
    encoded: string;
  }

  function hash(options: HashOptions): Promise<HashResult>;

  export default { hash };
}
