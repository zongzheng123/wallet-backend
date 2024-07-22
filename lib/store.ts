// if the value is expired, clear it from the store
// if the size of store is greater than the limit, async validate the ttl of all the keys and remove the expired ones
export class TTLStore {
  private store: Map<string, [any, number]> = new Map();
  private ttl: number;

  constructor({ttl }:{ttl: number}) {
    this.ttl = ttl;
  }

  set(key: string, value: any) {
    this.store.set(key, [value, Date.now()]);
    setTimeout(() => {
        if (this.store.size > 200) {
            for (const [key, [_, timestamp]] of this.store) {
              if (timestamp + this.ttl < Date.now()) {
                this.store.delete(key);
              }
            }
          }
    })
  }

  get(key: string) {
    const res = this.store.get(key)
    if (!res) {
      return undefined;
    }
    const [value, timestamp] = res;
    if (timestamp + this.ttl < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return value;
  }
}
export const ttlStore = new TTLStore({
  ttl: 5 * 60 * 1000
})
