/**
 * Prose — the typography wrapper for long-form content pages (About, Privacy Policy, FAQ answers), styling the headings, paragraphs, lists and links of its children through descendant selectors.
 * Because Tailwind's preflight strips default element styling, editorial markup needs its rhythm restored somewhere; putting it here means a content page writes plain semantic HTML instead of decorating every `<h2>` and `<li>` by hand.
 * Lives in `components/ui/misc/`; wrap a page's body in it rather than adding per-page heading classes.
 */
import type { ReactNode } from 'react'

type ProseSize = 'sm' | 'md'

/** Descendant selectors, so the caller's markup stays clean semantic HTML. */
const PROSE_CLASSES = [
  'text-content-secondary',
  '[&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-content',
  '[&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-content',
  '[&_p]:my-3 [&_p]:leading-relaxed',
  '[&_ul]:my-3 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5 [&_ul]:pl-5 [&_ul]:list-disc',
  '[&_ol]:my-3 [&_ol]:flex [&_ol]:flex-col [&_ol]:gap-1.5 [&_ol]:pl-5 [&_ol]:list-decimal',
  '[&_li]:leading-relaxed [&_li]:marker:text-accent',
  '[&_a]:text-accent [&_a]:no-underline hover:[&_a]:underline',
  '[&_strong]:font-semibold [&_strong]:text-content',
  '[&_hr]:my-6 [&_hr]:border-0 [&_hr]:border-t [&_hr]:border-border',
  '[&_code]:rounded-control [&_code]:bg-surface-inset [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.875em]',
].join(' ')

const SIZE_CLASSES: Record<ProseSize, string> = {
  sm: 'text-sm',
  md: 'text-base',
}

interface Props {
  children: ReactNode
  size?: ProseSize
  className?: string
}

export default function Prose({ children, size = 'md', className = '' }: Props) {
  return <div className={`${PROSE_CLASSES} ${SIZE_CLASSES[size]} ${className}`}>{children}</div>
}
