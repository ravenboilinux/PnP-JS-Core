import { Dictionary }  from "../../src/collections/collections";

export default class MockStorage implements Storage {
    constructor() {
        this._store = new Dictionary<string>();
        this._length = 0;
    }

    private _store: Dictionary<any>;

    private _length: number;

    public get length(): number {
        return this._store.count();
    }

    public set length(i: number) {
        this._length = i;        
    }

    public clear(): void {
        this._store.clear();
    }

    public getItem(key: string): any {
        return this._store.get(key);
    }

    public key(index: number): string {
        return this._store.getKeys()[index];
    }

    public removeItem(key: string): void {
        this._store.remove(key);
    }

    public setItem(key: string, data: string): void {
        this._store.add(key, data);
    }

    [key: string]: any;
    [index: number]: string;
}
