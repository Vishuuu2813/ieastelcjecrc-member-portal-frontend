import { readFile, utils } from 'xlsx';

const excelPath = './src/assets/JU_Courses_IAESTE_DATA_ITDA.xlsx';
try {
    const workbook = readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = utils.sheet_to_json(sheet);
    console.log(JSON.stringify(data.slice(0, 10), null, 2));
} catch (e) {
    console.error(e);
}
