import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateArticles } from '../hooks/allCreate';
import { useAuth } from '../context/authContext';
import '../styles/CreateArticle.css';

const CreateArticle: React.FC = () => {
    const navigate = useNavigate();
    const { createArticle, loading, error } = useCreateArticles();
    const { user } = useAuth();
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
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            console.error('User not authenticated');
            return;
        }

        try {
            await createArticle({
                ...formData,
                authorId: user.id,
                createdAt: new Date().toISOString(),
                approved: null // Articles start as pending approval
            });
            navigate('/articles');
        } catch (error) {
            console.error('Error creating article:', error);
        }
    };

    return (
        <div className="create-article-container">
            <h1>Create New Article</h1>
            <div className="approval-notice">
                Note: Your article will be reviewed by an administrator before being published.
            </div>
            <form onSubmit={handleSubmit} className="create-article-form">
                {error && <div className="error-message">{error}</div>}
                
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