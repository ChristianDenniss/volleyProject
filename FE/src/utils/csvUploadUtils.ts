import { parseCSV, generateCSVTemplate } from './csvParser';

export const handleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    setCsvFile: (file: File | null) => void,
    setCsvContent: (content: string) => void,
    setCsvPreview: (preview: any) => void,
    setCsvParseError: (error: string) => void,
    showErrorModal: (err: any) => void
) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
        setCsvParseError("Please select a CSV file");
        showErrorModal("Please select a CSV file");
        return;
    }

    setCsvFile(file);
    setCsvParseError("");

    const reader = new FileReader();
    reader.onload = (e) => {
        const content = e.target?.result as string;
        setCsvContent(content);
        
        try {
            const parsed = parseCSV(content);
            setCsvPreview(parsed);
            setCsvParseError("");
        } catch (error: any) {
            setCsvParseError(error.message);
            setCsvPreview(null);
            showErrorModal(error);
        }
    };
    reader.readAsText(file);
};

export const downloadTemplate = () => {
    const template = generateCSVTemplate();
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stats_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}; 