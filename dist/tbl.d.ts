import { ReliableTxtEncoding } from "@stenway/reliabletxt";
import { SmlElement } from "@stenway/sml";
export declare class TblMetaSource {
}
export declare class TblMetaData {
    title: string | null;
    description: string | null;
    language: string | null;
    keywords: string[] | null;
    sources: TblMetaSource[];
    get hasAny(): boolean;
    toSmlElement(): SmlElement;
    parse(element: SmlElement): void;
    private static getSingleStringOrNull;
}
export declare class TblDocument {
    encoding: ReliableTxtEncoding;
    private columnNames;
    private rows;
    readonly meta: TblMetaData;
    constructor(columnNames: string[]);
    addRow(values: (string | null)[]): void;
    getColumnNames(): string[];
    getRows(): (string | null)[][];
    toElement(aligned?: boolean): SmlElement;
    toString(): string;
    toAlignedString(): string;
    toMinifiedString(): string;
    static parseElement(element: SmlElement): TblDocument;
    static parse(content: string): TblDocument;
}
export declare class TblsDocument {
    encoding: ReliableTxtEncoding;
    tables: TblDocument[];
    toElement(aligned?: boolean): SmlElement;
    toString(): string;
    toAlignedString(): string;
    toMinifiedString(): string;
    static parse(content: string): TblsDocument;
}
