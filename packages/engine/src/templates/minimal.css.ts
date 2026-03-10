const css = `/* MarkView Minimal Template — Black/white, reduced, ideal for print */

.markview-document {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: #000;
  background: #fff;
}

/* Headings */
.markview-document h1 {
  font-size: 1.8em;
  margin-top: 1.5em;
  margin-bottom: 0.4em;
  font-weight: 700;
}

.markview-document h2 {
  font-size: 1.4em;
  margin-top: 1.3em;
  margin-bottom: 0.3em;
  font-weight: 600;
}

.markview-document h3 {
  font-size: 1.15em;
  margin-top: 1.2em;
  margin-bottom: 0.3em;
  font-weight: 600;
}

.markview-document h4 {
  font-size: 1em;
  margin-top: 1.1em;
  margin-bottom: 0.3em;
  font-weight: 600;
}

/* Paragraphs */
.markview-document p {
  margin: 0.6em 0;
}

.markview-document a {
  color: #000;
  text-decoration: underline;
}

.markview-document img {
  max-width: 100%;
  height: auto;
}

/* Code */
.markview-document pre {
  background: #f5f5f5;
  padding: 0.8rem;
  border: 1px solid #ddd;
  overflow-x: auto;
  font-size: 0.85em;
  line-height: 1.4;
}

.markview-document code {
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.9em;
}

.markview-document :not(pre) > code {
  background: #f5f5f5;
  padding: 0.1em 0.3em;
  border: 1px solid #ddd;
}

/* Blockquotes */
.markview-document blockquote {
  border-left: 2px solid #000;
  margin: 0.8em 0;
  padding: 0.3em 0.8em;
  color: #333;
}

/* Tables */
.markview-document table {
  border-collapse: collapse;
  width: 100%;
  margin: 0.8em 0;
}

.markview-document th,
.markview-document td {
  border: 1px solid #000;
  padding: 0.4em 0.6em;
  text-align: left;
}

.markview-document th {
  font-weight: bold;
}

/* Lists */
.markview-document ul,
.markview-document ol {
  padding-left: 1.5em;
  margin: 0.4em 0;
}

.markview-document li {
  margin: 0.15em 0;
}

/* Horizontal rule */
.markview-document hr {
  border: none;
  border-top: 1px solid #000;
  margin: 1.5em 0;
}

/* Mermaid diagrams */
.markview-document .mermaid-diagram {
  text-align: center;
  margin: 1em 0;
}

/* Header/Footer areas */
.markview-header,
.markview-footer {
  font-size: 0.8em;
  color: #333;
  padding: 0.3em 0;
}

.markview-header {
  border-bottom: 1px solid #000;
  margin-bottom: 1em;
}

.markview-footer {
  border-top: 1px solid #000;
  margin-top: 1em;
  text-align: center;
}

/* Print styles */
@media print {
  .markview-document {
    max-width: none;
    padding: 0;
  }

  h1, h2, h3, h4 {
    page-break-after: avoid;
  }

  pre, table {
    page-break-inside: avoid;
  }
}`;

export default css;
