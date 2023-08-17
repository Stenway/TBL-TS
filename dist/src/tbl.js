/* (C) Stefan John / Stenway / SimpleML.com / 2023 */
import { Base64String, ReliableTxtDecoder, ReliableTxtEncoder, ReliableTxtEncoding } from "@stenway/reliabletxt";
import { SmlDocument, SmlElement } from "@stenway/sml";
// ----------------------------------------------------------------------
export class TblCustomMetaData {
    constructor(mediaType, textContent) {
        this.mediaType = mediaType;
        this.textContent = textContent;
    }
}
// ----------------------------------------------------------------------
class TblMetaDataUtil {
    static getCustomData(element) {
        if (element.hasAttribute("CustomData")) {
            if (element.hasElement("CustomData")) {
                throw new Error(`CustomData element not allowed because attribute already defined`);
            }
            const customDataAttribute = element.requiredAttribute("CustomData");
            customDataAttribute.assureValueCountMinMax(1, 2);
            if (customDataAttribute.valueCount === 1) {
                return new TblCustomMetaData(null, customDataAttribute.asString());
            }
            else {
                const values = customDataAttribute.asStringArray();
                return new TblCustomMetaData(values[0], values[1]);
            }
        }
        else if (element.hasElement("CustomData")) {
            return element.requiredElement("CustomData");
        }
        return null;
    }
    static serializeCustomData(customData, element) {
        if (customData !== null) {
            if (customData instanceof SmlElement) {
                element.addNode(customData);
            }
            else {
                if (customData.mediaType !== null) {
                    element.addAttribute("CustomData", [customData.mediaType, customData.textContent]);
                }
                else {
                    element.addAttribute("CustomData", [customData.textContent]);
                }
            }
        }
    }
}
// ----------------------------------------------------------------------
export class TblCustomProperties {
    constructor() {
        this._element = new SmlElement("CustomProperties");
    }
    get keys() {
        return this._element.attributes().map(x => x.name);
    }
    get entries() {
        return this._element.attributes().map(x => [x.name, x.asString()]);
    }
    get hasAny() {
        return this._element.hasAttributes();
    }
    set(key, value) {
        if (this._element.hasAttribute(key)) {
            this._element.attribute(key).setString(value);
        }
        else {
            this._element.addAttribute(key, [value]);
        }
    }
    setRange(entries) {
        for (const entry of entries) {
            this.set(entry[0], entry[1]);
        }
    }
    unset(key) {
        const attributeOrNull = this._element.optionalAttribute(key);
        if (attributeOrNull !== null) {
            this._element.nodes = this._element.nodes.filter(x => x !== attributeOrNull);
        }
    }
    clear() {
        this._element.nodes = [];
    }
    get(key) {
        if (!this._element.hasAttribute(key)) {
            throw new Error(`Custom property with key "${key}" does not exist`);
        }
        return this._element.attribute(key).asString();
    }
    getOrNull(key) {
        if (this._element.hasAttribute(key)) {
            return this._element.attribute(key).asString();
        }
        return null;
    }
    getOrDefault(key, defaultValue) {
        var _a;
        return (_a = this.getOrNull(key)) !== null && _a !== void 0 ? _a : defaultValue;
    }
    serialize(element) {
        if (!this.hasAny) {
            return;
        }
        element.addNode(this._element);
    }
    parse(parentElement) {
        if (!parentElement.hasElement("CustomProperties")) {
            return;
        }
        const element = parentElement.requiredElement("CustomProperties");
        element.assureNoElements();
        for (const attribute of element.attributes()) {
            this.set(attribute.name, attribute.asString());
        }
    }
}
// ----------------------------------------------------------------------
export class TblColumnMetaData {
    constructor(index) {
        this.title = null;
        this.description = null;
        this.customData = null;
        this.index = index;
    }
    toElement() {
        const element = new SmlElement("Column");
        if (this.title !== null) {
            element.addAttribute("Title", [this.title]);
        }
        if (this.description !== null) {
            element.addAttribute("Description", [this.description]);
        }
        TblMetaDataUtil.serializeCustomData(this.customData, element);
        return element;
    }
    parse(element) {
        var _a, _b, _c, _d;
        this.title = (_b = (_a = element.optionalAttribute("Title")) === null || _a === void 0 ? void 0 : _a.asString()) !== null && _b !== void 0 ? _b : null;
        this.description = (_d = (_c = element.optionalAttribute("Description")) === null || _c === void 0 ? void 0 : _c.asString()) !== null && _d !== void 0 ? _d : null;
        this.customData = TblMetaDataUtil.getCustomData(element);
    }
}
// ----------------------------------------------------------------------
export class TblMetaData {
    get keywords() {
        if (this._keywords === null) {
            return null;
        }
        return [...this._keywords];
    }
    set keywords(values) {
        if (values !== null) {
            if (values.length === 0) {
                throw new RangeError(`Keywords array cannot be empty`);
            }
            this._keywords = [...values];
        }
        else {
            this._keywords = null;
        }
    }
    get columns() {
        return [...this._columns];
    }
    constructor(document) {
        this.title = null;
        this.description = null;
        this.language = null;
        this._keywords = null;
        this._columns = [];
        this.customData = null;
        this.customProperties = new TblCustomProperties();
        this.document = document;
    }
    get hasAny() {
        return this.title !== null ||
            this.description !== null ||
            this.language !== null ||
            this.keywords !== null ||
            this._columns.length > 0 ||
            this.customProperties.hasAny ||
            this.customData !== null;
    }
    addColumnMetaData() {
        if (this._columns.length >= this.document.columnNames.length) {
            throw new Error(`Meta data already for all columns defined`);
        }
        const result = new TblColumnMetaData(this._columns.length);
        this._columns.push(result);
        return result;
    }
    toElement() {
        const element = new SmlElement("Meta");
        if (this.title !== null) {
            element.addAttribute("Title", [this.title]);
        }
        if (this.description !== null) {
            element.addAttribute("Description", [this.description]);
        }
        if (this.language !== null) {
            element.addAttribute("Language", [this.language]);
        }
        if (this._keywords !== null) {
            element.addAttribute("Keywords", this._keywords);
        }
        for (const columnMetaData of this._columns) {
            element.addNode(columnMetaData.toElement());
        }
        this.customProperties.serialize(element);
        TblMetaDataUtil.serializeCustomData(this.customData, element);
        return element;
    }
    parse(element) {
        var _a, _b, _c, _d, _e, _f;
        element.assureName("Meta");
        this.title = (_b = (_a = element.optionalAttribute("Title")) === null || _a === void 0 ? void 0 : _a.asString()) !== null && _b !== void 0 ? _b : null;
        this.description = (_d = (_c = element.optionalAttribute("Description")) === null || _c === void 0 ? void 0 : _c.asString()) !== null && _d !== void 0 ? _d : null;
        this.language = (_f = (_e = element.optionalAttribute("Language")) === null || _e === void 0 ? void 0 : _e.asString()) !== null && _f !== void 0 ? _f : null;
        if (element.hasAttribute("Keywords")) {
            this._keywords = element.requiredAttribute("Keywords").asStringArray();
        }
        for (const columnElement of element.elements("Column")) {
            const column = this.addColumnMetaData();
            column.parse(columnElement);
        }
        this.customProperties.parse(element);
        this.customData = TblMetaDataUtil.getCustomData(element);
    }
}
// ----------------------------------------------------------------------
export class TblDocument {
    constructor(columnNames, encoding = ReliableTxtEncoding.Utf8) {
        this.rows = [];
        if (columnNames.length < 2) {
            throw new Error("Table must have at least two columns");
        }
        this._columnNames = [...columnNames];
        this.encoding = encoding;
        this.meta = new TblMetaData(this);
    }
    addRow(values) {
        if (values.length < 2) {
            throw new Error("Row must have at least two values");
        }
        if (values[0] === null) {
            throw new Error("First row value cannot be null");
        }
        if (values.length > this._columnNames.length) {
            throw new Error("Row has more values than there are columns");
        }
        this.rows.push([...values]);
    }
    get columnNames() {
        return [...this._columnNames];
    }
    get columnCount() {
        return this._columnNames.length;
    }
    getRowCount() {
        return this.rows.length;
    }
    getRow(index) {
        return [...this.rows[index]];
    }
    getRows() {
        return this.rows.map(x => [...x]);
    }
    toElement(aligned = false, whitespaceBetween = null, rightAligned = null) {
        const element = new SmlElement("Table");
        if (this.meta.hasAny) {
            const metaElement = this.meta.toElement();
            metaElement.alignAttributes(" ");
            element.addNode(metaElement);
        }
        element.addAttribute(this._columnNames[0], this._columnNames.slice(1));
        for (const row of this.rows) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            element.addAttribute(row[0], row.slice(1));
        }
        if (aligned) {
            element.alignAttributes(whitespaceBetween !== null && whitespaceBetween !== void 0 ? whitespaceBetween : " ", null, rightAligned);
        }
        return element;
    }
    toString(aligned = false, whitespaceBetween = null, rightAligned = null) {
        const rootElement = this.toElement(aligned, whitespaceBetween, rightAligned);
        const smlDocument = new SmlDocument(rootElement);
        return smlDocument.toString();
    }
    toMinifiedString() {
        const rootElement = this.toElement();
        const smlDocument = new SmlDocument(rootElement);
        return smlDocument.toMinifiedString();
    }
    getBytes() {
        const text = this.toString();
        return ReliableTxtEncoder.encode(text, this.encoding);
    }
    toBase64String() {
        const text = this.toString();
        return Base64String.fromText(text, this.encoding);
    }
    toBinaryTbl() {
        const rootElement = this.toElement();
        const smlDocument = new SmlDocument(rootElement);
        return smlDocument.toBinarySml();
    }
    static parseElement(element, encoding = ReliableTxtEncoding.Utf8) {
        if (!element.hasName("Table")) {
            throw new Error("Not a valid table document");
        }
        const attributes = element.attributes();
        if (attributes.length === 0) {
            throw new Error("No column names");
        }
        const columnNamesAttribute = attributes[0];
        for (const value of columnNamesAttribute.values) {
            if (value === null) {
                throw new Error("Column name cannot be null");
            }
        }
        const columnNames = [columnNamesAttribute.name, ...columnNamesAttribute.values];
        const document = new TblDocument(columnNames, encoding);
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
            const rowAttribute = attributes[i];
            const rowValues = [rowAttribute.name, ...rowAttribute.values];
            document.addRow(rowValues);
        }
        return document;
    }
    static parse(content, encoding = ReliableTxtEncoding.Utf8) {
        const smlDocument = SmlDocument.parse(content, false);
        return TblDocument.parseElement(smlDocument.root, encoding);
    }
    static fromBytes(bytes) {
        const document = ReliableTxtDecoder.decode(bytes);
        return this.parse(document.text, document.encoding);
    }
    static fromBase64String(base64Str) {
        const bytes = Base64String.toBytes(base64Str);
        return this.fromBytes(bytes);
    }
    static fromBinaryTbl(bytes) {
        const smlDocument = SmlDocument.fromBinarySml(bytes);
        return TblDocument.parseElement(smlDocument.root, ReliableTxtEncoding.Utf8);
    }
}
// ----------------------------------------------------------------------
export class TblsMetaData {
    constructor() {
        this.title = null;
        this.description = null;
        this.customData = null;
    }
    get hasAny() {
        return this.title !== null ||
            this.description !== null ||
            this.customData !== null;
    }
    toElement() {
        const element = new SmlElement("Meta");
        if (this.title !== null) {
            element.addAttribute("Title", [this.title]);
        }
        if (this.description !== null) {
            element.addAttribute("Description", [this.description]);
        }
        TblMetaDataUtil.serializeCustomData(this.customData, element);
        return element;
    }
    parse(element) {
        var _a, _b, _c, _d;
        this.title = (_b = (_a = element.optionalAttribute("Title")) === null || _a === void 0 ? void 0 : _a.asString()) !== null && _b !== void 0 ? _b : null;
        this.description = (_d = (_c = element.optionalAttribute("Description")) === null || _c === void 0 ? void 0 : _c.asString()) !== null && _d !== void 0 ? _d : null;
        this.customData = TblMetaDataUtil.getCustomData(element);
    }
}
// ----------------------------------------------------------------------
export class TblsDocument {
    constructor(tables = null, encoding = ReliableTxtEncoding.Utf8) {
        this.tables = [];
        this.meta = new TblsMetaData();
        this.tables = tables !== null && tables !== void 0 ? tables : [];
        this.encoding = encoding;
    }
    toElement(aligned = false, whitespaceBetween = null) {
        const element = new SmlElement("Tables");
        if (this.meta.hasAny) {
            const metaElement = this.meta.toElement();
            metaElement.alignAttributes(" ");
            element.addNode(metaElement);
        }
        for (const table of this.tables) {
            element.addNode(table.toElement(aligned, whitespaceBetween));
        }
        return element;
    }
    toString(aligned = false, whitespaceBetween = null) {
        const rootElement = this.toElement(aligned, whitespaceBetween);
        const smlDocument = new SmlDocument(rootElement);
        return smlDocument.toString();
    }
    toMinifiedString() {
        const rootElement = this.toElement();
        const smlDocument = new SmlDocument(rootElement);
        return smlDocument.toMinifiedString();
    }
    getBytes() {
        const text = this.toString();
        return ReliableTxtEncoder.encode(text, this.encoding);
    }
    toBase64String() {
        const text = this.toString();
        return Base64String.fromText(text, this.encoding);
    }
    toBinaryTbls() {
        const rootElement = this.toElement();
        const smlDocument = new SmlDocument(rootElement);
        return smlDocument.toBinarySml();
    }
    static parseElement(rootElement, encoding = ReliableTxtEncoding.Utf8) {
        const document = new TblsDocument(null, encoding);
        if (!rootElement.hasName("Tables")) {
            throw new Error("Not a valid tables document");
        }
        rootElement.assureElementCountMinMax(0, 1, "Meta");
        if (rootElement.hasElement("Meta")) {
            if (!rootElement.namedNodes()[0].isElementWithName("Meta")) {
                throw new Error("Meta element must be first node");
            }
            document.meta.parse(rootElement.element("Meta"));
        }
        for (const tableElement of rootElement.elements("Table")) {
            const tableDocument = TblDocument.parseElement(tableElement, encoding);
            document.tables.push(tableDocument);
        }
        return document;
    }
    static parse(content, encoding = ReliableTxtEncoding.Utf8) {
        const smlDocument = SmlDocument.parse(content, false);
        return this.parseElement(smlDocument.root, encoding);
    }
    static fromBytes(bytes) {
        const document = ReliableTxtDecoder.decode(bytes);
        return this.parse(document.text, document.encoding);
    }
    static fromBase64String(base64Str) {
        const bytes = Base64String.toBytes(base64Str);
        return this.fromBytes(bytes);
    }
    static fromBinaryTbls(bytes) {
        const smlDocument = SmlDocument.fromBinarySml(bytes);
        return TblsDocument.parseElement(smlDocument.root, ReliableTxtEncoding.Utf8);
    }
}
//# sourceMappingURL=tbl.js.map