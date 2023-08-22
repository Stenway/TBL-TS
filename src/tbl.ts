/* (C) Stefan John / Stenway / SimpleML.com / 2023 */

import { Base64String, ReliableTxtDecoder, ReliableTxtEncoder, ReliableTxtEncoding } from "@stenway/reliabletxt"
import { SmlAttribute, SmlDocument, SmlElement } from "@stenway/sml"

// ----------------------------------------------------------------------

export class TblCustomMetaData {
	readonly mediaType: string | null
	readonly textContent: string

	constructor(mediaType: string | null, textContent: string) {
		this.mediaType = mediaType
		this.textContent = textContent
	}
}

// ----------------------------------------------------------------------

abstract class TblMetaDataUtil {
	static getCustomData(element: SmlElement): TblCustomMetaData | SmlElement | null {
		if (element.hasAttribute("CustomData")) {
			if (element.hasElement("CustomData")) { throw new Error(`CustomData element not allowed because attribute already defined`) }
			const customDataAttribute = element.requiredAttribute("CustomData")
			customDataAttribute.assureValueCountMinMax(1, 2)
			if (customDataAttribute.valueCount === 1) {
				return new TblCustomMetaData(null, customDataAttribute.asString())
			} else {
				const values = customDataAttribute.asStringArray()
				return new TblCustomMetaData(values[0], values[1])
			}
		} else if (element.hasElement("CustomData")) {
			return element.requiredElement("CustomData")
		}
		return null
	}

	static serializeCustomData(customData: TblCustomMetaData | SmlElement | null, element: SmlElement) {
		if (customData !== null) {
			if (customData instanceof SmlElement) { element.addNode(customData) }
			else {
				if (customData.mediaType !== null) { element.addAttribute("CustomData", [customData.mediaType, customData.textContent]) }
				else { element.addAttribute("CustomData", [customData.textContent]) }
			}
		}
	}
}
// ----------------------------------------------------------------------

export class TblCustomProperties {
	private _element: SmlElement = new SmlElement("CustomProperties")

	get keys(): string[] {
		return this._element.attributes().map(x => x.name)
	}

	get entries(): [string, string][] {
		return this._element.attributes().map(x => [x.name, x.asString()])
	}

	get hasAny(): boolean {
		return this._element.hasAttributes()
	}

	set(key: string, value: string) {
		if (this._element.hasAttribute(key)) {
			this._element.attribute(key).setString(value)
		} else {
			this._element.addAttribute(key, [value])
		}
	}

	setRange(entries: [string, string][]) {
		for (const entry of entries) {
			this.set(entry[0], entry[1])
		}
	}

	unset(key: string) {
		const attributeOrNull = this._element.optionalAttribute(key)
		if (attributeOrNull !== null) {
			this._element.nodes = this._element.nodes.filter(x => x !== attributeOrNull)
		}
	}

	clear() {
		this._element.nodes = []
	}

	get(key: string): string {
		if (!this._element.hasAttribute(key)) { throw new Error(`Custom property with key "${key}" does not exist`) }
		return this._element.attribute(key).asString()
	}

	getOrNull(key: string): string | null {
		if (this._element.hasAttribute(key)) {
			return this._element.attribute(key).asString()
		}
		return null
	}

	getOrDefault(key: string, defaultValue: string): string {
		return this.getOrNull(key) ?? defaultValue
	}

	serialize(element: SmlElement) {
		if (!this.hasAny) { return }
		element.addNode(this._element)
	}

	parse(parentElement: SmlElement) {
		if (!parentElement.hasElement("CustomProperties")) { return }
		const element = parentElement.requiredElement("CustomProperties")
		element.assureNoElements()
		for (const attribute of element.attributes()) {
			this.set(attribute.name, attribute.asString())
		}
	}
}

// ----------------------------------------------------------------------

export class TblColumnMetaData {
	readonly index: number
	title: string | null = null
	description: string | null = null
	customData: TblCustomMetaData | SmlElement | null = null

	constructor(index: number) {
		this.index = index
	}

