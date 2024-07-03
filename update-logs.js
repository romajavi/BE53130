const fs = require('fs').promises;
const path = require('path');

async function updateLogs() {
    try {
        const data = await fs.readFile('modificaciones.txt', 'utf8');
        const lines = data.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
            const [filePath, ...rest] = line.split(' ');
            const relevantParts = rest.slice(0, -3);
            const midPoint = relevantParts.findIndex(item => item.startsWith('logger.'));
            const oldLog = relevantParts.slice(0, midPoint).join(' ');
            const newLog = relevantParts.slice(midPoint).join(' ');

            const fullPath = path.join(process.cwd(), filePath);

            let content = await fs.readFile(fullPath, 'utf8');

            const oldLogEscaped = oldLog.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const newLogEscaped = newLog.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            // Verifica si el nuevo log ya existe
            const newLogRegex = new RegExp(`^.*${newLogEscaped}.*$`, 'm');
            if (newLogRegex.test(content)) {
                console.log(`Log already updated in ${filePath}`);
                continue;
            }

            const regex = new RegExp(`^.*${oldLogEscaped}.*$`, 'm');

            if (regex.test(content)) {
                content = content.replace(regex, (match) => {
                    return match.replace(oldLog, newLog);
                });
                await fs.writeFile(fullPath, content, 'utf8');
                console.log(`Updated: ${filePath}`);
            } else {
                console.log(`No changes needed in ${filePath}`);
            }
        }

        console.log('All logs have been processed.');
    } catch (error) {
        console.error('An error occurred:', error);
    }
}

updateLogs();