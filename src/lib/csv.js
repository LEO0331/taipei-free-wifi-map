export function parseCsv(input) {
    const text = input.replace(/^\uFEFF/, '');
    const rows = [];
    let row = [];
    let field = '';
    let quoted = false;
    for (let index = 0; index < text.length; index += 1) {
        const character = text[index];
        const next = text[index + 1];
        if (character === '"') {
            if (quoted && next === '"') {
                field += '"';
                index += 1;
            }
            else {
                quoted = !quoted;
            }
        }
        else if (character === ',' && !quoted) {
            row.push(field);
            field = '';
        }
        else if ((character === '\n' || character === '\r') && !quoted) {
            if (character === '\r' && next === '\n')
                index += 1;
            row.push(field);
            if (row.some((value) => value.length > 0))
                rows.push(row);
            row = [];
            field = '';
        }
        else {
            field += character;
        }
    }
    if (field || row.length) {
        row.push(field);
        rows.push(row);
    }
    const [header = [], ...body] = rows;
    return body.map((values) => Object.fromEntries(header.map((name, index) => [name.trim(), values[index] ?? ''])));
}
