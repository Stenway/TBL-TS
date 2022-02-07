/* (C) Stefan John / Stenway / SimpleML.com / 2022 */

import { ReliableTxtEncoding } from "./reliabletxt.js"
import { SmlAttribute, SmlDocument, SmlElement } from "./sml.js"

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

	toSmlDocument(aligned: boolean = false): SmlDocument {
		let smlRootElement: SmlElement = new SmlElement("Table")
		if (this.meta.hasAny) {
			let metaElement: SmlElement = this.meta.toSmlElement()
			metaElement.alignAttributes("  ")
			smlRootElement.addNode(metaElement)
		}
		smlRootElement.addAttribute(this.columnNames[0], this.columnNames.slice(1))
		for (let row of this.rows) {
			smlRootElement.addAttribute(row[0]!, row.slice(1))
		}
		smlRootElement.alignAttributes("  ")
		let smlDocument: SmlDocument = new SmlDocument(smlRootElement)
		return smlDocument
	}

	toString(): string {
		let smlDocument: SmlDocument = this.toSmlDocument()
		return smlDocument.toString()
	}

	toAlignedString(): string {
		let smlDocument: SmlDocument = this.toSmlDocument(true)
		return smlDocument.toString()
	}

	toMinifiedString(): string {
		let smlDocument: SmlDocument = this.toSmlDocument()
		return smlDocument.toMinifiedString()
	}

	static parse(content: string): TblDocument {
		let smlDocument: SmlDocument = SmlDocument.parse(content, false)
		let rootElement: SmlElement = smlDocument.root
		if (!rootElement.hasName("Table")) { throw new Error("Not a valid table document") }
		
		let attributes: SmlAttribute[] = rootElement.attributes()
		if (attributes.length === 0) { throw new Error("No column names") }
		let columnNamesAttribute: SmlAttribute = attributes[0]
		for (let value of columnNamesAttribute.values) {
			if (value === null) { throw new Error("Column name cannot be null") }
		}
		let columnNames: string[] = [columnNamesAttribute.name, ...(columnNamesAttribute.values as string[])]
		let document: TblDocument = new TblDocument(columnNames)
		
		if (rootElement.hasElement("Meta")) {
			if (rootElement.elements().length > 1) { throw new Error("Only one meta element is allowed")}
			if (!rootElement.namedNodes()[0].isElement()) { throw new Error("Meta element must be first node")}
			document.meta.parse(rootElement.element("Meta"))
		} else {
			if (rootElement.hasElements()) { throw new Error("Only meta element is allowed")}
		}

		for (let i=1; i<attributes.length; i++) {
			let rowAttribute: SmlAttribute = attributes[i]
			let rowValues: (string | null)[] = [rowAttribute.name, ...rowAttribute.values]
			document.addRow(rowValues)
		}
		return document
	}
}