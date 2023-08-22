import { ReliableTxtEncoding } from "@stenway/reliabletxt";
import { SmlElement } from "@stenway/sml";
export declare class TblCustomMetaData {
    readonly mediaType: string | null;
    readonly textContent: string;
    constructor(mediaType: string | null, textContent: string);
}
export declare class TblCustomProperties {
    private _element;
    get keys(): string[];
    get entries(): [string, string][];
    get hasAny(): boolean;
    set(key: string, value: string): void;
    setRange(entries: [string, string][]): void;
    unset(key: string): void;
    clear(): void;
    get(key: string): string;
    getOrNull(key: string): string | null;
    getOrDefault(key: string, defaultValue: string): string;
    serialize(element: SmlElement): void;
    parse(parentElement: SmlElement): void;
}
export declare class TblColumnMetaData {
    readonly index: number;
    title: string | null;
    description: string | null;
    customData: TblCustomMetaData | SmlElement | null;
    constructor(index: number);
    toElement(): SmlElement;
    parse(element: SmlElement): void;
}
export declare class TblMetaData {
    title: string | null;
    description: string | null;
    language: string | null;
    private _keywords;
    private _columns;
    customData: TblCustomMetaData | SmlElement | null;
    customProperties: TblCustomProperties;
    private document;
    get keywords(): string[] | null;
    set keywords(values: string[] | null);
    get columns(): TblColumnMetaData[];
    constructor(document: TblDocument);
    get hasAny(): boolean;
    addColumnMetaData(): TblColumnMetaData;
    toElement(): SmlElement;
    parse(element: SmlElement): void;
}
export declare class TblDocument {
    encoding: ReliableTxtEncoding;
    private _columnNames;
    private rows;
    readonly meta: TblMetaData;
    constructor(columnNames: string[], encoding?: ReliableTxtEncoding);
    addRow(values: (string | null)[]): void;
    get columnNames(): string[];
    get columnCount(): number;
    getRowCount(): number;
    getRow(index: number): (string | null)[];
    getRows(): (string | null)[][];
    toElement(aligned?: boolean, whitespaceBetween?: string | null, rightAligned?: boolean[] | null): SmlElement;
    toString(aligned?: boolean, whitespaceBetween?: string | null, rightAligned?: boolean[] | null): string;
    toMinifiedString(): string;
    toBytes(): Uint8Array;
    toBase64String(): string;
    toBinaryTbl(): Uint8Array;
    static parseElement(element: SmlElement, encoding?: ReliableTxtEncoding): TblDocument;
    static parse(content: string, encoding?: ReliableTxtEncoding): TblDocument;
    static fromBytes(bytes: Uint8Array): TblDocument;
    static fromBase64String(base64Str: string): TblDocument;
    static fromBinaryTbl(bytes: Uint8Array): TblDocument;
}
export declare class TblsMetaData {
    title: string | null;
    description: string | null;
    customData: TblCustomMetaData | SmlElement | null;
    get hasAny(): boolean;
    toElement(): SmlElement;
    parse(element: SmlElement): void;
}
export declare class TblsDocument {
    encoding: ReliableTxtEncoding;
    tables: TblDocument[];
    readonly meta: TblsMetaData;
    constructor(tables?: TblDocument[] | null, encoding?: ReliableTxtEncoding);
    toElement(aligned?: boolean, whitespaceBetween?: string | null): SmlElement;
    toString(aligned?: boolean, whitespaceBetween?: string | null): string;
    toMinifiedString(): string;
    toBytes(): Uint8Array;
    toBase64String(): string;
    toBinaryTbls(): Uint8Array;
    static parseElement(rootElement: SmlElement, encoding?: ReliableTxtEncoding): TblsDocument;
    static parse(content: string, encoding?: ReliableTxtEncoding): TblsDocument;
    static fromBytes(bytes: Uint8Array): TblsDocument;
    static fromBase64String(base64Str: string): TblsDocument;
    static fromBinaryTbls(bytes: Uint8Array): TblsDocument;
}
//# sourceMappingURL=tbl.d.ts.map