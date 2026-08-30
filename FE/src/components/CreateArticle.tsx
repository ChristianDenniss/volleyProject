/**
 * CreateArticle — the article submission form: title, summary, image URL and body, each with a live character counter against its minimum length.
 * Validation rules live in one `FIELD_RULES` map that drives the counters, the per-field invalid state and the "please fix these" summary, so a rule and the message explaining it can't drift apart.
 * Lives in `components/`; routed at /articles/create. Submissions arrive unapproved and are moderated in the portal's ArticlesPage.
 */
import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateArticles } from '@/hooks/allCreate'
import { useAuth } from '@/context/authContext'

import PageContainer from '@/components/ui/layout/PageContainer'
import PageHeader from '@/components/ui/layout/PageHeader'
import Button from '@/components/ui/buttons/Button'
import ErrorNotice from '@/components/ui/feedback/ErrorNotice'
import FormField from '@/components/ui/inputs/FormField'
import TextInput, { TextArea } from '@/components/ui/inputs/TextInput'

const REDIRECT_DELAY_MS = 2000

type FieldName = 'title' | 'summary' | 'imageUrl' | 'content'

interface FieldRule {
  label: string
  /** Minimum character count, for the counter. `url` fields have no count. */
  minLength?: number
  message: string
  isValid: (value: string) => boolean
}

/** One rule per field: the counter, the invalid state and the error summary all read from here. */
const FIELD_RULES: Record<FieldName, FieldRule> = {
  title: {
    label: 'Title',
    minLength: 1,
    message: 'Title must be at least 1 character',
    isValid: (value) => value.length >= 1,
  },
  summary: {
    label: 'Summary',
    minLength: 50,
    message: 'Summary must be at least 50 characters',
    isValid: (value) => value.length >= 50,
  },
  imageUrl: {
    label: 'Image URL',
    message: 'Please enter a valid URL',
    isValid: (value) => {
      try {
        new URL(value)
        return true
      } catch {
        return false
      }
    },
  },
  content: {
    label: 'Content',
    minLength: 240,
    message: 'Content must be at least 240 characters',
    isValid: (value) => value.length >= 240,
  },
}

const FIELD_ORDER: FieldName[] = ['title', 'summary', 'imageUrl', 'content']

const EMPTY_FORM: Record<FieldName, string> = {
  title: '',
  summary: '',
  imageUrl: '',
  content: '',
}

interface BackendValidationError {
  message: string
  errors?: { message: string; path: string[] }[]
}

export default function CreateArticle() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { createArticle, loading, error } = useCreateArticles()

  const [form, setForm] = useState(EMPTY_FORM)
  const [submitted, setSubmitted] = useState(false)
  const [success, setSuccess] = useState(false)
  const [serverErrors, setServerErrors] = useState<string[]>([])

  const invalidFields = useMemo(
    () => FIELD_ORDER.filter((name) => !FIELD_RULES[name].isValid(form[name])),
    [form]
  )

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setServerErrors([])
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)

    if (!user) {
      setServerErrors(['You must be logged in to create an article'])
      return
    }
    if (invalidFields.length > 0) return

    try {
      const result = await createArticle({
        ...form,
        userId: user.id,
        createdAt: new Date().toISOString(),
        approved: null, // Articles start pending approval.
      })

      if (!result) {
        setServerErrors(['Failed to submit article. Please try again.'])
        return
      }

      setSuccess(true)
      setTimeout(() => navigate('/articles'), REDIRECT_DELAY_MS)
    } catch (err) {
      const validation = err as BackendValidationError
      setServerErrors(
        validation?.message === 'Validation failed' && validation.errors
          ? validation.errors.map((e) => e.message)
          : ['Failed to submit article. Please try again.']
      )
    }
  }

  /** Only flag a field once the reader has typed in it or tried to submit. */
  const fieldError = (name: FieldName) => {
    const rule = FIELD_RULES[name]
    const touched = submitted || form[name].length > 0
    return touched && !rule.isValid(form[name]) ? rule.message : null
  }

  const counterFor = (name: FieldName) => {
    const rule = FIELD_RULES[name]
    if (!rule.minLength) return undefined
    return `Characters: ${form[name].length}/${rule.minLength} (minimum)`
  }

  return (
    <PageContainer width="narrow">
      <PageHeader
        title="Create Article"
        subtitle="Your article will be reviewed by an administrator before being published."
      />

      {error && <ErrorNotice message={error} />}

      {serverErrors.length > 0 && (
        <ErrorNotice
          message={
            <ul className="m-0 flex list-disc flex-col gap-1 pl-5">
              {serverErrors.map((message, index) => (
                <li key={index}>{message}</li>
              ))}
            </ul>
          }
        />
      )}

      {submitted && invalidFields.length > 0 && (
        <ErrorNotice
          tone="warning"
          title="Please fix the following issues"
          message={
            <ul className="m-0 flex list-disc flex-col gap-1 pl-5">
              {invalidFields.map((name) => (
                <li key={name}>
                  <strong>{FIELD_RULES[name].label}:</strong> {FIELD_RULES[name].message}
                </li>
              ))}
            </ul>
          }
        />
      )}

      {success && (
        <ErrorNotice
          tone="info"
          message="Article submitted successfully! Redirecting to the articles page…"
        />
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField label="Title" required hint={counterFor('title')} error={fieldError('title')}>
          {(id) => (
            <TextInput
              id={id}
              name="title"
              value={form.title}
              onChange={handleChange}
              invalid={Boolean(fieldError('title'))}
              required
            />
          )}
        </FormField>

        <FormField
          label="Summary"
          required
          hint={counterFor('summary')}
          error={fieldError('summary')}
        >
          {(id) => (
            <TextInput
              id={id}
              name="summary"
              value={form.summary}
              onChange={handleChange}
              invalid={Boolean(fieldError('summary'))}
              required
            />
          )}
        </FormField>

        <FormField
          label="Image URL"
          required
          hint="Discord image links are not accepted. Upload to a trusted image host first."
          error={fieldError('imageUrl')}
        >
          {(id) => (
            <TextInput
              id={id}
              name="imageUrl"
              type="url"
              value={form.imageUrl}
              onChange={handleChange}
              invalid={Boolean(fieldError('imageUrl'))}
              required
            />
          )}
        </FormField>

        <FormField
          label="Content"
          required
          hint={counterFor('content')}
          error={fieldError('content')}
        >
          {(id) => (
            <TextArea
              id={id}
              name="content"
              rows={10}
              value={form.content}
              onChange={handleChange}
              invalid={Boolean(fieldError('content'))}
              required
            />
          )}
        </FormField>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/articles')}>
            Cancel
          </Button>
          <Button type="submit" loading={loading} loadingLabel="Creating…">
            Create Article
          </Button>
        </div>
      </form>
    </PageContainer>
  )
}
