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