	toElement(): SmlElement {
		const element: SmlElement = new SmlElement("Column")
		if (this.title !== null) { element.addAttribute("Title", [this.title]) }
		if (this.description !== null) { element.addAttribute("Description", [this.description]) }
		TblMetaDataUtil.serializeCustomData(this.customData, element)
		return element
	}

	parse(element: SmlElement) {
		this.title = element.optionalAttribute("Title")?.asString() ?? null
		this.description = element.optionalAttribute("Description")?.asString() ?? null

		this.customData = TblMetaDataUtil.getCustomData(element)
	}
}

// ----------------------------------------------------------------------

export class TblMetaData {
	title: string | null = null
	description: string | null = null
	language: string | null = null
	private _keywords: string[] | null = null
	private _columns: TblColumnMetaData[] = []
	customData: TblCustomMetaData | SmlElement | null = null
	customProperties: TblCustomProperties = new TblCustomProperties()
	private document: TblDocument

	get keywords(): string[] | null {
		if (this._keywords === null) { return null }
		return [...this._keywords]
	}

	set keywords(values: string[] | null) {
		if (values !== null) {
			if (values.length === 0) { throw new RangeError(`Keywords array cannot be empty`) }
			this._keywords = [...values]
		} else {
			this._keywords = null
		}
	}

	get columns(): TblColumnMetaData[] {
		return [...this._columns]
	}

	constructor(document: TblDocument) {
		this.document = document
	}

	get hasAny(): boolean {
		return this.title !== null || 
			this.description !== null || 
			this.language !== null || 
			this.keywords !== null ||
			this._columns.length > 0 ||
			this.customProperties.hasAny ||
			this.customData !== null
	}

	addColumnMetaData(): TblColumnMetaData {
		if (this._columns.length >= this.document.columnNames.length) { throw new Error(`Meta data already for all columns defined`) }
		const result = new TblColumnMetaData(this._columns.length)
		this._columns.push(result)
		return result
	}

	toElement(): SmlElement {
		const element: SmlElement = new SmlElement("Meta")
		if (this.title !== null) { element.addAttribute("Title", [this.title]) }
		if (this.description !== null) { element.addAttribute("Description", [this.description]) }
		if (this.language !== null) { element.addAttribute("Language", [this.language]) }
		if (this._keywords !== null) { element.addAttribute("Keywords", this._keywords) }
		for (const columnMetaData of this._columns) {
			element.addNode(columnMetaData.toElement())
		}
		this.customProperties.serialize(element)
		TblMetaDataUtil.serializeCustomData(this.customData, element)
		return element
	}

	parse(element: SmlElement) {
		element.assureName("Meta")
		this.title = element.optionalAttribute("Title")?.asString() ?? null
		this.description = element.optionalAttribute("Description")?.asString() ?? null
		this.language = element.optionalAttribute("Language")?.asString() ?? null
		if (element.hasAttribute("Keywords")) {
			this._keywords = element.requiredAttribute("Keywords").asStringArray()
		}
		for (const columnElement of element.elements("Column")) {
			const column = this.addColumnMetaData()
			column.parse(columnElement)
		}
		this.customProperties.parse(element)
		this.customData = TblMetaDataUtil.getCustomData(element)
	}
}

// ----------------------------------------------------------------------

export class TblDocument {
	encoding: ReliableTxtEncoding
	private _columnNames: string[]
	private rows: (string | null)[][] = []
	readonly meta: TblMetaData

	constructor(columnNames: string[], encoding: ReliableTxtEncoding = ReliableTxtEncoding.Utf8) {
		if (columnNames.length < 2) { throw new Error("Table must have at least two columns") }
		this._columnNames = [...columnNames]
		this.encoding = encoding
		this.meta = new TblMetaData(this)
	}

	addRow(values: (string | null)[]) {
		if (values.length < 2) { throw new Error("Row must have at least two values") }
		if (values[0] === null) { throw new Error("First row value cannot be null") }
		if (values.length > this._columnNames.length) { throw new Error("Row has more values than there are columns") }
		this.rows.push([...values])
	}

	get columnNames(): string[] {
		return [...this._columnNames]
	}

	get columnCount(): number {
		return this._columnNames.length
	}

	getRowCount(): number {
		return this.rows.length
	}

	getRow(index: number): (string | null)[] {
		return [...this.rows[index]]
	}

