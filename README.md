# TBL

## About TBL

TBL is a data table format based on [SML](https://www.npmjs.com/package/@stenway/sml) - the Simple Markup Language. TBL is a modern and robust alternative to CSV. It has only a minimal set of rules and solves
the main problems of CSV (watch [this video](https://www.youtube.com/watch?v=mGUlW6YgHjE) for more details on that). It's human friendly and can produce documents that are beautifully formatted
and readable, even without specific tools, just opened in a text editor. Here is an example TBL document:

```
Table
  Meta
    Title       "My Table"
    Description "This is a description of my table"		
  End
  FirstName      LastName  Age PlaceOfBirth
  William        Smith     30  Boston
  Olivia         Jones     27  "San Francisco"
  Lucas          Brown     -   Chicago          # Age missing
  "James Elijah" Wilson    20  "New York City"
  Elizabeth      Miller                         # Data missing
  Victoria       Davis     22  Austin
End
```

It has support for meta data, can differentiate between null values and empty values, and can contain comments.
TBL **doesn't need to bother about encoding and decoding** anymore, because it relies on [ReliableTXT](https://www.reliabletxt.com), which takes care of that aspect (see also the NPM package [reliabletxt](https://www.npmjs.com/package/@stenway/reliabletxt)).

A TBL document represents a single table. If you need to embed multiple tables into one document, TBLS comes into play:

```
Tables
  Table
    Column1 Column2
	Value1  Value2
  End
  Table
    ColumnA ColumnB
	ValueA  ValueB
  End
End
```

Find out what can be done with TBL and TBLS on the official [YouTube channel from Stenway](https://www.youtube.com/@stenway) and get started with videos like:
* [TBL - A Simple Table Format with SML](https://www.youtube.com/watch?v=BkASqYznmE8)
* [TBLS - Multiple Tables in ONE File](https://www.youtube.com/watch?v=66qRRRVKbUI)
* [Stenway Text File Format Stack](https://www.youtube.com/watch?v=m7Z0mrcFeCg)
* [RSS to TBLS](https://www.youtube.com/watch?v=EmYF6RkSpIM)
* [Opening WSV, TBL and TBLS Files with LibreOffice](https://www.youtube.com/watch?v=S4GbszMYAoM)
* [Stop Using CSV !](https://www.youtube.com/watch?v=mGUlW6YgHjE)
* [Writing SML on a typewriter](https://www.youtube.com/watch?v=sa1yln1kH1k)

## About this package

This package provides functionality to handle the **parsing and serialization** of TBL and TBLS documents. It also provides functionality to encode and decode the binary version of TBL, which is called BinaryTBL.
The package **works both in the browser and Node.js**, because it does not require environment specific functionality.
If you want to **read and write TBL files** using Node.js's file system module, you can use the **[tbl-io](https://www.npmjs.com/package/@stenway/tbl-io)** package.
The **[tbl-browser](https://www.npmjs.com/package/@stenway/tbl-browser)** package on the other hand
offers functionality to easily provide TBL documents as downloadable files.

## Getting started

We first have to install the Stenway TBL package with the npm install command.

```
npm install @stenway/tbl
```

Then import the TblDocument class and create a new TblDocument object by calling
the static parse method:

```ts
import { TblDocument } from "@stenway/tbl"
const document = TblDocument.parse("Table\nColumn1 Column2\nValue1 Value2\nEnd")
console.log(document)
```

Add a new row with the addRow method like this:

```ts
document.addRow(["ValueA", "ValueB"])
```

More documentation about the other classes, methods and properties will follow.

## BinaryTBL

BinaryTBL is the binary representation of TBL documents. It's based on BinarySML.
You can encode a document to BinaryTBL with the toBinaryTbl method and decode it
with the static method fromBinaryTbl:

```ts
const document = TblDocument.parse(`Table\nColumn1 Column2\nValue1 Value2\nEnd`)
const bytes = document.toBinaryTbl()
const decodedDocument = SmlDocument.fromBinaryTbl(bytes)
```