import { CustomError } from "./CustomError.ts";

export class DateError extends CustomError
{
    constructor(date1: Date, date2: Date)
    {
        super(`Our start date of ${date1} must be before our end date of ${date2}`, 422 );
        this.name = 'DateError';
    }
}
