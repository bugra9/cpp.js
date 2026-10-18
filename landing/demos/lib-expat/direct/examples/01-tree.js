export const imports = {
    '@crossbind/port-expat/expat.h': [
        'XML_ExpatVersionInfo',
        'XML_ParserCreate',
        'XML_SetElementHandler',
        'XML_SetCharacterDataHandler',
        'XML_Parse',
        'XML_Status',
        'XML_TRUE',
        'XML_GetErrorCode',
        'XML_ErrorString',
        'XML_GetCurrentLineNumber',
        'XML_GetCurrentColumnNumber',
        'XML_ParserFree',
        'readCString',
        'readPointerAt',
        'readBuffer',
        'releaseCallback',
    ],
};
export const note = 'Handlers are JavaScript functions, which cannot be sent to a worker, so the module runs on the page\'s thread and each handler is freed with `releaseCallback` (64 can be registered at a time). Attributes arrive as a handle to walk with `readPointerAt`, and character data as a handle that `readBuffer` reads for exactly its `length` bytes; `XML_Parse` wants the UTF-8 byte count too, `xml.length` stops one byte short here and fails with `unclosed token`.';
export const expected = ({ expat }) => [`Expat ${expat}`, '1 en Dune 9.99 EUR', "2 fr L'Étranger 7.50 EUR", '3 en Pride & Prejudice 5.25 GBP', 'mismatched tag at line 2, column 30'];
export const init = { useWorker: false };

export default async function example({ XML_ExpatVersionInfo, XML_ParserCreate, XML_SetElementHandler, XML_SetCharacterDataHandler, XML_Parse, XML_Status, XML_TRUE, XML_GetErrorCode, XML_ErrorString, XML_GetCurrentLineNumber, XML_GetCurrentColumnNumber, XML_ParserFree, readCString, readPointerAt, readBuffer, releaseCallback }, console) {
    const version = XML_ExpatVersionInfo();
    console.log('Expat', `${version.major}.${version.minor}.${version.micro}`);
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const parse = (xml) => {
        const root = { children: [] };
        const open = [root];
        const onStart = (data, name, attributes) => {
            const element = { name, attributes: {}, children: [], text: '' };
            for (let i = 0; readPointerAt(attributes, i); i += 2) {
                element.attributes[readCString(readPointerAt(attributes, i))] = readCString(readPointerAt(attributes, i + 1));
            }
            open.at(-1).children.push(element);
            open.push(element);
        };
        const onEnd = () => open.pop();
        const onText = (data, text, length) => {
            open.at(-1).text += decoder.decode(readBuffer(text, length));
        };
        const parser = XML_ParserCreate(null);
        try {
            XML_SetElementHandler(parser, onStart, onEnd);
            XML_SetCharacterDataHandler(parser, onText);
            if (XML_Parse(parser, xml, encoder.encode(xml).length, XML_TRUE) !== XML_Status.XML_STATUS_OK) {
                throw new Error(`${readCString(XML_ErrorString(XML_GetErrorCode(parser)))} at line ${XML_GetCurrentLineNumber(parser)}, column ${XML_GetCurrentColumnNumber(parser)}`);
            }
            return root.children[0];
        } finally {
            XML_ParserFree(parser);
            for (const handler of [onStart, onEnd, onText]) releaseCallback(handler);
        }
    };

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <catalog>
        <book id="1" lang="en"><title>Dune</title><price currency="EUR">9.99</price></book>
        <book id="2" lang="fr"><title>L'Étranger</title><price currency="EUR">7.50</price></book>
        <book id="3" lang="en"><title>Pride &amp; Prejudice</title><price currency="GBP">5.25</price></book>
    </catalog>`;
    const catalog = parse(xml);
    for (const book of catalog.children) {
        const [title, price] = book.children;
        console.log(book.attributes.id, book.attributes.lang, title.text, price.text, price.attributes.currency);
    }

    try {
        parse('<catalog>\n    <book id="4"><title>Emma</book>\n</catalog>');
    } catch (error) {
        console.log(error.message);
    }
}
