/* (C) Stefan John / Stenway / SimpleML.com / 2022 */

import { TblDocument } from "./tbl.js"

// ----------------------------------------------------------------------

export abstract class TblConverter {
	private static valueToHtml(value: string) {
		var div = document.createElement('div')
		div.innerText = value
		return div.innerHTML
	}

	static toHtmlTable(tblDocument: TblDocument): string {
		let output: string = "<table>"
		let columnNames: string[] = tblDocument.getColumnNames()
		output += "<tr>"
		for (let columnName of columnNames) {
			output += "<th>"+TblConverter.valueToHtml(columnName)+"</th>"
		}
		output += "</tr>"
		let rows: (string | null)[][] = tblDocument.getRows()
		for (let row of rows) {
			output += "<tr>"
			for (let value of row) {
				if (value == null) {
					output += "<td class='null'>&lt;Null&gt;</td>"
				} else if (value == "") {
					output += "<td class='empty'>&lt;Empty&gt;</td>"
				} else {
					output += "<td>"+TblConverter.valueToHtml(value)+"</td>"
				}
			}
			output += "</tr>"
		}
		output += "</table>"
		return output
	}

	static metaDataToHtmlTable(tblDocument: TblDocument): string {
		let output: string = "<table>"
		output += TblConverter.getMetaDataHtml_singleValue("Title", tblDocument.meta.title)
		output += TblConverter.getMetaDataHtml_singleValue("Description", tblDocument.meta.description)
		output += "</table>"
		return output
	}

	private static getMetaDataHtml_singleValue(name: string, value: string | null): string {
		if (value === null) { return "" }
		return `<tr><th>${name}</th><td>${TblConverter.valueToHtml(value)}</td></tr>`
	}
}