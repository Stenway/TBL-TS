"use strict";
/* (C) Stefan John / Stenway / SimpleML.com / 2022 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TblsDocument = exports.TblDocument = exports.TblMetaData = exports.TblMetaSource = void 0;
const reliabletxt_1 = require("@stenway/reliabletxt");
const sml_1 = require("@stenway/sml");
// ----------------------------------------------------------------------
class TblMetaSource {
}
exports.TblMetaSource = TblMetaSource;
// ----------------------------------------------------------------------
class TblMetaData {
    constructor() {
        this.title = null;
        this.description = null;
        this.language = null;
        this.keywords = null;
        this.sources = [];
    }
    get hasAny() {
        return this.title !== null ||
            this.description !== null ||
            this.language !== null ||
            this.keywords !== null ||
            this.sources.length > 0;
    }
    toSmlElement() {
        let element = new sml_1.SmlElement("Meta");
        if (this.title !== null) {
            element.addAttribute("Title", [this.title]);
        }
        if (this.description !== null) {
            element.addAttribute("Description", [this.description]);
        }
        return element;
    }
    parse(element) {
        this.title = TblMetaData.getSingleStringOrNull(element, "Title");
        this.description = TblMetaData.getSingleStringOrNull(element, "Description");
    }
    static getSingleStringOrNull(element, name) {
        if (element.hasAttribute(name)) {
            if (element.attributes(name).length > 1) {
                throw new Error(`Only one "${name}" attribute allowed`);
            }
            let attribute = element.attribute(name);
            if (attribute.values.length > 1) {
                throw new Error(`Only one value in meta attribute "${name}" allowed`);
            }
            return attribute.values[0];
        }
        else {
            return null;
        }
    }
}
exports.TblMetaData = TblMetaData;
// ----------------------------------------------------------------------
class TblDocument {
    constructor(columnNames) {
        this.encoding = reliabletxt_1.ReliableTxtEncoding.Utf8;
        this.rows = [];
        this.meta = new TblMetaData;
        if (columnNames.length < 2) {
            throw new Error("Table must have at least two columns");
        }
        this.columnNames = columnNames;
    }
    addRow(values) {
        if (values.length < 2) {
            throw new Error("Row must have at least two values");
        }
        if (values[0] === null) {
            throw new Error("First row value cannot be null");
        }
        if (values.length > this.columnNames.length) {
            throw new Error("Row has more values than there are columns");
        }
        this.rows.push(values);
    }
    getColumnNames() {
        return [...this.columnNames];
    }
    getRows() {
        return this.rows.map(x => [...x]);
    }
    toElement(aligned = false) {
        let element = new sml_1.SmlElement("Table");
        if (this.meta.hasAny) {
            let metaElement = this.meta.toSmlElement();
            metaElement.alignAttributes("  ");
            element.addNode(metaElement);
        }
        element.addAttribute(this.columnNames[0], this.columnNames.slice(1));
        for (let row of this.rows) {
            element.addAttribute(row[0], row.slice(1));
        }
        if (aligned) {
            element.alignAttributes("  ");
        }
        return element;
    }
    toString() {
        let rootElement = this.toElement();
        let smlDocument = new sml_1.SmlDocument(rootElement);
        return smlDocument.toString();
    }
    toAlignedString() {
        let rootElement = this.toElement(true);
        let smlDocument = new sml_1.SmlDocument(rootElement);
        return smlDocument.toString();
    }
    toMinifiedString() {
        let rootElement = this.toElement();
        let smlDocument = new sml_1.SmlDocument(rootElement);
        return smlDocument.toMinifiedString();
    }
    static parseElement(element) {
        if (!element.hasName("Table")) {
            throw new Error("Not a valid table document");
        }
        let attributes = element.attributes();
        if (attributes.length === 0) {
            throw new Error("No column names");
        }
        let columnNamesAttribute = attributes[0];
        for (let value of columnNamesAttribute.values) {
            if (value === null) {
                throw new Error("Column name cannot be null");
            }
        }
        let columnNames = [columnNamesAttribute.name, ...columnNamesAttribute.values];
        let document = new TblDocument(columnNames);
        if (element.hasElement("Meta")) {
            if (element.elements().length > 1) {
                throw new Error("Only one meta element is allowed");
            }
            if (!element.namedNodes()[0].isElement()) {
                throw new Error("Meta element must be first node");
            }
            document.meta.parse(element.element("Meta"));
        }
        else {
            if (element.hasElements()) {
                throw new Error("Only meta element is allowed");
            }
        }
        for (let i = 1; i < attributes.length; i++) {
            let rowAttribute = attributes[i];
            let rowValues = [rowAttribute.name, ...rowAttribute.values];
            document.addRow(rowValues);
        }
        return document;
    }
    static parse(content) {
        let smlDocument = sml_1.SmlDocument.parse(content, false);
        return TblDocument.parseElement(smlDocument.root);
    }
}
exports.TblDocument = TblDocument;
// ----------------------------------------------------------------------
class TblsDocument {
    constructor() {
        this.encoding = reliabletxt_1.ReliableTxtEncoding.Utf8;
        this.tables = [];
    }
    toElement(aligned = false) {
        let element = new sml_1.SmlElement("Tables");
        for (let table of this.tables) {
            element.addNode(table.toElement(aligned));
        }
        return element;
    }
    toString() {
        let rootElement = this.toElement();
        let smlDocument = new sml_1.SmlDocument(rootElement);
        return smlDocument.toString();
    }
    toAlignedString() {
        let rootElement = this.toElement(true);
        let smlDocument = new sml_1.SmlDocument(rootElement);
        return smlDocument.toString();
    }
    toMinifiedString() {
        let rootElement = this.toElement();
        let smlDocument = new sml_1.SmlDocument(rootElement);
        return smlDocument.toMinifiedString();
    }
    static parse(content) {
        let document = new TblsDocument();
        let smlDocument = sml_1.SmlDocument.parse(content, false);
        let rootElement = smlDocument.root;
        if (!rootElement.hasName("Tables")) {
            throw new Error("Not a valid tables document");
        }
        for (let tableElement of rootElement.elements("Table")) {
            let tableDocument = TblDocument.parseElement(tableElement);
            document.tables.push(tableDocument);
        }
        return document;
    }
}
exports.TblsDocument = TblsDocument;
