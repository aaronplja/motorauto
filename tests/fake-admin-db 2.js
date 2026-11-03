/** Base Firestore en mémoire, avec l'API « admin » minimale utilisée par functions/game.js (tests uniquement). */
"use strict";
class FakeDb {
  constructor(clock) { this.store = new Map(); this.clock = clock || (() => Date.now()); this.autoId = 0; }
  ts() { const ms = this.clock(); return { toMillis: () => ms, __ts: ms }; }
  _col(p) { if (!this.store.has(p)) this.store.set(p, new Map()); return this.store.get(p); }
  collection(path) { return new Col(this, path, []); }
  seed(path, id, data) { this._col(path).set(id, JSON.parse(JSON.stringify(data))); }
  raw(path, id) { return this._col(path).get(id); }
  batch() { const ops = []; return { delete: (ref) => ops.push(() => ref.delete()), commit: async () => { for (const o of ops) await o(); } }; }
  async runTransaction(fn) {
    const writes = [];
    const tx = {
      get: async (ref) => ref.get(),
      set: (ref, data) => writes.push(() => ref.set(data)),
      update: (ref, data) => writes.push(() => ref.update(data)),
      delete: (ref) => writes.push(() => ref.delete())
    };
    const out = await fn(tx);
    for (const w of writes) await w();
    return out;
  }
}
const clone = (o) => (o === undefined ? o : JSON.parse(JSON.stringify(o, (k, v) => (v && v.__ts !== undefined ? { __ts: v.__ts } : v)), (k, v) => (v && v.__ts !== undefined ? { toMillis: () => v.__ts, __ts: v.__ts } : v)));
class Doc {
  constructor(db, path, id) { this.db = db; this.path = path; this.id = id; }
  async get() { const d = this.db._col(this.path).get(this.id); return { id: this.id, exists: d !== undefined, data: () => clone(d), ref: this }; }
  async set(data) { this.db._col(this.path).set(this.id, clone(data)); }
  async update(patch) { const cur = this.db._col(this.path).get(this.id); if (!cur) throw new Error("NOT_FOUND " + this.path + "/" + this.id); this.db._col(this.path).set(this.id, Object.assign({}, cur, clone(patch))); }
  async delete() { this.db._col(this.path).delete(this.id); }
  collection(n) { return new Col(this.db, this.path + "/" + this.id + "/" + n, []); }
}
class Col {
  constructor(db, path, filters, lim) { this.db = db; this.path = path; this.filters = filters; this.lim = lim || 1e9; }
  doc(id) { return new Doc(this.db, this.path, id || "auto" + ++this.db.autoId); }
  async add(data) { const d = this.doc(); await d.set(data); return d; }
  where(f, op, v) { if (op !== "==") throw new Error("seul == est géré"); return new Col(this.db, this.path, this.filters.concat([[f, v]]), this.lim); }
  limit(n) { return new Col(this.db, this.path, this.filters, n); }
  async get() {
    let docs = Array.from(this.db._col(this.path).entries()).filter(([, d]) => this.filters.every(([f, v]) => d[f] === v)).slice(0, this.lim);
    const arr = docs.map(([id, d]) => ({ id, exists: true, data: () => clone(d), ref: new Doc(this.db, this.path, id) }));
    return { docs: arr, size: arr.length, empty: !arr.length, forEach: (f) => arr.forEach(f) };
  }
}
module.exports = { FakeDb };
