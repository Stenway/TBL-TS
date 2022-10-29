/* (C) Stefan John / Stenway / SimpleML.com / 2022 */

import { ReliableTxtEncoding } from "@stenway/reliabletxt"
import { SmlAttribute, SmlDocument, SmlElement } from "@stenway/sml"

// ----------------------------------------------------------------------

export class TblMetaSource {

}

// ----------------------------------------------------------------------

export class TblMetaData {
	title: string | null = null
	description: string | null = null
	language: string | null = null
	keywords: string[] | null = null
	sources: TblMetaSource[] = []

	get hasAny(): boolean {
		return this.title !== null || 
			this.description !== null || 
			this.language !== null || 
			this.keywords !== null ||
			this.sources.length > 0
	}

	toSmlElement(): SmlElement {
		let element: SmlElement = new SmlElement("Meta")
		if (this.title !== null) { element.addAttribute("Title", [this.title]) }
		if (this.description !== null) { element.addAttribute("Description", [this.description]) }
		return element
	}

	parse(element: SmlElement) {
		this.title = TblMetaData.getSingleStringOrNull(element, "Title")
		this.description = TblMetaData.getSingleStringOrNull(element, "Description")
	}

	private static getSingleStringOrNull(element: SmlElement, name: string): string | null {
		if (element.hasAttribute(name)) {
			if (element.attributes(name).length > 1) { throw new Error(`Only one "${name}" attribute allowed`) }
			let attribute: SmlAttribute = element.attribute(name)
			if (attribute.values.length > 1) { throw new Error(`Only one value in meta attribute "${name}" allowed`) }
			return attribute.values[0]
		} else {
			return null
		}
	}
}

// ----------------------------------------------------------------------

export class TblDocument {
	encoding: ReliableTxtEncoding = ReliableTxtEncoding.Utf8
	private columnNames: string[]
	private rows: (string | null)[][] = []
	readonly meta: TblMetaData = new TblMetaData

	constructor(columnNames: string[]) {
		if (columnNames.length < 2) { throw new Error("Table must have at least two columns") }
		this.columnNames = columnNames
	}

	addRow(values: (string | null)[]) {
		if (values.length < 2) { throw new Error("Row must have at least two values") }
		if (values[0] === null) { throw new Error("First row value cannot be null") }
		if (values.length > this.columnNames.length) { throw new Error("Row has more values than there are columns") }
		this.rows.push(values)
	}

	getColumnNames(): string[] {
		return [...this.columnNames]
	}

	getRows(): (string | null)[][] {
		return this.rows.map(x => [...x])
	}

	toElement(aligned: boolean = false): SmlElement {
		let element: SmlElement = new SmlElement("Table")
		if (this.meta.hasAny) {
			let metaElement: SmlElement = this.meta.toSmlElement()
			metaElement.alignAttributes("  ")
			element.addNode(metaElement)
		}
		element.addAttribute(this.columnNames[0], this.columnNames.slice(1))
		for (let row of this.rows) {
			element.addAttribute(row[0]!, row.slice(1))
		}
		if (aligned) { element.alignAttributes("  ") }
		return element
	}

	toString(): string {
		let rootElement: SmlElement = this.toElement()
		let smlDocument: SmlDocument = new SmlDocument(rootElement)
		return smlDocument.toString()
	}

	toAlignedString(): string {
		let rootElement: SmlElement = this.toElement(true)
		let smlDocument: SmlDocument = new SmlDocument(rootElement)
		return smlDocument.toString()
	}

	toMinifiedString(): string {
		let rootElement: SmlElement = this.toElement()
		let smlDocument: SmlDocument = new SmlDocument(rootElement)
		return smlDocument.toMinifiedString()
	}

	static parseElement(element: SmlElement): TblDocument {
		if (!element.hasName("Table")) { throw new Error("Not a valid table document") }
		
		let attributes: SmlAttribute[] = element.attributes()
		if (attributes.length === 0) { throw new Error("No column names") }
		let columnNamesAttribute: SmlAttribute = attributes[0]
		for (let value of columnNamesAttribute.values) {
			if (value === null) { throw new Error("Column name cannot be null") }
		}
		let columnNames: string[] = [columnNamesAttribute.name, ...(columnNamesAttribute.values as string[])]
		let document: TblDocument = new TblDocument(columnNames)
		
		if (element.hasElement("Meta")) {
			if (element.elements().length > 1) { throw new Error("Only one meta element is allowed") }
			if (!element.namedNodes()[0].isElement()) { throw new Error("Meta element must be first node") }
			document.meta.parse(element.element("Meta"))
		} else {
			if (element.hasElements()) { throw new Error("Only meta element is allowed") }
		}

		for (let i=1; i<attributes.length; i++) {
			let rowAttribute: SmlAttribute = attributes[i]
			let rowValues: (string | null)[] = [rowAttribute.name, ...rowAttribute.values]
			document.addRow(rowValues)
		}
		return document
	}

	static parse(content: string): TblDocument {
		let smlDocument: SmlDocument = SmlDocument.parse(content, false)
		return TblDocument.parseElement(smlDocument.root)
	}
}

// ----------------------------------------------------------------------

export class TblsDocument {
	encoding: ReliableTxtEncoding = ReliableTxtEncoding.Utf8
	tables: TblDocument[] = []

	toElement(aligned: boolean = false): SmlElement {
		let element: SmlElement = new SmlElement("Tables")
		for (let table of this.tables) {
			element.addNode(table.toElement(aligned))
		}
		return element
	}

	toString(): string {
		let rootElement: SmlElement = this.toElement()
		let smlDocument: SmlDocument = new SmlDocument(rootElement)
		return smlDocument.toString()
	}

	toAlignedString(): string {
		let rootElement: SmlElement = this.toElement(true)
		let smlDocument: SmlDocument = new SmlDocument(rootElement)
		return smlDocument.toString()
	}

	toMinifiedString(): string {
		let rootElement: SmlElement = this.toElement()
		let smlDocument: SmlDocument = new SmlDocument(rootElement)
		return smlDocument.toMinifiedString()
	}

	static parse(content: string): TblsDocument {
		let document: TblsDocument = new TblsDocument()
		let smlDocument: SmlDocument = SmlDocument.parse(content, false)
		let rootElement: SmlElement = smlDocument.root
		if (!rootElement.hasName("Tables")) { throw new Error("Not a valid tables document") }
		for (let tableElement of rootElement.elements("Table")) {
			let tableDocument: TblDocument = TblDocument.parseElement(tableElement)
			document.tables.push(tableDocument)
		}
		return document
	}
}