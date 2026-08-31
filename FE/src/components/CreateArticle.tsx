import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateArticles } from '../hooks/allCreate';
import { useAuth } from '../context/authContext';

const container = "p-[2rem] max-w-[1100px] my-0 mx-auto w-full box-border";

const approvalNotice =
    "bg-[#fff3cd] text-[#856404] py-[12px] px-[16px] rounded-sm mb-[1.5rem] border border-solid border-[#ffeeba]";

const errorBox =
    "bg-[#f8d7da] text-[#721c24] py-[12px] px-[16px] rounded-sm mb-[1.5rem] border border-solid border-[#f5c6cb]";

const errorList = "my-[5px] mx-0 pl-[20px]";

const successBox =
    "bg-[#d4edda] text-[#155724] p-[10px] rounded-sm mb-[20px] border border-solid border-[#c3e6cb]";

const form =
    "bg-white py-[2rem] px-[2.5rem] rounded-md shadow-sm w-full box-border";

const formGroup = "mb-[24px]";

const fieldLabel = "block mb-[8px] font-medium text-[#333]";

const fieldControl =
    "w-full p-[12px] border border-solid border-[#ddd] rounded-sm text-[1rem]";

const fieldInvalid = "border-[#dc3545] bg-[#fff8f8]";

const textareaControl = `${fieldControl} resize-y min-h-[200px]`;

const characterCount =
    "text-[0.875rem] text-[#666] mt-[0.25rem] flex justify-between items-center";

const urlHint = "mt-[8px] text-[0.9rem] text-[#666]";

/* The hint has one paragraph, so it is both :first-child and :last-child.
   Those two rules are equal specificity and the last one wins. */
const urlHintText = "my-[4px] mx-0 leading-[1.4] text-[#c53030] font-medium";

const formActions = "flex gap-[12px] justify-end mt-[32px]";

const cancelBtn =
    "py-[12px] px-[24px] rounded-sm text-[1rem] cursor-pointer " +
    "transition-colors duration-200 ease-in-out bg-[#f8f9fa] border border-solid " +
    "border-[#ddd] text-[#333] hover:bg-[#e9ecef]";

const submitBtn =
    "py-[12px] px-[24px] rounded-sm text-[1rem] cursor-pointer " +
    "transition-colors duration-200 ease-in-out bg-brand-primary border-none " +
    "text-text-on-brand hover:bg-brand-primary-hover";

const modalOverlay =
    "fixed inset-0 bg-[rgba(0,0,0,0.5)] flex justify-center items-center z-[1000]";

const modalContent =
    "bg-white p-[2rem] rounded-md shadow-[0_4px_6px_rgba(0,0,0,0.1)] max-w-[500px] w-[90%]";

const modalTitle = "text-[#dc3545] mt-0 mb-[1rem]";

const modalList = "list-none p-0 mt-0 mb-[1.5rem]";

const modalItem = "mb-[0.5rem] text-[#333]";

const modalStrong = "text-[#dc3545]";

const closeModalBtn =
    "bg-brand-primary text-white border-none py-[0.5rem] px-[1rem] rounded-sm " +
    "cursor-pointer text-[1rem] transition-colors duration-200 ease-[ease] " +
    "hover:bg-brand-primary-hover";

interface ValidationError {
    message: string;
    errors: Array<{
        message: string;
        path: string[];
    }>;
}

