/**
 * Shared utility strings for the auth surfaces.
 *
 * Login.css was imported by both Login and SignUp, so its classes were shared
 * across two components rather than owned by one. These constants keep that
 * sharing explicit now that the stylesheet is gone - editing the card here
 * still changes both pages, exactly as editing the CSS rule used to.
 *
 * The form's controls were styled by descendant selectors (`.auth-form input`,
 * `.auth-form button`), not by classes on the elements. They stay descendant
 * rules here through [&_input] and [&_button], so the markup needs no per-field
 * classes and unlabelled inputs added later pick the styling up the same way
 * they always did.
 */

export const authContainer =
    "bg-white rounded-[12px] shadow-[0_8px_24px_rgba(0,0,0,0.1)] w-auto " +
    "max-w-[700px] min-w-[500px] py-[2.5rem] px-[2rem] box-border text-center " +
    "mt-[4rem] mx-auto mb-[var(--space-8)] " +
    "upto-420:py-[2rem] upto-420:px-[1.5rem] " +
    "[&_h2]:m-0 [&_h2]:mb-[1.5rem] [&_h2]:text-[1.75rem] [&_h2]:font-semibold " +
    "[&_h2]:text-brand-primary [&_h2]:tracking-[1px]";

const banner = "text-white py-[0.75rem] px-[1rem] rounded-[6px] mb-[1rem] text-[0.9rem]";

export const authError = banner + " bg-[var(--error-bg)]";
export const authSuccess = banner + " bg-[#2ECC71]";

export const authForm =
    "flex flex-col gap-[1rem] " +
    "[&_label]:flex [&_label]:flex-col [&_label]:text-left [&_label]:text-[0.9rem] [&_label]:font-medium " +
    "[&_input]:mt-[0.5rem] [&_input]:py-[0.75rem] [&_input]:px-[1rem] [&_input]:text-[1rem] " +
    "[&_input]:border [&_input]:border-[#DDD] [&_input]:rounded-[6px] [&_input]:outline-none " +
    "[&_input]:transition-[border-color] [&_input]:duration-200 [&_input]:ease-[ease] " +
    "[&_input:focus]:border-brand-primary " +
    "[&_input:focus]:shadow-[0_0_0_2px_var(--color-focus-ring)] " +
    "[&_button]:mt-[1rem] [&_button]:p-[0.85rem] [&_button]:text-[1rem] [&_button]:font-semibold " +
    "[&_button]:bg-brand-primary [&_button]:text-white [&_button]:border-none [&_button]:rounded-[6px] " +
    "[&_button]:cursor-pointer [&_button]:transition-[background-color] [&_button]:duration-300 " +
    "[&_button]:ease-[ease] " +
    "[&_button:disabled]:bg-[rgba(var(--color-brand-primary-rgb),0.45)] " +
    "[&_button:disabled]:cursor-not-allowed " +
    "[&_button:not(:disabled):hover]:bg-brand-primary-hover";

/* ease-[ease] is not redundant. The shorthand `transition: text-decoration 0.2s`
   omits a timing function, which CSS defaults to `ease`; Tailwind's default is
   cubic-bezier(0.4, 0, 0.2, 1), so leaving it off would change the curve. */
export const authLink =
    "block mt-[1.25rem] text-[0.9rem] text-brand-primary no-underline cursor-pointer " +
    "transition-[text-decoration] duration-200 ease-[ease] hover:underline";

/* The original hardcoded #2d3c50, which is the same value as
   --color-brand-primary; mapped onto the token per the foundation commit, so
   the button follows the brand colour rather than drifting from it. */
export const authSsoButton =
    "block w-full mt-[0.75rem] py-[0.65rem] px-[1rem] bg-white border border-brand-primary " +
    "text-brand-primary cursor-pointer rounded-[4px] font-semibold hover:bg-[#f3f6f9]";
