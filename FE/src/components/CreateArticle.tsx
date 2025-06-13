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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear validation errors when user starts typing
        setValidationErrors([]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            console.error('User not authenticated');
            setSubmitStatus('error');
            setValidationErrors(['You must be logged in to create an article']);
            return;
        }

        try {
            const result = await createArticle({
                ...formData,
                authorId: user.id,
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
                    />
                    <div className="character-count">
                        Characters: {formData.title.length}/1 (minimum)
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
                    />
                    <div className="character-count">
                        Characters: {formData.summary.length}/50 (minimum)
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
                    />
                    <div className="url-hint">
                        Must be a valid URL (e.g., https://example.com/image.jpg)
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
                    />
                    <div className="character-count">
                        Characters: {formData.content.length}/240 (minimum)
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" onClick={() => navigate('/articles')} className="cancel-btn">
                        Cancel
                    </button>
                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? 'Creating...' : 'Create Article'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateArticle; 