import { ReliableTxtEncoding } from "@stenway/reliabletxt";
import { SmlElement } from "@stenway/sml";
import { TblCustomProperties, TblDocument, TblMetaData, TblsDocument, TblsMetaData } from "../src/tbl.js";
test("TblCustomProperties.set", () => {
    const properties = new TblCustomProperties();
    properties.set("Key", "Value1");
    expect(properties.entries).toEqual([["Key", "Value1"]]);
    properties.set("KEY", "Value2");
    expect(properties.entries).toEqual([["Key", "Value2"]]);
});
test("TblCustomProperties.setRange", () => {
    const properties = new TblCustomProperties();
    properties.setRange([["Key1", "Value1"], ["Key2", "Value2"]]);
    expect(properties.entries).toEqual([["Key1", "Value1"], ["Key2", "Value2"]]);
});
test("TblCustomProperties.unset", () => {
    const properties = new TblCustomProperties();
    properties.set("Key", "Value1");
    expect(properties.entries).toEqual([["Key", "Value1"]]);
    properties.unset("KEY");
    expect(properties.entries).toEqual([]);
    properties.unset("Key");
});
test("TblCustomProperties.clear", () => {
    const properties = new TblCustomProperties();
    properties.setRange([["Key1", "Value1"], ["Key2", "Value2"]]);
    properties.clear();
    expect(properties.entries).toEqual([]);
});
test("TblCustomProperties.keys", () => {
    const properties = new TblCustomProperties();
    properties.setRange([["Key1", "Value1"], ["Key2", "Value2"]]);
    expect(properties.keys).toEqual(["Key1", "Key2"]);
});
test("TblCustomProperties.get + getOrNull + getOrDefault", () => {
    const properties = new TblCustomProperties();
    properties.set("Key", "Value1");
    expect(properties.get("Key")).toEqual("Value1");
    expect(() => properties.get("Key2")).toThrowError();
    expect(properties.getOrNull("Key")).toEqual("Value1");
    expect(properties.getOrNull("Key2")).toEqual(null);
    expect(properties.getOrDefault("Key", "X")).toEqual("Value1");
    expect(properties.getOrDefault("Key2", "X")).toEqual("X");
});
// ----------------------------------------------------------------------
describe("TblMetaData.parse + toSmlElement", () => {
    test.each([
        [`Meta\n\tTitle text\n\tDescription text\nEnd`],
        [`Meta\n\tCustomData text\nEnd`],
        [`Meta\n\tCustomData application/xyz text\nEnd`],
        [`Meta\n\tCustomData\n\t\tMyAttribute 123\n\tEnd\nEnd`],
        [`Meta\n\tLanguage EN\nEnd`],
        [`Meta\n\tKeywords Keyword1 Keyword2\nEnd`],
        [`Meta\n\tCustomProperties\n\t\tKey Value\n\tEnd\nEnd`],
        [`Meta\n\tColumn\n\t\tDescription Text\n\tEnd\nEnd`],
        [`Meta\n\tColumn\n\t\tTitle Text\n\tEnd\nEnd`],
        [`Meta\n\tColumn\n\t\tCustomData Text\n\tEnd\nEnd`],
    ])("Given %p", (input) => {
        const meta = new TblMetaData(new TblDocument(["C1", "C2"]));
        meta.parse(SmlElement.parse(input));
        expect(meta.toElement().toString()).toEqual(input);
    });
    test.each([
        [`Meta\n\tCustomData text\n\tCustomData text\nEnd`],
        [`Meta\n\tCustomData text\n\tCustomData\n\t\tMyAttribute 123\n\tEnd\nEnd`],
        [`Meta\n\tCustomData\n\t\tMyAttribute 123\n\tEnd\n\tCustomData text\nEnd`],
        [`Meta\n\tColumn\n\tEnd\n\tColumn\n\tEnd\n\tColumn\n\tEnd\nEnd`],
    ])("Given %p throws", (input) => {
        const meta = new TblMetaData(new TblDocument(["C1", "C2"]));
        expect(() => meta.parse(SmlElement.parse(input))).toThrowError();
    });
});
describe("TblMetaData.keywords", () => {
    test("Modify", () => {
        const meta = new TblMetaData(new TblDocument(["C1", "C2"]));
        const keywords = ["Keyword1"];
        meta.keywords = keywords;
        keywords.pop();
        expect(meta.keywords).toEqual(["Keyword1"]);
        const returnedKeywords = meta.keywords;
        returnedKeywords.pop();
        expect(meta.keywords).toEqual(["Keyword1"]);
        meta.keywords = null;
        expect(meta.keywords).toEqual(null);
    });
    test("Throws", () => {
        const meta = new TblMetaData(new TblDocument(["C1", "C2"]));
        expect(() => meta.keywords = []).toThrowError();
    });
});
test("TblMetaData.columns", () => {
    const meta = new TblMetaData(new TblDocument(["C1", "C2"]));
    meta.addColumnMetaData();
    meta.addColumnMetaData();
    const columns = meta.columns;
    columns.pop();
    expect(meta.columns.length).toEqual(2);
});
// ----------------------------------------------------------------------
describe("TblDocument.constructor", () => {
    test.each([
        [["Column1", "Column2"]],
    ])("Given %p", (input) => {
        const document = new TblDocument(input);
        expect(document.encoding).toEqual(ReliableTxtEncoding.Utf8);
        expect(document.columnNames).toEqual(input);
    });
    test.each([
        [[]],
        [["Column1"]],
    ])("Given %p throws", (input) => {
        expect(() => new TblDocument(input)).toThrowError();
    });
});
test("TblDocument.getColumnNames", () => {
    const document = new TblDocument(["Column1", "Column2"]);
    const columnNames = document.columnNames;
    columnNames[0] = "Changed";
    expect(document.columnNames).toEqual(["Column1", "Column2"]);
    expect(document.columnCount).toEqual(2);
});
describe("TblDocument.addRow", () => {
    test.each([
        [["Value1", null]],
    ])("Given %p", (input) => {
        const document = new TblDocument(["Column1", "Column2"]);
        const inputClone = [...input];
        document.addRow(input);
        input[0] = null;
        expect(document.getRows()).toEqual([inputClone]);
    });
    test.each([
        [[]],
        [["Value1"]],
        [[null, "Value2"]],
        [["Value1", "Value2", "Value3", "Value4"]],
    ])("Given %p throws", (input) => {
        const document = new TblDocument(["Column1", "Column2", "Column3"]);
        expect(() => document.addRow(input)).toThrowError();
    });
});
test("TblDocument.getRows + getRow + getRowCount", () => {
    const document = new TblDocument(["Column1", "Column2"]);
    document.addRow(["Value11", "Value12"]);
    document.addRow(["Value21", null]);
    expect(document.getRows()).toEqual([["Value11", "Value12"], ["Value21", null]]);
    expect(document.getRowCount()).toEqual(2);
    expect(document.getRow(1)).toEqual(["Value21", null]);
});
test("TblDocument.toString + toAlignedString + toMinifiedString", () => {
    const document = new TblDocument(["Column1", "Column2", "Column3"]);
    document.addRow(["Long Value 11", "Value12"]);
    document.addRow(["Value21", null]);
    document.addRow(["Value31", "𝄞𝄞𝄞𝄞𝄞𝄞𝄞𝄞"]);
    expect(document.toString()).toEqual(`Table\n\tColumn1 Column2 Column3\n\t"Long Value 11" Value12\n\tValue21 -\n\tValue31 𝄞𝄞𝄞𝄞𝄞𝄞𝄞𝄞\nEnd`);
    expect(document.toString(true)).toEqual(`Table\n\tColumn1         Column2  Column3\n\t"Long Value 11" Value12\n\tValue21         -\n\tValue31         𝄞𝄞𝄞𝄞𝄞𝄞𝄞𝄞\nEnd`);
    expect(document.toMinifiedString()).toEqual(`Table\nColumn1 Column2 Column3\n"Long Value 11" Value12\nValue21 -\nValue31 𝄞𝄞𝄞𝄞𝄞𝄞𝄞𝄞\n-`);
    expect(document.toString(true, "  ")).toEqual(`Table\n\tColumn1          Column2   Column3\n\t"Long Value 11"  Value12\n\tValue21          -\n\tValue31          𝄞𝄞𝄞𝄞𝄞𝄞𝄞𝄞\nEnd`);
    expect(document.toString(true, "  ", [false, true, true])).toEqual(`Table\n\tColumn1           Column2  Column3\n\t"Long Value 11"   Value12\n\tValue21                 -\n\tValue31          𝄞𝄞𝄞𝄞𝄞𝄞𝄞𝄞\nEnd`);
    document.meta.title = "My Table";
    expect(document.toString(true)).toEqual(`Table\n\tMeta\n\t\tTitle "My Table"\n\tEnd\n\tColumn1         Column2  Column3\n\t"Long Value 11" Value12\n\tValue21         -\n\tValue31         𝄞𝄞𝄞𝄞𝄞𝄞𝄞𝄞\nEnd`);
    expect(document.toMinifiedString()).toEqual(`Table\nMeta\nTitle "My Table"\n-\nColumn1 Column2 Column3\n"Long Value 11" Value12\nValue21 -\nValue31 𝄞𝄞𝄞𝄞𝄞𝄞𝄞𝄞\n-`);
});
describe("TblDocument.parse", () => {
    test.each([
        [`Table\n\tColumn1 Column2\nEnd`],
        [`Table\n\tColumn1 Column2\n\tValue11 Value12\nEnd`],
        [`Table\n\tMeta\n\t\tDescription Text\n\tEnd\n\tColumn1 Column2\n\tValue11 Value12\nEnd`],
    ])("Given %p", (input) => {
        const document = TblDocument.parse(input);
        expect(document.toString()).toEqual(input);
    });
    test.each([
        [`Table\nEnd`],
        [`Document\nEnd`],
        [`Table\n\tColumn1 -\nEnd`],
        [`Table\n\tColumn1 Column2\n\tElement\n\tEnd\nEnd`],
        [`Table\n\tColumn1 Column2\n\tMeta\n\tEnd\nEnd`],
        [`Table\n\tColumn1 Column2\n\tMeta\n\tEnd\n\tMeta\n\tEnd\nEnd`],
    ])("Given %p throws", (input) => {
        expect(() => TblDocument.parse(input)).toThrowError();
    });
});
test("TblDocument.toBytes + fromBytes", () => {
    const document = TblDocument.parse(`Table\n\tColumn1 Column2\n\tV11 V12\n\t"Long Value" -\nEnd`);
    const bytes = document.toBytes();
    const document2 = TblDocument.fromBytes(bytes);
    expect(document.toString()).toEqual(document2.toString());
});
test("TblDocument.toBase64String + fromBase64String", () => {
    const document = TblDocument.parse(`Table\n\tColumn1 Column2\n\tV11 V12\n\t"Long Value" -\nEnd`);
    const base64Str = document.toBase64String();
    const document2 = TblDocument.fromBase64String(base64Str);
    expect(document.toString()).toEqual(document2.toString());
});
test("TblDocument.parseElement", () => {
    const element = SmlElement.parse(`Table\n\tColumn1 Column2\n\tV11 V12\n\t"Long Value" -\nEnd`);
    const document = TblDocument.parseElement(element);
    expect(document.toString()).toEqual(element.toString());
});
test("TblDocument.toBinaryTbl + fromBinaryTbl", () => {
    const document = TblDocument.parse(`Table\n\tColumn1 Column2\n\tV11 V12\n\t"Long Value" -\nEnd`);
    const bytes = document.toBinaryTbl();
    const decodedDocument = TblDocument.fromBinaryTbl(bytes);
    expect(document.toString()).toEqual(decodedDocument.toString());
});
// ----------------------------------------------------------------------
describe("TblsMetaData.parse + toSmlElement", () => {
    test.each([
        [`Meta\n\tTitle text\n\tDescription text\nEnd`],
        [`Meta\n\tCustomData text\nEnd`],
        [`Meta\n\tCustomData application/xyz text\nEnd`],
        [`Meta\n\tCustomData\n\t\tMyAttribute 123\n\tEnd\nEnd`],
    ])("Given %p", (input) => {
        const meta = new TblsMetaData();
        meta.parse(SmlElement.parse(input));
        expect(meta.toElement().toString()).toEqual(input);
    });
    test.each([
        [`Meta\n\tCustomData text\n\tCustomData text\nEnd`],
        [`Meta\n\tCustomData text\n\tCustomData\n\t\tMyAttribute 123\n\tEnd\nEnd`],
        [`Meta\n\tCustomData\n\t\tMyAttribute 123\n\tEnd\n\tCustomData text\nEnd`],
    ])("Given %p throws", (input) => {
        const meta = new TblsMetaData();
        expect(() => meta.parse(SmlElement.parse(input))).toThrowError();
    });
});
// ----------------------------------------------------------------------
test("TblsDocument.constructor", () => {
    const table1 = new TblDocument(["Column1", "Column2"]);
    let document = new TblsDocument();
    document.tables.push(table1);
    expect(document.toString()).toEqual(`Tables\n\tTable\n\t\tColumn1 Column2\n\tEnd\nEnd`);
    document = new TblsDocument(null);
    document.tables.push(table1);
    expect(document.toString()).toEqual(`Tables\n\tTable\n\t\tColumn1 Column2\n\tEnd\nEnd`);
    document = new TblsDocument([table1]);
    expect(document.toString()).toEqual(`Tables\n\tTable\n\t\tColumn1 Column2\n\tEnd\nEnd`);
});
describe("TblsDocument.parse", () => {
    test.each([
        [`Tables\n\tTable\n\t\tColumn1 Column2\n\tEnd\nEnd`],
        [`Tables\n\tMeta\n\t\tDescription Text\n\tEnd\n\tTable\n\t\tColumn1 Column2\n\tEnd\nEnd`],
    ])("Given %p", (input) => {
        const document = TblsDocument.parse(input);
        expect(document.toString()).toEqual(input);
    });
    test.each([
        [`Document\nEnd`],
        [`Tables\n\tTable\n\t\tColumn1 Column2\n\tEnd\n\tMeta\n\t\tDescription Text\n\tEnd\nEnd`],
    ])("Given %p throws", (input) => {
        expect(() => TblsDocument.parse(input)).toThrowError();
    });
});
test("TblsDocument.toAlignedString + toMinifiedString", () => {
    const document = TblsDocument.parse(`Tables\n\tMeta\n\t\tDescription Text\n\tEnd\n\tTable\n\t\tColumn1 Column2\n\t\tV11 V12\n\t\t"Long Value" -\n\tEnd\nEnd`);
    expect(document.toString(true, "  ")).toEqual(`Tables\n\tMeta\n\t\tDescription Text\n\tEnd\n\tTable\n\t\tColumn1       Column2\n\t\tV11           V12\n\t\t"Long Value"  -\n\tEnd\nEnd`);
    expect(document.toString(true)).toEqual(`Tables\n\tMeta\n\t\tDescription Text\n\tEnd\n\tTable\n\t\tColumn1      Column2\n\t\tV11          V12\n\t\t"Long Value" -\n\tEnd\nEnd`);
    expect(document.toMinifiedString()).toEqual(`Tables\nMeta\nDescription Text\n-\nTable\nColumn1 Column2\nV11 V12\n"Long Value" -\n-\n-`);
});
test("TblsDocument.toBytes + fromBytes", () => {
    const document = TblsDocument.parse(`Tables\n\tMeta\n\t\tDescription Text\n\tEnd\n\tTable\n\t\tColumn1 Column2\n\t\tV11 V12\n\t\t"Long Value" -\n\tEnd\nEnd`);
    const bytes = document.toBytes();
    const document2 = TblsDocument.fromBytes(bytes);
    expect(document.toString()).toEqual(document2.toString());
});
test("TblsDocument.toBase64String + fromBase64String", () => {
    const document = TblsDocument.parse(`Tables\n\tMeta\n\t\tDescription Text\n\tEnd\n\tTable\n\t\tColumn1 Column2\n\t\tV11 V12\n\t\t"Long Value" -\n\tEnd\nEnd`);
    const base64Str = document.toBase64String();
    const document2 = TblsDocument.fromBase64String(base64Str);
    expect(document.toString()).toEqual(document2.toString());
});
test("TblsDocument.parseElement", () => {
    const element = SmlElement.parse(`Tables\n\tTable\n\t\tColumn1 Column2\n\tEnd\nEnd`);
    const document = TblsDocument.parseElement(element);
    expect(document.toString()).toEqual(element.toString());
});
test("TblsDocument.toBinaryTbls + fromBinaryTbls", () => {
    const document = TblsDocument.parse(`Tables\n\tTable\n\t\tColumn1 Column2\n\tEnd\nEnd`);
    const bytes = document.toBinaryTbls();
    const decodedDocument = TblsDocument.fromBinaryTbls(bytes);
    expect(document.toString()).toEqual(decodedDocument.toString());
});
//# sourceMappingURL=tbl.test.js.map