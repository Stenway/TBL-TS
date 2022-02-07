/* (C) Stefan John / Stenway / SimpleML.com / 2022 */

import { ReliableTxtFile } from "./reliabletxt-io.js";
import { TblDocument } from "./tbl.js";

// ----------------------------------------------------------------------

export abstract class TblFile {
	static saveSync(document: TblDocument, filePath: string) {
		let content: string = document.toString()
		ReliableTxtFile.writeAllTextSync(content, filePath, document.encoding)
	}

	static saveMinifiedSync(document: TblDocument, filePath: string) {
		let content: string = document.toMinifiedString()
		ReliableTxtFile.writeAllTextSync(content, filePath, document.encoding)
	}

	static saveAlignedSync(document: TblDocument, filePath: string) {
		let content: string = document.toAlignedString()
		ReliableTxtFile.writeAllTextSync(content, filePath, document.encoding)
	}
}