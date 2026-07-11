const MIN_PASSWORD_LENGTH = 12;

const HAS_UPPERCASE = /[A-Z]/;
const HAS_LOWERCASE = /[a-z]/;
const HAS_DIGIT = /\d/;

export function validatePasswordStrength(password: string): void {
    if (!password) {
        throw new Error("Password is required");
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
        throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long`);
    }

    if (!HAS_UPPERCASE.test(password) || !HAS_LOWERCASE.test(password) || !HAS_DIGIT.test(password)) {
        throw new Error("Password must include uppercase, lowercase, and a number");
    }
}

export const PASSWORD_MIN_LENGTH = MIN_PASSWORD_LENGTH;