	getRows(): (string | null)[][] {
		return this.rows.map(x => [...x])
	}

	toElement(aligned: boolean = false, whitespaceBetween: string | null = null, rightAligned: boolean[] | null = null): SmlElement {
		const element: SmlElement = new SmlElement("Table")
		if (this.meta.hasAny) {
			const metaElement: SmlElement = this.meta.toElement()
			metaElement.alignAttributes(" ")
			element.addNode(metaElement)
		}
		element.addAttribute(this._columnNames[0], this._columnNames.slice(1))
		for (const row of this.rows) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			element.addAttribute(row[0]!, row.slice(1))
		}
		if (aligned) { element.alignAttributes(whitespaceBetween ?? " ", null, rightAligned) }
		return element
	}

	toString(aligned: boolean = false, whitespaceBetween: string | null = null, rightAligned: boolean[] | null = null): string {
		const rootElement: SmlElement = this.toElement(aligned, whitespaceBetween, rightAligned)
		const smlDocument: SmlDocument = new SmlDocument(rootElement)
		return smlDocument.toString()
	}
	
	toMinifiedString(): string {
		const rootElement: SmlElement = this.toElement()
		const smlDocument: SmlDocument = new SmlDocument(rootElement)
		return smlDocument.toMinifiedString()
	}

	toBytes(): Uint8Array {
		const text = this.toString()
		return ReliableTxtEncoder.encode(text, this.encoding)
	}

	toBase64String(): string {
		const text = this.toString()
		return Base64String.fromText(text, this.encoding)
	}

	toBinaryTbl(): Uint8Array {
		const rootElement: SmlElement = this.toElement()
		const smlDocument: SmlDocument = new SmlDocument(rootElement)
		return smlDocument.toBinarySml()
	}

	static parseElement(element: SmlElement, encoding: ReliableTxtEncoding = ReliableTxtEncoding.Utf8): TblDocument {
		if (!element.hasName("Table")) { throw new Error("Not a valid table document") }
		
		const attributes: SmlAttribute[] = element.attributes()
		if (attributes.length === 0) { throw new Error("No column names") }
		const columnNamesAttribute: SmlAttribute = attributes[0]
		for (const value of columnNamesAttribute.values) {
			if (value === null) { throw new Error("Column name cannot be null") }
		}
		const columnNames: string[] = [columnNamesAttribute.name, ...(columnNamesAttribute.values as string[])]
		const document: TblDocument = new TblDocument(columnNames, encoding)
		
		if (element.hasElement("Meta")) {
			if (element.elements().length > 1) { throw new Error("Only one meta element is allowed") }
			if (!element.namedNodes()[0].isElement()) { throw new Error("Meta element must be first node") }
			document.meta.parse(element.element("Meta"))
		} else {
			if (element.hasElements()) { throw new Error("Only meta element is allowed") }
		}

		for (let i=1; i<attributes.length; i++) {
			const rowAttribute: SmlAttribute = attributes[i]
			const rowValues: (string | null)[] = [rowAttribute.name, ...rowAttribute.values]
			document.addRow(rowValues)
		}
		return document
	}

	static parse(content: string, encoding: ReliableTxtEncoding = ReliableTxtEncoding.Utf8): TblDocument {
		const smlDocument: SmlDocument = SmlDocument.parse(content, false)
		return TblDocument.parseElement(smlDocument.root, encoding)
	}

	static fromBytes(bytes: Uint8Array): TblDocument {
		const document = ReliableTxtDecoder.decode(bytes)
		return this.parse(document.text, document.encoding)
	}

	static fromBase64String(base64Str: string): TblDocument {
		const bytes = Base64String.toBytes(base64Str)
		return this.fromBytes(bytes)
	}

	static fromBinaryTbl(bytes: Uint8Array): TblDocument {
		const smlDocument = SmlDocument.fromBinarySml(bytes)
		return TblDocument.parseElement(smlDocument.root, ReliableTxtEncoding.Utf8)
	}
}

// ----------------------------------------------------------------------

export class TblsMetaData {
	title: string | null = null
	description: string | null = null
	customData: TblCustomMetaData | SmlElement | null = null

