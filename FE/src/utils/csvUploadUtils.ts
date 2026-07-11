import { parseCSV } from './csvParser';

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
            showErrorModal(error);
            setCsvPreview(null);
        }
    };
    reader.readAsText(file);
};