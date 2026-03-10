const css = `/* TeamMind MarkView — Report Template */

@page {
  size: A4;
  margin: 2.5cm 2cm;
  counter-increment: page;

  @top-right {
    content: counter(page) " / " counter(pages);
    font-size: 10pt;
    color: #888;
  }
}

@page :first {
  margin-top: 0;
  @top-right {
    content: none;
  }
}

.markview-document {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  font-family: 'Georgia', 'Times New Roman', Times, serif;
  font-size: 12pt;
  line-height: 1.6;
  color: #1a1a1a;
  background: #fff;
}

/* Title page */
.markview-title-page {
  text-align: center;
  padding: 4em 0;
  page-break-after: always;
}

.markview-title-page h1 {
  font-size: 2.5em;
  margin-bottom: 0.5em;
  border: none;
}

.markview-title-page .title-author {
  font-size: 1.2em;
  color: #555;
  margin-top: 1em;
}

.markview-title-page .title-date {
  font-size: 1em;
  color: #777;
  margin-top: 0.5em;
}

/* Table of Contents */
.markview-toc {
  page-break-after: always;
  padding: 1em 0;
}

.markview-toc h2 {
  font-size: 1.5em;
  border-bottom: 2px solid #333;
  padding-bottom: 0.3em;
  margin-bottom: 1em;
}

.markview-toc ul {
  list-style: none;
  padding: 0;
}

.markview-toc li {
  margin: 0.4em 0;
  line-height: 1.4;
}

.markview-toc li a {
  color: #333;
  text-decoration: none;
  display: flex;
  align-items: baseline;
}

.markview-toc li a::after {
  content: '';
  flex: 1;
  border-bottom: 1px dotted #ccc;
  margin: 0 0.5em;
}

.markview-toc .toc-level-1 {
  font-weight: bold;
}

.markview-toc .toc-level-2 {
  padding-left: 1.5em;
}

.markview-toc .toc-level-3 {
  padding-left: 3em;
  font-size: 0.95em;
}

.markview-toc .toc-level-4 {
  padding-left: 4.5em;
  font-size: 0.9em;
}

/* Headings */
.markview-document h1 {
  font-size: 1.8em;
  margin-top: 2em;
  margin-bottom: 0.5em;
  border-bottom: 2px solid #333;
  padding-bottom: 0.3em;
  page-break-after: avoid;
}

.markview-document h2 {
  font-size: 1.4em;
  margin-top: 1.6em;
  margin-bottom: 0.4em;
  border-bottom: 1px solid #999;
  padding-bottom: 0.2em;
  page-break-after: avoid;
}

.markview-document h3 {
  font-size: 1.2em;
  margin-top: 1.4em;
  margin-bottom: 0.3em;
  page-break-after: avoid;
}

.markview-document h4 {
  font-size: 1.05em;
  margin-top: 1.2em;
  margin-bottom: 0.3em;
  font-style: italic;
  page-break-after: avoid;
}

/* Paragraphs */
.markview-document p {
  margin: 0.8em 0;
  text-align: justify;
}

.markview-document a {
  color: #0366d6;
  text-decoration: none;
}

.markview-document img {
  max-width: 100%;
  height: auto;
}

/* Code */
.markview-document pre {
  background: #f6f8fa;
  padding: 1rem;
  border-radius: 4px;
  border: 1px solid #e1e4e8;
  overflow-x: auto;
  font-size: 0.85em;
  line-height: 1.45;
  page-break-inside: avoid;
}

.markview-document code {
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.9em;
}

.markview-document :not(pre) > code {
  background: #f0f0f0;
  padding: 0.15em 0.35em;
  border-radius: 3px;
}

/* Blockquotes */
.markview-document blockquote {
  border-left: 3px solid #333;
  margin: 1em 0;
  padding: 0.5em 1em;
  background: #f9f9f9;
  color: #444;
  font-style: italic;
}

/* Tables */
.markview-document table {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
  page-break-inside: avoid;
}

.markview-document th,
.markview-document td {
  border: 1px solid #999;
  padding: 0.5em 0.7em;
  text-align: left;
}

.markview-document th {
  background: #eee;
  font-weight: bold;
}

/* Lists */
.markview-document ul,
.markview-document ol {
  padding-left: 2em;
  margin: 0.5em 0;
}

.markview-document li {
  margin: 0.2em 0;
}

/* Horizontal rule */
.markview-document hr {
  border: none;
  border-top: 1px solid #999;
  margin: 2em 0;
}

/* Mermaid diagrams */
.markview-document .mermaid-diagram {
  text-align: center;
  margin: 1.5em 0;
  page-break-inside: avoid;
}

/* Header/Footer areas */
.markview-header {
  position: running(header);
  font-size: 9pt;
  color: #888;
  border-bottom: 0.5pt solid #ccc;
  padding-bottom: 0.3em;
}

.markview-footer {
  position: running(footer);
  font-size: 9pt;
  color: #888;
  border-top: 0.5pt solid #ccc;
  padding-top: 0.3em;
  text-align: center;
}

/* Print styles */
@media print {
  .markview-document {
    max-width: none;
    padding: 0;
    font-size: 11pt;
  }

  h1, h2, h3, h4 {
    page-break-after: avoid;
  }

  pre, table, figure {
    page-break-inside: avoid;
  }
}`;

export default css;