	get hasAny(): boolean {
		return this.title !== null || 
			this.description !== null || 
			this.customData !== null
	}

	toElement(): SmlElement {
		const element: SmlElement = new SmlElement("Meta")
		if (this.title !== null) { element.addAttribute("Title", [this.title]) }
		if (this.description !== null) { element.addAttribute("Description", [this.description]) }
		TblMetaDataUtil.serializeCustomData(this.customData, element)
		return element
	}

	parse(element: SmlElement) {
		this.title = element.optionalAttribute("Title")?.asString() ?? null
		this.description = element.optionalAttribute("Description")?.asString() ?? null

		this.customData = TblMetaDataUtil.getCustomData(element)
	}
}

// ----------------------------------------------------------------------

export class TblsDocument {
	encoding: ReliableTxtEncoding
	tables: TblDocument[] = []
	readonly meta: TblsMetaData = new TblsMetaData()

	constructor(tables: TblDocument[] | null = null, encoding: ReliableTxtEncoding = ReliableTxtEncoding.Utf8) {
		this.tables = tables ?? []
		this.encoding = encoding
	}

	toElement(aligned: boolean = false, whitespaceBetween: string | null = null): SmlElement {
		const element: SmlElement = new SmlElement("Tables")
		if (this.meta.hasAny) {
			const metaElement: SmlElement = this.meta.toElement()
			metaElement.alignAttributes(" ")
			element.addNode(metaElement)
		}
		for (const table of this.tables) {
			element.addNode(table.toElement(aligned, whitespaceBetween))
		}
		return element
	}

	toString(aligned: boolean = false, whitespaceBetween: string | null = null): string {
		const rootElement: SmlElement = this.toElement(aligned, whitespaceBetween)
		const smlDocument: SmlDocument = new SmlDocument(rootElement)
		return smlDocument.toString()
	}

	toMinifiedString(): string {
		const rootElement: SmlElement = this.toElement()
		const smlDocument: SmlDocument = new SmlDocument(rootElement)
		return smlDocument.toMinifiedString()
	}

	toBytes(): Uint8Array {
		const text = this.toString()
		return ReliableTxtEncoder.encode(text, this.encoding)
	}

	toBase64String(): string {
		const text = this.toString()
		return Base64String.fromText(text, this.encoding)
	}

	toBinaryTbls(): Uint8Array {
		const rootElement: SmlElement = this.toElement()
		const smlDocument: SmlDocument = new SmlDocument(rootElement)
		return smlDocument.toBinarySml()
	}

	static parseElement(rootElement: SmlElement, encoding: ReliableTxtEncoding = ReliableTxtEncoding.Utf8): TblsDocument {
		const document: TblsDocument = new TblsDocument(null, encoding)
		if (!rootElement.hasName("Tables")) { throw new Error("Not a valid tables document") }

		rootElement.assureElementCountMinMax(0, 1, "Meta")
		if (rootElement.hasElement("Meta")) {
			if (!rootElement.namedNodes()[0].isElementWithName("Meta")) { throw new Error("Meta element must be first node") }
			document.meta.parse(rootElement.element("Meta"))
		}

		for (const tableElement of rootElement.elements("Table")) {
			const tableDocument: TblDocument = TblDocument.parseElement(tableElement, encoding)
			document.tables.push(tableDocument)
		}
		return document
	}
	
	static parse(content: string, encoding: ReliableTxtEncoding = ReliableTxtEncoding.Utf8): TblsDocument {
		const smlDocument: SmlDocument = SmlDocument.parse(content, false)
		return this.parseElement(smlDocument.root, encoding)
	}

	static fromBytes(bytes: Uint8Array): TblsDocument {
		const document = ReliableTxtDecoder.decode(bytes)
		return this.parse(document.text, document.encoding)
	}

	static fromBase64String(base64Str: string): TblsDocument {
		const bytes = Base64String.toBytes(base64Str)
		return this.fromBytes(bytes)
	}

	static fromBinaryTbls(bytes: Uint8Array): TblsDocument {
		const smlDocument = SmlDocument.fromBinarySml(bytes)
		return TblsDocument.parseElement(smlDocument.root, ReliableTxtEncoding.Utf8)
	}
}