# TBL

## About

TBL is a data table format based on SML ([SML Documentation/Specification](https://www.simpleml.com)).

## Installation

Using NPM:
```
npm install @stenway/tbl
```

## Getting started

```ts
import { TblDocument } from "@stenway/tbl"
console.log(TblDocument.parse("Table\nColumn1 Column2\nValue1 Value2\nEnd"))
```

## BinaryTBL

BinaryTBL is the binary representation of TBL documents. It's based on BinarySML.

Usage:
```ts
const document = TblDocument.parse(`Table\nColumn1 Column2\nValue1 Value2\nEnd`)
const bytes = document.toBinaryTbl()
const decodedDocument = SmlDocument.fromBinaryTbl(bytes)
```