import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateArticles } from '../hooks/allCreate';
import { useAuth } from '../context/authContext';
import '../styles/CreateArticle.css';

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!user) {
            setValidationErrors(['You must be logged in to create an article']);
            return;
        }

        if (!isFormValid()) {
            setValidationErrors(['Please fix all validation errors before submitting']);
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
        <div className="create-article-container">
            <h1>Create New Article</h1>
            <div className="approval-notice">
                Note: Your article will be reviewed by an administrator before being published.
            </div>
            <div className="requirements-notice">
                <h3>Article Requirements:</h3>
                <ul>
                    <li>Title: At least 1 character</li>
                    <li>Summary: At least 50 characters</li>
                    <li>Content: At least 240 characters</li>
                    <li>Image URL: Must be a valid URL</li>
                </ul>
            </div>
            <form onSubmit={handleSubmit} className="create-article-form">
                {error && <div className="error-message">{error}</div>}
                {validationErrors.length > 0 && (
                    <div className="error-message">
                        <ul>
                            {validationErrors.map((err, index) => (
                                <li key={index}>{err}</li>
                            ))}
                        </ul>
                    </div>
                )}
                {submitStatus === 'success' && (
                    <div className="success-message">
                        Article submitted successfully! Redirecting to articles page...
                    </div>
                )}
                
                <div className="form-group">
                    <label htmlFor="title">Title</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        className={!fieldValidation.title.isValid && formData.title ? 'invalid' : ''}
                    />
                    <div className="character-count">
                        Characters: {formData.title.length}/1 (minimum)
                        {!fieldValidation.title.isValid && formData.title && (
                            <span className="validation-message">{fieldValidation.title.message}</span>
                        )}
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="summary">Summary</label>
                    <input
                        type="text"
                        id="summary"
                        name="summary"
                        value={formData.summary}
                        onChange={handleChange}
                        required
                        className={!fieldValidation.summary.isValid && formData.summary ? 'invalid' : ''}
                    />
                    <div className="character-count">
                        Characters: {formData.summary.length}/50 (minimum)
                        {!fieldValidation.summary.isValid && formData.summary && (
                            <span className="validation-message">{fieldValidation.summary.message}</span>
                        )}
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="imageUrl">Image URL</label>
                    <input
                        type="url"
                        id="imageUrl"
                        name="imageUrl"
                        value={formData.imageUrl}
                        onChange={handleChange}
                        required
                        className={!fieldValidation.imageUrl.isValid && formData.imageUrl ? 'invalid' : ''}
                    />
                    <div className="url-hint">
                        Must be a valid URL (e.g., https://example.com/image.jpg)
                        {!fieldValidation.imageUrl.isValid && formData.imageUrl && (
                            <span className="validation-message">{fieldValidation.imageUrl.message}</span>
                        )}
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="content">Content</label>
                    <textarea
                        id="content"
                        name="content"
                        value={formData.content}
                        onChange={handleChange}
                        required
                        rows={10}
                        className={!fieldValidation.content.isValid && formData.content ? 'invalid' : ''}
                    />
                    <div className="character-count">
                        Characters: {formData.content.length}/240 (minimum)
                        {!fieldValidation.content.isValid && formData.content && (
                            <span className="validation-message">{fieldValidation.content.message}</span>
                        )}
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" onClick={() => navigate('/articles')} className="cancel-btn">
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        className="submit-btn" 
                        disabled={loading || !isFormValid()}
                    >
                        {loading ? 'Creating...' : 'Create Article'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateArticle; 