const CreateArticle: React.FC = () => {
    const navigate = useNavigate();
    const { createArticle, loading, error } = useCreateArticles();
    const { user } = useAuth();
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [showValidationModal, setShowValidationModal] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        summary: '',
        content: '',
        imageUrl: ''
    });

    // Validation state for each field
    const [fieldValidation, setFieldValidation] = useState({
        title: { isValid: false, message: 'Title must be at least 1 character' },
        summary: { isValid: false, message: 'Summary must be at least 50 characters' },
        content: { isValid: false, message: 'Content must be at least 240 characters' },
        imageUrl: { isValid: false, message: 'Please enter a valid URL' }
    });

    const validateField = (name: string, value: string) => {
        switch (name) {
            case 'title':
                return value.length >= 1;
            case 'summary':
                return value.length >= 50;
            case 'content':
                return value.length >= 240;
            case 'imageUrl':
                try {
                    new URL(value);
                    return true;
                } catch {
                    return false;
                }
            default:
                return false;
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Update validation state for the changed field
        const isValid = validateField(name, value);
        setFieldValidation(prev => ({
            ...prev,
            [name]: {
                ...prev[name as keyof typeof prev],
                isValid
            }
        }));

        // Clear validation errors when user starts typing
        setValidationErrors([]);
    };

    const isFormValid = () => {
        return Object.values(fieldValidation).every(field => field.isValid);
    };

    const getInvalidFields = () => {
        return Object.entries(fieldValidation)
            .filter(([_, field]) => !field.isValid)
            .map(([name, field]) => ({
                name: name.charAt(0).toUpperCase() + name.slice(1),
                message: field.message
            }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!user) {
            setValidationErrors(['You must be logged in to create an article']);
            return;
        }

        if (!isFormValid()) {
            setShowValidationModal(true);
            return;
        }

        try {
            const result = await createArticle({
                ...formData,
                userId: user.id,
                createdAt: new Date().toISOString(),
                approved: null // Articles start as pending approval
            });

            if (result) {
                setSubmitStatus('success');
                // Wait 2 seconds to show success message before redirecting
                setTimeout(() => {
                    navigate('/articles');
                }, 2000);
            } else {
                setSubmitStatus('error');
            }
        } catch (error: any) {
            console.error('Error creating article:', error);
            setSubmitStatus('error');
            
            // Handle validation errors from the backend
            if (error.message === 'Validation failed' && error.errors) {
                const validationError = error as ValidationError;
                setValidationErrors(validationError.errors.map(err => err.message));
            } else {
                setValidationErrors(['Failed to submit article. Please try again.']);
            }
        }
    };

    return (
        <div className={container}>
            {showValidationModal && (
                <div className={modalOverlay}>
                    <div className={modalContent}>
                        <h3 className={modalTitle}>Please fix the following issues:</h3>
                        <ul className={modalList}>
                            {getInvalidFields().map((field, index) => (
                                <li key={index} className={modalItem}>
                                    <strong className={modalStrong}>{field.name}:</strong> {field.message}
                                </li>
                            ))}
                        </ul>
                        <button
                            className={closeModalBtn}
                            onClick={() => setShowValidationModal(false)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className={form}>
                <div className={approvalNotice}>
                    Note: Your article will be reviewed by an administrator before being published.
                </div>

                {error && <div className={errorBox}>{error}</div>}
                {validationErrors.length > 0 && (
                    <div className={errorBox}>
                        <ul className={errorList}>
                            {validationErrors.map((err, index) => (
                                <li key={index}>{err}</li>
                            ))}
                        </ul>
                    </div>
                )}
                {submitStatus === 'success' && (
                    <div className={successBox}>
                        Article submitted successfully! Redirecting to articles page...
                    </div>
                )}
                
                <div className={formGroup}>
                    <label htmlFor="title" className={fieldLabel}>Title</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        className={!fieldValidation.title.isValid && formData.title ? `${fieldControl} ${fieldInvalid}` : fieldControl}
                    />
                    <div className={characterCount}>
                        Characters: {formData.title.length}/1 (minimum)
                    </div>
                </div>

                <div className={formGroup}>
                    <label htmlFor="summary" className={fieldLabel}>Summary</label>
                    <input
                        type="text"
                        id="summary"
                        name="summary"
                        value={formData.summary}
                        onChange={handleChange}
                        required
                        className={!fieldValidation.summary.isValid && formData.summary ? `${fieldControl} ${fieldInvalid}` : fieldControl}
                    />
                    <div className={characterCount}>
                        Characters: {formData.summary.length}/50 (minimum)
                    </div>
                </div>

                <div className={formGroup}>
                    <label htmlFor="imageUrl" className={fieldLabel}>Image URL</label>
                    <input
                        type="url"
                        id="imageUrl"
                        name="imageUrl"
                        value={formData.imageUrl}
                        onChange={handleChange}
                        required
                        className={!fieldValidation.imageUrl.isValid && formData.imageUrl ? `${fieldControl} ${fieldInvalid}` : fieldControl}
                    />
                    <div className={urlHint}>
                        <p className={urlHintText}>Discord image links are not accepted. Please upload your image to a trusted image hosting service first.</p>
                    </div>
                </div>

                <div className={formGroup}>
                    <label htmlFor="content" className={fieldLabel}>Content</label>
                    <textarea
                        id="content"
                        name="content"
                        value={formData.content}
                        onChange={handleChange}
                        required
                        rows={10}
                        className={!fieldValidation.content.isValid && formData.content ? `${textareaControl} ${fieldInvalid}` : textareaControl}
                    />
                    <div className={characterCount}>
                        Characters: {formData.content.length}/240 (minimum)
                    </div>
                </div>

                <div className={formActions}>
                    <button type="button" onClick={() => navigate('/articles')} className={cancelBtn}>
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className={submitBtn}
                        disabled={loading}
                    >
                        {loading ? 'Creating...' : 'Create Article'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateArticle; 